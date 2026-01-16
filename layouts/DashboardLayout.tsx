import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNotifications } from '../contexts/NotificationContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const { settings } = useSettings();
    const { notifications, markAsRead, clearAll } = useNotifications();

    // Guard clause if user is null (though App.tsx should handle redirection)
    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar
                user={user}
                appName={settings.appName}
                onLogout={logout}
                notifications={notifications.filter(n => !n.isRead)}
                onMarkRead={markAsRead}
                onClearAll={clearAll}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>

            <footer className="bg-white border-t py-6 text-center text-slate-500 text-sm no-print">
                <div className="container mx-auto px-4">
                    <p className="font-semibold text-slate-900 mb-1">{settings.appName}</p>
                    <p>&copy; {new Date().getFullYear()} Sistem Manajemen Pengajian Internal.</p>
                </div>
            </footer>
        </div>
    );
};

export default DashboardLayout;
