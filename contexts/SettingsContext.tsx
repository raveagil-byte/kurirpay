import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppSettings } from '../types';
import { useAuth } from './AuthContext';

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: AppSettings) => Promise<void>;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Default settings
    const defaultSettings: AppSettings = {
        appName: 'KurirPay',
        deliveryRate: 3000,
        currencySymbol: 'Rp',
        allowCourierSelfRegister: false
    };

    const { token } = useAuth();
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [loading, setLoading] = useState(false);

    // Fetch settings on mount (public or protected)
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/settings`);
                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                    document.title = data.appName;
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []); // Only run once on mount

    const updateSettings = async (newSettings: AppSettings) => {
        try {
            const response = await fetch(`${API_URL}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newSettings)
            });

            if (response.ok) {
                const updated = await response.json();
                setSettings(updated);
                document.title = updated.appName;
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
