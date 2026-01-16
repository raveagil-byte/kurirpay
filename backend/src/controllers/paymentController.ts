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
    const adminId = (req as any).user?.id;

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // Verify items
            const deliveries = await tx.delivery.findMany({
                where: {
                    id: { in: deliveryIds },
                    courierId,
                    paymentStatus: PaymentStatus.UNPAID
                }
            });

            if (deliveries.length !== deliveryIds.length) {
                throw new Error("Beberapa pengiriman tidak valid atau sudah dibayar.");
            }

            // Calculate total matching (optional security check, relying on client sum for now but safer to recalc)
            const calculatedTotal = deliveries.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);

            // Allow small float diff if needed, but here integers mostly.
            // If they pass 'amount' that is different, maybe warn?
            // Let's us calculatedTotal for the record if amount is missing
            const finalAmount = amount || calculatedTotal;

            const payment = await tx.payment.create({
                data: {
                    courierId,
                    amount: finalAmount,
                    method,
                    notes,
                    adminId
                }
            });

            await tx.delivery.updateMany({
                where: { id: { in: deliveryIds } },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                    paymentId: payment.id
                }
            });

            return payment;
        });

        res.json(result);
    } catch (error: any) {
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
