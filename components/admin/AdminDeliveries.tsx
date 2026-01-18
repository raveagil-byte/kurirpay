import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { API_URL } from '../../config';
import { Delivery, DeliveryStatus, PaymentStatus, Role } from '../../types';

import { QRCodeSVG } from 'qrcode.react';

interface AdminDeliveriesProps {
    appName: string;
}

const AdminDeliveries: React.FC<AdminDeliveriesProps> = ({ appName }) => {
    const { deliveries, users, updateDelivery } = useData();

    // Filter State
    const [filterDateFrom, setFilterDateFrom] = useState<string>("");
    const [filterDateTo, setFilterDateTo] = useState<string>("");
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatus | 'ALL'>('ALL');
    const [filterMinPkg, setFilterMinPkg] = useState<string>("");
    const [filterMaxPkg, setFilterMaxPkg] = useState<string>("");
    const [filterCourierId, setFilterCourierId] = useState<string>("ALL");

    // Print State
    const [printingDelivery, setPrintingDelivery] = useState<Delivery | null>(null);

    const filteredDeliveries = useMemo(() => {
        return deliveries.filter(d => {
            const matchDateFrom = filterDateFrom ? new Date(d.date) >= new Date(filterDateFrom) : true;
            const matchDateTo = filterDateTo ? new Date(d.date) <= new Date(filterDateTo) : true;
            const matchPayment = filterPaymentStatus === 'ALL' ? true : d.paymentStatus === filterPaymentStatus;
            const matchMinPkg = filterMinPkg ? d.itemCount >= parseInt(filterMinPkg) : true;
            const matchMaxPkg = filterMaxPkg ? d.itemCount <= parseInt(filterMaxPkg) : true;
            const matchCourier = filterCourierId === 'ALL' ? true : d.courierId === filterCourierId;

            return matchDateFrom && matchDateTo && matchPayment && matchMinPkg && matchMaxPkg && matchCourier;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [deliveries, filterDateFrom, filterDateTo, filterPaymentStatus, filterMinPkg, filterMaxPkg, filterCourierId]);

    const { token } = useAuth();

    const handleUpdateStatus = async (delivery: Delivery, status: DeliveryStatus) => {
        await updateDelivery({ ...delivery, status });
        if (status === DeliveryStatus.APPROVED) {
            toast.success("Laporan disetujui.");
        }
    };

    const handleQuickPayout = async (delivery: Delivery) => {
        if (!confirm(`Konfirmasi: Catat pembayaran TUNAI sebesar Rp ${delivery.totalAmount.toLocaleString('id-ID')} untuk laporan ini?`)) return;

        try {
            const response = await fetch(`${API_URL}/api/payments/payout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courierId: delivery.courierId,
                    deliveryIds: [delivery.id],
                    amount: delivery.totalAmount, // Full amount, no bonus/deduction for quick action
                    method: 'CASH', // Default to CASH for daily field payments
                    notes: 'Pembayaran Harian (Quick Action)'
                })
            });

            if (response.ok) {
                toast.success(`Pembayaran tercatat!`);
                // Trigger refresh if needed, usually data context handles it via some mechanism or we force reload/refetch
                // For simplicity, we rely on the backend response or generic refresh. 
                // Since createPayout updates delivery status, we might need to refresh deliveries.
                // The quick way is to reload the window or ask context to refresh.
                window.location.reload();
            } else {
                const err = await response.json();
                toast.error(err.message || "Gagal mencatat pembayaran");
            }
        } catch (e) {
            toast.error("Terjadi kesalahan koneksi");
        }
    };

    const handlePrintSingle = (delivery: Delivery) => {
        setPrintingDelivery(delivery);
        // Delay increased to 1.5s to ensure QR Code images from external API are fully loaded
        setTimeout(() => {
            window.print();
            setPrintingDelivery(null);
        }, 1500);
    };

    const clearFilters = () => {
        setFilterDateFrom("");
        setFilterDateTo("");
        setFilterPaymentStatus('ALL');
        setFilterMinPkg("");
        setFilterMaxPkg("");
        setFilterCourierId("ALL");
    };



    return (
        <div className="space-y-6">
            {/* Printable Receipt Area */}
            {printingDelivery && (
                <div className="print-only receipt-container">
                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">{appName}</h1>
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Laporan Bukti Pengiriman Harian</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Transaksi</p>
                            <p className="font-mono text-sm font-bold">#KP-{printingDelivery.id.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Laporan</p>
                            <p className="text-sm font-bold">{new Date(printingDelivery.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-none border border-slate-200 mb-10">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
                            <p className="text-xs font-bold text-slate-500">KURIR PELAKSANA</p>
                            <p className="font-black text-lg text-slate-900">{users.find(u => u.id === printingDelivery.courierId)?.name}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-500">EMAIL</p>
                            <p className="text-sm font-medium">{users.find(u => u.id === printingDelivery.courierId)?.email}</p>
                        </div>
                    </div>

                    <table className="w-full mb-10">
                        <thead>
                            <tr className="border-b-2 border-slate-900">
                                <th className="py-3 text-left text-xs font-black uppercase">Deskripsi Pekerjaan</th>
                                <th className="py-3 text-center text-xs font-black uppercase">Jumlah</th>
                                <th className="py-3 text-right text-xs font-black uppercase">Tarif</th>
                                <th className="py-3 text-right text-xs font-black uppercase">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-4 text-sm font-bold text-slate-900">Pengantaran Paket Toko Online</td>
                                <td className="py-4 text-center text-sm font-bold">{printingDelivery.itemCount} Paket</td>
                                <td className="py-4 text-right text-sm">Rp {printingDelivery.ratePerItem.toLocaleString('id-ID')}</td>
                                <td className="py-4 text-right text-sm font-black text-slate-900">Rp {printingDelivery.totalAmount.toLocaleString('id-ID')}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-end mb-20">
                        <div className="bg-slate-900 text-white p-6 w-72">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">TOTAL PENDAPATAN</p>
                            <h3 className="text-2xl font-black">Rp {printingDelivery.totalAmount.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 text-center items-end">
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-4">TTD KURIR</p>
                            <QRCodeSVG
                                value={`AGREED:${users.find(u => u.id === printingDelivery.courierId)?.name?.toUpperCase() || 'UNKNOWN'} | DEL:${printingDelivery.id.toUpperCase()} | ITEM:${printingDelivery.itemCount} | DATE:${printingDelivery.date}`}
                                size={96}
                                level={"M"}
                                className="mb-2 opacity-80"
                            />
                            <div className="border-t border-slate-900 pt-2 font-bold uppercase text-xs w-full">
                                {users.find(u => u.id === printingDelivery.courierId)?.name}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-4">ADMIN VALIDASI</p>
                            <QRCodeSVG
                                value={`VALIDATED:KURIRPAY-SYSTEM | REF:${printingDelivery.id.toUpperCase()} | STATUS:${printingDelivery.status} | TS:${new Date().toLocaleString('id-ID')}`}
                                size={96}
                                level={"M"}
                                className="mb-2 opacity-80"
                            />
                            <div className="border-t border-slate-900 pt-2 font-bold uppercase tracking-widest text-xs w-full">
                                SISTEM {appName}
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-bold italic">
                            Dokumen ini ditandatangani secara digital (QR Validation) dan sah menurut sistem {appName}.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-indigo-900 text-white p-6 rounded-3xl flex justify-between items-center shadow-lg no-print">
                <div>
                    <h2 className="text-xl font-bold">Detail Riwayat Pengiriman</h2>
                    <p className="text-indigo-200 text-xs">Menampilkan {filteredDeliveries.length} dari {deliveries.length} laporan.</p>
                </div>
                <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/20">Export Laporan</button>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 no-print">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter Laporan Lanjutan
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rentang Tanggal</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-slate-300">-</span>
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Pembayaran</label>
                        <select
                            value={filterPaymentStatus}
                            onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value={PaymentStatus.UNPAID}>Belum Dibayar</option>
                            <option value={PaymentStatus.PENDING_REQUEST}>Menunggu Persetujuan</option>
                            <option value={PaymentStatus.PAID}>Sudah Dibayar</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah Paket (Min - Max)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filterMinPkg}
                                onChange={(e) => setFilterMinPkg(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={filterMaxPkg}
                                onChange={(e) => setFilterMaxPkg(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter Kurir</label>
                        <select
                            value={filterCourierId}
                            onChange={(e) => setFilterCourierId(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="ALL">Semua Kurir</option>
                            {users.filter(u => u.role === Role.COURIER).map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="text-[10px] font-bold text-slate-400 uppercase hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Bersihkan Filter
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden no-print">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4">Kurir</th>
                            <th className="px-6 py-4 text-center">Paket</th>
                            <th className="px-6 py-4">Total Nilai</th>
                            <th className="px-6 py-4 text-center">Status Laporan</th>
                            <th className="px-6 py-4 text-right">Validasi / Catatan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredDeliveries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                    Tidak ada laporan yang sesuai dengan filter Anda.
                                </td>
                            </tr>
                        ) : (
                            filteredDeliveries.map((d) => {
                                const courier = users.find(u => u.id === d.courierId);
                                return (
                                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{new Date(d.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 text-sm">{courier?.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">ID: {d.id.toUpperCase()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-slate-900">{d.itemCount}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-indigo-600">Rp {d.totalAmount.toLocaleString('id-ID')}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${d.status === DeliveryStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-100' :
                                                d.status === DeliveryStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                                                }`}>
                                                {d.status === DeliveryStatus.PENDING ? 'Tertunda' : d.status === DeliveryStatus.APPROVED ? 'Disetujui' : 'Ditolak'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right no-print">
                                            <div className="flex flex-col items-end gap-2">
                                                {d.status === DeliveryStatus.PENDING ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleUpdateStatus(d, DeliveryStatus.APPROVED)} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter">Setujui</button>
                                                        <button onClick={() => handleUpdateStatus(d, DeliveryStatus.REJECTED)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter">Tolak</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        {d.paymentStatus !== PaymentStatus.PAID && (
                                                            <button
                                                                onClick={() => handleQuickPayout(d)}
                                                                className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5"
                                                                title="Catat Pembayaran Tunai (Quick Action)"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                                Bayar
                                                            </button>
                                                        )}

                                                        <p className="text-[10px] text-slate-400 italic max-w-[120px] truncate">
                                                            {d.notes || 'No notes'}
                                                        </p>
                                                        <button
                                                            onClick={() => handlePrintSingle(d)}
                                                            className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                            Cetak
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDeliveries;
