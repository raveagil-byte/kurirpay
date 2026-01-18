import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { logAudit } from '../services/auditService';
import { createNotification } from '../services/notificationService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

// Get all deliveries (Admin sees all, Courier sees theirs)
export const getDeliveries = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (user.role !== 'ADMIN') {
        whereClause = { courierId: user.userId };
    }

    const [deliveries, total] = await Promise.all([
        prisma.delivery.findMany({
            where: whereClause,
            include: { courier: { select: { name: true, email: true } } },
            orderBy: { date: 'desc' },
            take: limit,
            skip: skip
        }),
        prisma.delivery.count({ where: whereClause })
    ]);

    res.json({
        data: deliveries,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// Validation Schema
const createDeliverySchema = z.object({
    date: z.string().transform((str) => new Date(str)),
    itemCount: z.number().min(1, "Minimal 1 paket"),
    notes: z.string().optional()
});

// Create a new delivery report
export const createDelivery = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    // Validate Input
    const validation = createDeliverySchema.safeParse(req.body);

    if (!validation.success) {
        return next(new AppError((validation.error as any).errors[0].message, 400));
    }

    const validatedData = validation.data;

    // Fetch current rate from Settings (or use default 3000 if not set)
    let settings = await prisma.systemSettings.findFirst();
    const currentRate = settings?.deliveryRate || 3000;

    const calculatedTotal = validatedData.itemCount * currentRate;

    const delivery = await prisma.delivery.create({
        data: {
            courierId: user.userId,
            date: validatedData.date,
            itemCount: validatedData.itemCount,
            ratePerItem: currentRate,
            totalAmount: calculatedTotal,
            notes: validatedData.notes,
            status: 'PENDING',
            paymentStatus: 'UNPAID'
        }
    });

    // Audit Log
    await logAudit(user.userId, 'CREATE_DELIVERY', 'Delivery', delivery.id, { count: validatedData.itemCount }, req.ip);

    res.status(201).json(delivery);
});

// Update delivery (Admin: Approve/Reject/Pay, Courier: Request Payout)
export const updateDelivery = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = (req as any).user;

    // Clone body to avoid side effects if we were using the original object elsewhere (though unlikely here)
    const data = { ...req.body };

    const existingDelivery = await prisma.delivery.findUnique({ where: { id } });
    if (!existingDelivery) {
        return next(new AppError('Delivery not found', 404));
    }

    // --- BUSINESS LOGIC GUARDS ---

    // 1. Guard: Cannot modify financial data or status if already PAID
    if (existingDelivery.paymentStatus === 'PAID') {
        const sensitiveFields = ['itemCount', 'ratePerItem', 'totalAmount', 'status', 'date'];
        const hasSensitiveChange = sensitiveFields.some(field => data[field] !== undefined && data[field] !== (existingDelivery as any)[field]);

        if (hasSensitiveChange) {
            return next(new AppError("Tidak dapat mengubah laporan yang sudah DIBAYAR (PAID). Silakan batalkan pembayaran terlebih dahulu jika ingin mengedit.", 400));
        }
    }

    // 2. Logic: Recalculate Total if items or rate changes
    if (data.itemCount !== undefined || data.ratePerItem !== undefined) {
        const itemCount = data.itemCount !== undefined ? data.itemCount : existingDelivery.itemCount;
        const ratePerItem = data.ratePerItem !== undefined ? data.ratePerItem : existingDelivery.ratePerItem;

        // Auto-calculate new total
        data.totalAmount = itemCount * ratePerItem;
    }

    // 3. Logic: If REJECTED, ensure Payment Status is reset to UNPAID (cancel any PENDING_REQUEST)
    if (data.status === 'REJECTED') {
        data.paymentStatus = 'UNPAID';
    }

    // 4. Logic: If APPROVED, we don't need to force paymentStatus, 
    // but we might want to ensure it's not in a weird state. 
    // For now, trust the existing flow.

    // Sanitize input: Remove fields that Prisma doesn't expect in `data` (like relations or computed fields passed from frontend)
    const allowedFields = ['itemCount', 'ratePerItem', 'totalAmount', 'status', 'paymentStatus', 'notes', 'date', 'proofPhotoUrl'];
    const sanitizedData: any = {};

    Object.keys(data).forEach(key => {
        if (allowedFields.includes(key)) {
            sanitizedData[key] = data[key];
        }
    });

    const delivery = await prisma.delivery.update({
        where: { id },
        data: sanitizedData
    });

    await logAudit(
        user.userId,
        'UPDATE_DELIVERY',
        'Delivery',
        delivery.id,
        { changedFields: Object.keys(data), newStatus: delivery.status },
        req.ip
    );

    // Notify Courier if status changed
    if (data.status && data.status !== existingDelivery.status) {
        const statusMsg = data.status === 'APPROVED' ? 'Disetujui' : data.status === 'REJECTED' ? 'Ditolak' : 'Diupdate';
        const type = data.status === 'APPROVED' ? 'SUCCESS' : data.status === 'REJECTED' ? 'ERROR' : 'INFO';

        await createNotification(
            delivery.courierId,
            `Laporan ${statusMsg}`,
            `Laporan pengiriman tanggal ${new Date(delivery.date).toLocaleDateString((req as any).locale || 'id-ID')} telah ${statusMsg.toLowerCase()}.`,
            type
        );
    }

    res.json(delivery);
});

// Delete delivery (Admin only)
export const deleteDelivery = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const existingDelivery = await prisma.delivery.findUnique({ where: { id } });
    if (!existingDelivery) {
        return next(new AppError('Delivery not found', 404));
    }

    await prisma.delivery.delete({ where: { id } });
    res.json({ message: 'Delivery deleted' });
});
