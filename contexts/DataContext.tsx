import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { User, Delivery } from '../types';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { API_URL } from '../config';

interface DataContextType {
    users: User[];
    loadingUsers: boolean;
    errorUsers: string | null;
    refreshUsers: () => Promise<void>;
    addUser: (user: any) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    deliveries: Delivery[];
    loadingDeliveries: boolean;
    errorDeliveries: string | null;
    refreshDeliveries: () => Promise<void>;
    addDelivery: (delivery: Delivery) => Promise<void>;
    updateDelivery: (delivery: Delivery) => Promise<void>;
    deleteDelivery: (id: string) => Promise<void>;
    getDeliveriesByCourier: (courierId: string) => Delivery[];
    clearDeliveries: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { token, updateUserSession, user: currentUser } = useAuth();
    const { settings } = useSettings();

    // --- USERS STATE ---
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [errorUsers, setErrorUsers] = useState<string | null>(null);

    // --- DELIVERIES STATE ---
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loadingDeliveries, setLoadingDeliveries] = useState(false);
    const [errorDeliveries, setErrorDeliveries] = useState<string | null>(null);

    // ===========================
    // USERS LOGIC
    // ===========================
    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setLoadingUsers(true);
        try {
            const response = await fetch(`${API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
                setErrorUsers(null);
            } else {
                setErrorUsers('Gagal memuat data pengguna');
            }
        } catch (err: any) {
            setErrorUsers(err.message);
            toast.error(`Gagal memuat pengguna: ${err.message}`);
        } finally {
            setLoadingUsers(false);
        }
    }, [token]);

    const addUser = async (newUser: any) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    setUsers(prev => [...prev, data.user]);
                } else {
                    await fetchUsers();
                }
            } else {
                const err = await response.json();
                throw new Error(err.message || 'Gagal membuat user');
            }
        } catch (error: any) {
            throw error;
        }
    };

    const updateUser = async (updated: User) => {
        try {
            const response = await fetch(`${API_URL}/api/users/${updated.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updated)
            });

            if (response.ok) {
                const updatedData = await response.json();
                setUsers(prev => prev.map(u => u.id === updated.id ? updatedData : u));
                if (currentUser && currentUser.id === updated.id) {
                    updateUserSession(updatedData);
                }
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteUser = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    // ===========================
    // DELIVERIES LOGIC
    // ===========================
    const fetchDeliveries = useCallback(async () => {
        if (!token) return;
        setLoadingDeliveries(true);
        try {
            const response = await fetch(`${API_URL}/api/deliveries?limit=2000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                const data = Array.isArray(result) ? result : result.data;
                setDeliveries(data);
                setErrorDeliveries(null);
            } else {
                setErrorDeliveries('Gagal memuat data pengiriman');
            }
        } catch (err: any) {
            setErrorDeliveries(err.message);
            toast.error(`Gagal memuat laporan: ${err.message}`);
        } finally {
            setLoadingDeliveries(false);
        }
    }, [token]);

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
            throw err;
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
            throw err;
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
            throw err;
        }
    };

    const getDeliveriesByCourier = (courierId: string) => {
        return deliveries.filter(d => d.courierId === courierId);
    };

    const clearDeliveries = () => setDeliveries([]);

    // Initial Fetch when Token is available
    useEffect(() => {
        if (token) {
            fetchUsers();
            fetchDeliveries();
        }
    }, [token, fetchUsers, fetchDeliveries]);

    return (
        <DataContext.Provider value={{
            users,
            loadingUsers,
            errorUsers,
            refreshUsers: fetchUsers,
            addUser,
            updateUser,
            deleteUser,

            deliveries,
            loadingDeliveries,
            errorDeliveries,
            refreshDeliveries: fetchDeliveries,
            addDelivery,
            updateDelivery,
            deleteDelivery,
            getDeliveriesByCourier,
            clearDeliveries
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
