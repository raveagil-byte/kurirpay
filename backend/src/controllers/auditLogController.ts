import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAuditLogs = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    try {
        const [logs, total] = await Promise.all([
            (prisma as any).auditLog.findMany({
                include: {
                    user: {
                        select: { name: true, email: true, role: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip
            }),
            (prisma as any).auditLog.count()
        ]);

        res.json({
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit logs', error });
    }
};
