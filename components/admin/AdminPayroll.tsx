import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAdminStats } from '../../hooks/useAdminStats';
import { API_URL } from '../../config';
import { DeliveryStatus, PaymentStatus, User } from '../../types';

const AdminPayroll: React.FC = () => {
    const { token } = useAuth();
    const { deliveries } = useData();
    const { courierStats } = useAdminStats();

    // Payroll Confirmation State
    const [paymentModalData, setPaymentModalData] = useState<{ courier: User; amount: number } | null>(null);
    const [manualAmount, setManualAmount] = useState<number>(0);
    const [bonusAmount, setBonusAmount] = useState(0);
    const [deductionAmount, setDeductionAmount] = useState(0);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handleOpenPaymentModal = (courier: any) => {
        setPaymentModalData({ courier, amount: courier.unpaidAmount });
        setManualAmount(courier.unpaidAmount);
        setBonusAmount(0);
        setDeductionAmount(0);
        setPaymentError(null);
    };

    const handleConfirmPayment = async () => {
        const totalTransfer = manualAmount + bonusAmount - deductionAmount;

        if (totalTransfer < 0) {
            setPaymentError("Total transfer tidak boleh negatif.");
            return;
        }

        if (!paymentModalData) return;

        const { courier } = paymentModalData;
        const unpaid = deliveries.filter(d => d.courierId === courier.id && d.status === DeliveryStatus.APPROVED && d.paymentStatus !== PaymentStatus.PAID);

        try {
            const response = await fetch(`${API_URL}/api/payments/payout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courierId: courier.id,
                    deliveryIds: unpaid.map(d => d.id),
                    amount: manualAmount,
                    bonus: bonusAmount,
                    deduction: deductionAmount,
                    method: 'CASH',
                    notes: 'Pembayaran Gaji via Admin Dashboard'
                })
            });

            if (response.ok) {
                toast.success(`Pembayaran untuk ${courier.name} berhasil!`);
                setPaymentModalData(null);
                // Force reload to sync all states (Deliveries, Notifications, Audit Logs)
                // In a perfect world we would just specific refresh, but full reload ensures everything is clean for now.
                // Or we call `refreshDeliveries` from useData + `fetchLogs` etc.
                // For now keep the reload behavior or better:
                window.location.reload();
            } else {
                const err = await response.json();
                setPaymentError(err.message || "Pembayaran gagal");
            }
        } catch (e) {
            setPaymentError("Terjadi kesalahan sistem saat menghubungi server.");
        }
    };

    const payoutRequestsCount = courierStats.filter(c => c.hasPayoutRequest).length;

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden no-print">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-slate-900">Daftar Payroll Kurir</h2>
                    <p className="text-sm text-slate-500">Manajemen pengajuan dan pelunasan gaji harian/mingguan.</p>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Nama Kurir</th>
                            <th className="px-6 py-4">Status Request</th>
                            <th className="px-6 py-4">Jumlah Belum Dibayar</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {courierStats.map((courier) => (
                            <tr key={courier.id} className={`hover:bg-slate-50 ${courier.hasPayoutRequest ? 'bg-red-50/30' : ''}`}>
                                <td className="px-6 py-4 font-bold text-slate-900">{courier.name}</td>
                                <td className="px-6 py-4">
                                    {courier.hasPayoutRequest ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase animate-pulse">
                                            Minta Payout
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">Belum ada request</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-900">Rp {courier.unpaidAmount.toLocaleString('id-ID')}</p>
                                    <p className="text-[10px] text-slate-500">{courier.unpaidDeliveriesCount} laporan tertunda</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleOpenPaymentModal(courier)}
                                        disabled={courier.unpaidAmount <= 0}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${courier.unpaidAmount > 0
                                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Bayar Sekarang
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Payment Confirmation Modal */}
            {paymentModalData && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200 no-print">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="mb-6 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Konfirmasi Pembayaran</h3>
                            <p className="text-slate-500 text-sm mt-1">Gaji untuk <span className="font-bold text-slate-900">{paymentModalData.courier.name}</span></p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jumlah Gaji (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={manualAmount || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setManualAmount(val || 0);
                                            if (val > 0) setPaymentError(null);
                                        }}
                                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl text-2xl font-bold outline-none transition-all ${paymentError ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50'
                                            }`}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bonus (Opsional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={bonusAmount || ''}
                                            onChange={(e) => setBonusAmount(parseInt(e.target.value) || 0)}
                                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-50"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Potongan (Opsional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={deductionAmount || ''}
                                            onChange={(e) => setDeductionAmount(parseInt(e.target.value) || 0)}
                                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Total Transfer</span>
                                <span className="text-lg font-black text-indigo-600">Rp {(manualAmount + bonusAmount - deductionAmount).toLocaleString('id-ID')}</span>
                            </div>
                            {paymentError && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-tighter">{paymentError}</p>}
                            <p className="text-[10px] text-slate-500 mt-2 italic">* Terkalkulasi sistem: Rp {paymentModalData.amount.toLocaleString('id-ID')}</p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setPaymentModalData(null)}
                                className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all"
                            >
                                Konfirmasi Bayar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPayroll;
