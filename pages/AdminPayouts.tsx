import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUsers } from '../hooks/useUsers';
import { usePayments } from '../hooks/usePayments';
import { Role, Delivery } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const AdminPayouts: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { users } = useUsers();
    const { payments, loading, fetchPayments, fetchUnpaidDeliveries, createPayout } = usePayments();

    const [selectedCourier, setSelectedCourier] = useState<string>('');
    const [unpaidDeliveries, setUnpaidDeliveries] = useState<Delivery[]>([]);
    const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<Set<string>>(new Set());

    // UI State
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [payoutNotes, setPayoutNotes] = useState('');

    const couriers = users.filter(u => u.role === Role.COURIER);

    useEffect(() => {
        if (!user || user.role !== Role.ADMIN) {
            navigate('/');
            return;
        }
        if (activeTab === 'history') {
            fetchPayments();
        }
    }, [activeTab, fetchPayments, user, navigate]);

    useEffect(() => {
        if (selectedCourier) {
            loadUnpaid(selectedCourier);
        } else {
            setUnpaidDeliveries([]);
        }
    }, [selectedCourier]);

    const loadUnpaid = async (id: string) => {
        const data = await fetchUnpaidDeliveries(id);
        setUnpaidDeliveries(data);
        setSelectedDeliveryIds(new Set());
    };

    const toggleDeliverySelection = (id: string) => {
        const newSet = new Set(selectedDeliveryIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedDeliveryIds(newSet);
    };

    const handleProcessPayout = async () => {
        if (!selectedCourier || selectedDeliveryIds.size === 0) return;

        const selectedItems = unpaidDeliveries.filter(d => selectedDeliveryIds.has(d.id));
        const totalAmount = selectedItems.reduce((acc, curr) => acc + curr.totalAmount, 0);

        if (confirm(`Konfirmasi pembayaran sebesar Rp ${totalAmount.toLocaleString()} untuk ${selectedItems.length} pengiriman?`)) {
            const success = await createPayout({
                courierId: selectedCourier,
                deliveryIds: Array.from(selectedDeliveryIds),
                amount: totalAmount,
                method: 'CASH',
                notes: payoutNotes
            });

            if (success) {
                toast.success('Pembayaran berhasil dicatat!');
                setPayoutNotes('');
                loadUnpaid(selectedCourier);
                fetchPayments(); // Refresh history
            }
        }
    };

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(payments.map(p => ({
            ID: p.id,
            Tanggal: new Date(p.date).toLocaleString(),
            Kurir: (p as any).courier?.name,
            Email: (p as any).courier?.email,
            Metode: p.method,
            Jumlah: p.amount,
            Admin: p.adminId
        })));
        XLSX.utils.book_append_sheet(wb, ws, "Riwayat Pembayaran");
        XLSX.writeFile(wb, "Laporan_Gaji_Kurir.xlsx");
    };

    return (
        <div className="font-sans">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Penggajian</h1>
                    <p className="text-slate-500 mt-2">Kelola pembayaran gaji kurir dan riwayat transaksi.</p>
                </div>
                {activeTab === 'history' && (
                    <button
                        onClick={handleExport}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export Excel
                    </button>
                )}
            </header>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
                >
                    Buat Pembayaran Baru
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
                >
                    Riwayat Pembayaran
                </button>
            </div>

            {activeTab === 'create' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Courier Selection & Unpaid List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pilih Kurir</label>
                            <select
                                value={selectedCourier}
                                onChange={(e) => setSelectedCourier(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Pilih Kurir --</option>
                                {couriers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                ))}
                            </select>
                        </div>

                        {selectedCourier && (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg text-slate-800">Pengiriman Belum Dibayar</h3>
                                    <button
                                        onClick={() => {
                                            if (selectedDeliveryIds.size === unpaidDeliveries.length) setSelectedDeliveryIds(new Set());
                                            else setSelectedDeliveryIds(new Set(unpaidDeliveries.map(d => d.id)));
                                        }}
                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100"
                                    >
                                        {selectedDeliveryIds.size === unpaidDeliveries.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                    </button>
                                </div>

                                {unpaidDeliveries.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        Tidak ada tagihan tertunggak.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {unpaidDeliveries.map(d => (
                                            <div
                                                key={d.id}
                                                onClick={() => toggleDeliverySelection(d.id)}
                                                className={`group cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${selectedDeliveryIds.has(d.id)
                                                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                                    : 'bg-white border-slate-100 hover:border-indigo-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${selectedDeliveryIds.has(d.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                        {selectedDeliveryIds.has(d.id) && <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">
                                                            {new Date(d.date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium">
                                                            {d.itemCount} Paket • {d.notes || 'Tanpa Catatan'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-slate-800">Rp {d.totalAmount.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Summary & Action */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl shadow-slate-200 sticky top-4">
                            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Total Pembayaran</label>
                            <div className="text-4xl font-black mb-6">
                                Rp {unpaidDeliveries.filter(d => selectedDeliveryIds.has(d.id)).reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Metode Pembayaran</label>
                                    <select className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="CASH">Tunai (Cash)</option>
                                        <option value="TRANSFER">Transfer Bank</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Catatan (Opsional)</label>
                                    <textarea
                                        value={payoutNotes}
                                        onChange={(e) => setPayoutNotes(e.target.value)}
                                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                                        placeholder="Contoh: Pembayaran minggu ke-1 Januari"
                                    />
                                </div>

                                <button
                                    onClick={handleProcessPayout}
                                    disabled={loading || selectedDeliveryIds.size === 0}
                                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {loading ? 'Memproses...' : 'Bayar Sekarang'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                                <th className="text-left px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kurir</th>
                                <th className="text-left px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Metode</th>
                                <th className="text-right px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah</th>
                                <th className="text-center px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center text-slate-400 font-medium">Belum ada riwayat pembayaran.</td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-4 text-sm font-bold text-slate-700">
                                            {new Date(p.date).toLocaleDateString()}
                                            <div className="text-xs text-slate-400 font-medium">{new Date(p.date).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="text-sm font-bold text-slate-900">{(p as any).courier?.name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500">{(p as any).courier?.email}</div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                {p.method}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="text-sm font-black text-emerald-600">
                                                Rp {p.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                SUKSES
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPayouts;
