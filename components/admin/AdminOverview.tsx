import React from 'react';
import { useAdminStats } from '../../hooks/useAdminStats';

const AdminOverview: React.FC = () => {
    const { stats } = useAdminStats();

    return (
        <div className="space-y-6 no-print">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Gaji Terbayar</p>
                    <h3 className="text-3xl font-bold text-slate-900">Rp {stats.totalEarnings.toLocaleString('id-ID')}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Total Hutang Gaji</p>
                    <h3 className="text-3xl font-bold text-amber-600">Rp {stats.unpaidEarnings.toLocaleString('id-ID')}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Total Paket Berhasil</p>
                    <h3 className="text-3xl font-bold text-indigo-600">{stats.totalItems.toLocaleString()}</h3>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                    Status Validasi Laporan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{stats.pendingCount}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Validasi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{stats.approvedCount}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Laporan Disetujui</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{stats.rejectedCount}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Laporan Ditolak</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
