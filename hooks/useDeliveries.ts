import { useState, useEffect, useCallback } from 'react';
import { Delivery } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export const useDeliveries = () => {
    const { token } = useAuth();
    const { settings } = useSettings();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDeliveries = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/deliveries', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setDeliveries(data);
            } else {
                setError('Failed to fetch deliveries');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);

    const addDelivery = async (delivery: Delivery) => {
        // Backend handles calculation if we wanted, but for now we send raw details
        // Note: Delivery type interface in frontend might have ID, but creating new one doesnt need it
        try {
            const response = await fetch('http://localhost:3000/api/deliveries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: delivery.date,
                    itemCount: delivery.itemCount,
                    ratePerItem: settings.deliveryRate,
                    totalAmount: delivery.itemCount * settings.deliveryRate,
                    notes: delivery.notes
                })
            });

            if (response.ok) {
                await fetchDeliveries(); // Refresh list
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateDelivery = async (updated: Delivery) => {
        try {
            const response = await fetch(`http://localhost:3000/api/deliveries/${updated.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updated)
            });
            if (response.ok) {
                setDeliveries(prev => prev.map(d => d.id === updated.id ? updated : d));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteDelivery = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/deliveries/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setDeliveries(prev => prev.filter(d => d.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Legacy support for frontend logic (filtering is now done in backend for courier)
    const getDeliveriesByCourier = (courierId: string) => {
        return deliveries.filter(d => d.courierId === courierId);
    };

    const clearDeliveries = () => setDeliveries([]);

    return {
        deliveries,
        addDelivery,
        updateDelivery,
        deleteDelivery,
        getDeliveriesByCourier,
        clearDeliveries,
        refresh: fetchDeliveries,
        loading,
        error
    };
};
