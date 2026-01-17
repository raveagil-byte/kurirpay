import { useState, useEffect, useCallback } from 'react';
import { Delivery } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
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
            const response = await fetch(`${API_URL}/api/deliveries?limit=1000`, { // Temp high limit to keep current UX until pagination UI is built
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                // Support both legacy array and new paginated structure
                const data = Array.isArray(result) ? result : result.data;
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
        try {
            const response = await fetch(`${API_URL}/api/deliveries`, {
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
                const newDelivery = await response.json();
                setDeliveries(prev => [newDelivery, ...prev]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateDelivery = async (updated: Delivery) => {
        try {
            const response = await fetch(`${API_URL}/api/deliveries/${updated.id}`, {
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
            const response = await fetch(`${API_URL}/api/deliveries/${id}`, {
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
