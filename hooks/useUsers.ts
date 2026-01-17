import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export const useUsers = () => {
    const { user: currentUser, updateUserSession, token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            } else {
                setError('Failed to fetch users');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
                setError(err.message || 'Gagal membuat user');
                throw new Error(err.message);
            }
        } catch (error: any) {
            console.error("Add user error:", error);
            setError(error.message);
            // Re-throw so UI can catch it?
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
        }
    };

    const updateUser = async (updated: User) => {
        try {
            // We need to send only relevant fields, password if changed
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

                // If the updated user is the current logged-in user, update the session
                if (currentUser && currentUser.id === updated.id) {
                    updateUserSession(updatedData);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    return {
        users,
        addUser,
        deleteUser,
        updateUser,
        loading,
        error,
        refresh: fetchUsers
    };
};
