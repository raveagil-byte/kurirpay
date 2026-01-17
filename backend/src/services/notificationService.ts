import prisma from '../prisma';

export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO'
) => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                isRead: false
            }
        });
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};
