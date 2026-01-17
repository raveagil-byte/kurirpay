import { Request, Response } from 'express';
import prisma from '../prisma';
import { PaymentStatus } from '@prisma/client';

export const getUnpaidDeliveries = async (req: Request, res: Response) => {
    const { courierId } = req.params;
    try {
        const deliveries = await prisma.delivery.findMany({
            where: {
                courierId,
                paymentStatus: PaymentStatus.UNPAID
            },
            orderBy: { date: 'asc' }
        });
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unpaid deliveries', error });
    }
};

export const createPayout = async (req: Request, res: Response) => {
    const { courierId, deliveryIds, amount, method, notes } = req.body;
    const adminUser = (req as any).user;

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // Verify items
            const deliveries = await tx.delivery.findMany({
                where: {
                    id: { in: deliveryIds },
                    courierId,
                    paymentStatus: { not: PaymentStatus.PAID } // Corrected check
                }
            });

            // If some are missing or already paid, we might want to just proceed with valid ones or error.
            // Enterprise Standard: Error and tell user to refresh. Data integrity first.
            if (deliveries.length !== deliveryIds.length) {
                throw new Error("Data mismatch: Some deliveries might have been paid already.");
            }

            const calculatedTotal = deliveries.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);

            const payment = await tx.payment.create({
                data: {
                    courierId,
                    amount: calculatedTotal,
                    method,
                    notes,
                    adminId: adminUser.userId
                }
            });

            await tx.delivery.updateMany({
                where: { id: { in: deliveryIds } },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                    paymentId: payment.id
                }
            });

            // In-transaction Audit Log (if using same prisma instance, but tx instance needs to be passed if we want atomic)
            // Use tx.auditLog.create to ensure it rolls back if payment fails
            await tx.auditLog.create({
                data: {
                    userId: adminUser.userId,
                    action: 'CREATE_PAYOUT',
                    entity: 'Payment',
                    entityId: payment.id,
                    details: JSON.stringify({ amount: calculatedTotal, count: deliveries.length, method }),
                    ipAddress: req.ip
                }
            });

            // Notify Courier
            await tx.notification.create({
                data: {
                    userId: courierId,
                    title: 'Pembayaran Gaji Diterima',
                    message: `Gaji sebesar Rp ${calculatedTotal.toLocaleString('id-ID')} telah dibayarkan via ${method}.`,
                    type: 'SUCCESS',
                    isRead: false
                }
            });

            return payment;
        });

        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Pembayaran gagal', error });
    }
};

export const getPayments = async (req: Request, res: Response) => {
    try {
        const payments = await prisma.payment.findMany({
            include: { courier: { select: { name: true, email: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payments', error });
    }
};
