import { Request, Response } from 'express';
import prisma from '../prisma';

// Get all deliveries (Admin sees all, Courier sees theirs)
// Get all deliveries (Admin sees all, Courier sees theirs)
// Supports Pagination: ?page=1&limit=50
export const getDeliveries = async (req: Request, res: Response) => {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    try {
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
    } catch (error) {
        res.status(500).json({ message: 'Error fetching deliveries', error });
    }
};

import { z } from 'zod';
import { logAudit } from '../services/auditService';

// Validation Schema
const createDeliverySchema = z.object({
    date: z.string().transform((str) => new Date(str)),
    itemCount: z.number().min(1, "Minimal 1 paket"),
    notes: z.string().optional()
});

// Create a new delivery report
export const createDelivery = async (req: Request, res: Response) => {
    const user = (req as any).user;

    // Validate Input
    const validation = createDeliverySchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            message: 'Validation Error',
            errors: (validation.error as any).errors
        });
    }

    const validatedData = validation.data;

    try {
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
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating delivery', error });
    }
};

// Update delivery (Admin: Approve/Reject/Pay, Courier: Request Payout)
export const updateDelivery = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    const user = (req as any).user;

    try {
        const delivery = await prisma.delivery.update({
            where: { id },
            data
        });

        await logAudit(
            user.userId,
            'UPDATE_DELIVERY',
            'Delivery',
            delivery.id,
            { changedFields: Object.keys(data), newStatus: delivery.status },
            req.ip
        );

        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Error updating delivery', error });
    }
};

// Delete delivery (Admin only)
export const deleteDelivery = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.delivery.delete({ where: { id } });
        res.json({ message: 'Delivery deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting delivery', error });
    }
};
