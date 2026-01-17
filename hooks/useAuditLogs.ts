import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
    user?: {
        name: string;
        email: string;
        role: string;
    };
}

export const useAuditLogs = () => {
    const { token } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async (page = 1, limit = 50) => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/audit-logs?page=${page}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok) {
                // Handle paginated response
                setLogs(result.data || []);
                if (result.meta) {
                    setMeta(result.meta);
                }
            } else {
                setError('Failed to fetch audit logs');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    return {
        logs,
        meta,
        loading,
        error,
        fetchLogs
    };
};
