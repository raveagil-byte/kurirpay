import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppNotification } from '../types';

interface NotificationContextType {
    notifications: AppNotification[];
    addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // NOTE: Untuk saat ini notifikasi masih bersifat "Transient" (hilang saat refresh)
    // karena kita belum implementasi WebSocket atau Polling untuk notifikasi realtime.
    // Tapi setidaknya kita hapus dependency ke localStorage agar lebih mulus.

    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
        const newNotif: AppNotification = {
            ...notif,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            isRead: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const clearAll = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll, unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
