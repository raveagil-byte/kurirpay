import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { Payment } from '../types';

export const usePayments = () => {
    const { token } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/payments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setPayments(data);
            } else {
                setError('Failed to fetch payments');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchUnpaidDeliveries = async (courierId: string) => {
        try {
            const response = await fetch(`${API_URL}/api/payments/unpaid/${courierId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
            return [];
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    const createPayout = async (data: { courierId: string, deliveryIds: string[], amount: number, method: string, notes?: string }) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/payments/payout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                await fetchPayments(); // Refresh list
                return true;
            } else {
                const errData = await response.json();
                setError(errData.message || 'Payout failed');
                return false;
            }
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        payments,
        loading,
        error,
        fetchPayments,
        fetchUnpaidDeliveries,
        createPayout
    };
};
