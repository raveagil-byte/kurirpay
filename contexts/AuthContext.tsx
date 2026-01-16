import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Role } from '../types';
import { STORAGE_KEYS } from '../constants';

interface LoginResponse {
    token: string;
    user: User;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: Role) => Promise<void>;
    updateUserSession: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('auth_token');
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEYS.AUTH);
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }, [token]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            const { token, user } = data as LoginResponse;
            setToken(token);
            setUser(user);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, role: Role = Role.COURIER) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            // Auto login after register? Or just redirect? For now just success.
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateUserSession = (userData: User) => {
        setUser(userData);
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem('auth_token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            register,
            updateUserSession,
            logout,
            isAuthenticated: !!user,
            isAdmin: user?.role === Role.ADMIN,
            loading,
            error
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
