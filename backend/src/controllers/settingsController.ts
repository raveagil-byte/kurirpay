import { Request, Response } from 'express';
import prisma from '../prisma';
import { logAudit } from '../services/auditService';

export const getSettings = async (req: Request, res: Response) => {
    try {
        // Determine the first setting record or create default
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    appName: 'KurirPay',
                    deliveryRate: 3000,
                    currencySymbol: 'Rp',
                    allowCourierSelfRegister: false
                }
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    const { appName, deliveryRate, allowCourierSelfRegister } = req.body;
    const adminUser = (req as any).user;

    try {
        const first = await prisma.systemSettings.findFirst();
        const id = first?.id;

        let settings;
        if (id) {
            settings = await prisma.systemSettings.update({
                where: { id },
                data: { appName, deliveryRate, allowCourierSelfRegister }
            });
        } else {
            // Fallback creation
            settings = await prisma.systemSettings.create({
                data: { appName, deliveryRate, allowCourierSelfRegister }
            });
        }

        await logAudit(
            adminUser.userId,
            'UPDATE_SETTINGS',
            'SystemSettings',
            settings.id,
            { appName, deliveryRate, allowCourierSelfRegister },
            req.ip
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error });
    }
};
export const resetData = async (req: Request, res: Response) => {
    const adminUser = (req as any).user;

    try {
        // Delete transactional data only. Users and Settings are preserved.
        await prisma.delivery.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.notification.deleteMany({});

        await logAudit(
            adminUser.userId,
            'RESET_DATA',
            'System',
            null,
            { action: 'Deleted all deliveries, payments, notifications' },
            req.ip
        );

        res.json({ message: 'All transactional data successfully deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting data', error });
    }
};
