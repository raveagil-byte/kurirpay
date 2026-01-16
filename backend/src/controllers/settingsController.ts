import { Request, Response } from 'express';
import prisma from '../prisma';

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
    try {
        const first = await prisma.systemSettings.findFirst();
        const id = first?.id;

        if (id) {
            const settings = await prisma.systemSettings.update({
                where: { id },
                data: { appName, deliveryRate, allowCourierSelfRegister }
            });
            res.json(settings);
        } else {
            // Fallback creation
            const settings = await prisma.systemSettings.create({
                data: { appName, deliveryRate, allowCourierSelfRegister }
            });
            res.json(settings);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error });
    }
};
