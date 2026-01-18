import React, { useEffect } from 'react';
import { useAuditLogs } from '../../hooks/useAuditLogs';

const AdminAuditLogs: React.FC = () => {
    const { logs: auditLogs, fetchLogs, loading: loadingLogs, meta: logsMeta } = useAuditLogs();

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden no-print">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Activity Logs (Audit Trail)</h2>
                    <p className="text-xs text-slate-500 mt-1">Rekam jejak aktivitas sensitif dalam sistem untuk keamanan dan audit.</p>
                </div>
                <button onClick={() => fetchLogs()} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Timestamp</th>
                            <th className="px-6 py-4 whitespace-nowrap">User (Pelaku)</th>
                            <th className="px-6 py-4 whitespace-nowrap">Action</th>
                            <th className="px-6 py-4 whitespace-nowrap">Target Entity</th>
                            <th className="px-6 py-4 whitespace-nowrap">IP Address</th>
                            <th className="px-6 py-4 min-w-[300px]">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loadingLogs ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm animate-pulse">
                                    Memuat data audit logs...
                                </td>
                            </tr>
                        ) : auditLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                                    Belum ada aktivitas yang terekam.
                                </td>
                            </tr>
                        ) : (
                            auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                                        {new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900">{log.user?.name || log.userId}</span>
                                            <span className="text-[10px] text-slate-500">{log.user?.role || 'SYSTEM'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${log.action.includes('DELETE') ? 'bg-red-50 text-red-600 border-red-100' :
                                            log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                log.action.includes('LOGIN') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                                        {log.entity} <span className="text-slate-400 text-[10px]">#{log.entityId}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                                        {log.ipAddress || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-600 font-mono break-all line-clamp-2 hover:line-clamp-none transition-all">
                                        {log.details ? log.details.substring(0, 100) + (log.details.length > 100 ? '...' : '') : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
                <span>Total {logsMeta.total} records</span>
                <div className="flex gap-2">
                    <button
                        disabled={logsMeta.page <= 1}
                        onClick={() => fetchLogs(logsMeta.page - 1)}
                        className="px-3 py-1 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"
                    >Prev</button>
                    <span className="self-center font-bold">Page {logsMeta.page}</span>
                    <button
                        disabled={logsMeta.page >= logsMeta.totalPages}
                        onClick={() => fetchLogs(logsMeta.page + 1)}
                        className="px-3 py-1 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"
                    >Next</button>
                </div>
            </div>
        </div>
    );
};

export default AdminAuditLogs;
