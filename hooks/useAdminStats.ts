import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { DeliveryStatus, PaymentStatus, Role } from '../types';

export const useAdminStats = () => {
    const { deliveries, users } = useData();

    const stats = useMemo(() => {
        const approvedDeliveries = deliveries.filter(d => d.status === DeliveryStatus.APPROVED);
        const totalItems = approvedDeliveries.reduce((sum, d) => sum + d.itemCount, 0);
        const totalEarnings = approvedDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
        const courierCount = users.filter(u => u.role === Role.COURIER).length;

        const pendingCount = deliveries.filter(d => d.status === DeliveryStatus.PENDING).length;
        const approvedCount = deliveries.filter(d => d.status === DeliveryStatus.APPROVED).length;
        const rejectedCount = deliveries.filter(d => d.status === DeliveryStatus.REJECTED).length;

        const unpaidEarnings = deliveries
            .filter(d => d.status === DeliveryStatus.APPROVED && d.paymentStatus !== PaymentStatus.PAID)
            .reduce((sum, d) => sum + d.totalAmount, 0);

        return {
            totalItems,
            totalEarnings,
            courierCount,
            pendingCount,
            approvedCount,
            rejectedCount,
            unpaidEarnings
        };
    }, [deliveries, users]);

    const courierStats = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        return users
            .filter(u => u.role === Role.COURIER)
            .map(u => {
                const uDeliveries = deliveries.filter(d => d.courierId === u.id && d.status === DeliveryStatus.APPROVED);
                const totalItems = uDeliveries.reduce((sum, d) => sum + d.itemCount, 0);
                const totalEarnings = uDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);

                const unpaidDeliveries = uDeliveries.filter(d => d.paymentStatus !== PaymentStatus.PAID);
                const unpaidAmount = unpaidDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
                const hasPayoutRequest = unpaidDeliveries.some(d => d.paymentStatus === PaymentStatus.PENDING_REQUEST);

                const weeklyDeliveries = uDeliveries.filter(d => new Date(d.date) >= startOfWeek);
                const weeklyItems = weeklyDeliveries.reduce((sum, d) => sum + d.itemCount, 0);
                const weeklyEarnings = weeklyDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);

                return {
                    ...u,
                    totalItems,
                    totalEarnings,
                    weeklyItems,
                    weeklyEarnings,
                    unpaidAmount,
                    hasPayoutRequest,
                    unpaidDeliveriesCount: unpaidDeliveries.length
                };
            });
    }, [users, deliveries]);

    return { stats, courierStats };
};
