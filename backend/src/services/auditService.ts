import prisma from '../prisma';

export const logAudit = async (
    userId: string,
    action: string,
    entity: string,
    entityId: string | null = null,
    details: string | object | null = null,
    ipAddress: string | undefined | null = null
) => {
    try {
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
        await (prisma as any).auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: detailsStr,
                ipAddress
            }
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Fail silently so we don't block the main transaction if logging fails? 
        // In true enterprise, we might want this to be strict, but for now silent is safer for UX.
    }
};
