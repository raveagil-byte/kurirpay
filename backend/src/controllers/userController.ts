import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password } = req.body;

    try {
        let data: any = { name, email };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data
        });

        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Delete related data first or use cascade in schema (standard Prisma relation behavior)
        // For now assume Cascade delete is not set, so we manually delete deliveries? 
        // Actually Prisma schema handles relations, but let's just delete the user.
        await prisma.delivery.deleteMany({ where: { courierId: id } });
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};
