import { Request, Response } from 'express';
import prisma from '../prisma';

// Get all deliveries (Admin sees all, Courier sees theirs)
export const getDeliveries = async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
        let whereClause = {};
        if (user.role !== 'ADMIN') {
            whereClause = { courierId: user.userId };
        }

        const deliveries = await prisma.delivery.findMany({
            where: whereClause,
            include: { courier: { select: { name: true, email: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching deliveries', error });
    }
};

// Create a new delivery report
export const createDelivery = async (req: Request, res: Response) => {
    const { date, itemCount, ratePerItem, totalAmount, notes } = req.body;
    const user = (req as any).user;

    try {
        // Fetch current rate from Settings (or use default 3000 if not set)
        let settings = await prisma.systemSettings.findFirst();
        const currentRate = settings?.deliveryRate || 3000;

        const calculatedTotal = itemCount * currentRate;

        const delivery = await prisma.delivery.create({
            data: {
                courierId: user.userId,
                date: new Date(date),
                itemCount,
                ratePerItem: currentRate,
                totalAmount: calculatedTotal,
                notes,
                status: 'PENDING',
                paymentStatus: 'UNPAID'
            }
        });
        res.status(201).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Error creating delivery', error });
    }
};

// Update delivery (Admin: Approve/Reject/Pay, Courier: Request Payout)
export const updateDelivery = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    try {
        const delivery = await prisma.delivery.update({
            where: { id },
            data
        });
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
