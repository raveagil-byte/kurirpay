import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { logAudit } from '../services/auditService';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();

        // Remove password manually
        const safeUsers = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });

        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching users',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const adminUser = (req as any).user;

    try {
        let data: any = { name, email };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data
        });

        await logAudit(
            adminUser.userId,
            'UPDATE_USER',
            'User',
            user.id,
            { changedFields: Object.keys(data) },
            req.ip
        );

        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUser = (req as any).user;

    try {
        // Log before delete or after? If after, we can't refer to name easily unless fetched.
        // Let's just delete.
        await prisma.delivery.deleteMany({ where: { courierId: id } });
        await prisma.user.delete({ where: { id } });

        await logAudit(
            adminUser.userId,
            'DELETE_USER',
            'User',
            id,
            { relatedDataDeleted: 'All deliveries' },
            req.ip
        );

        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};
