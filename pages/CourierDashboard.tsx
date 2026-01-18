
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { User, Delivery, DeliveryStatus, PaymentStatus, AppNotification } from '../types.ts';

interface CourierDashboardProps {
  user: User;
  deliveryRate: number;
  deliveries: Delivery[];
  onAddDelivery: (delivery: Delivery) => void;
  onUpdateDelivery: (delivery: Delivery) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
}

const CourierDashboard: React.FC<CourierDashboardProps> = ({
  user,
  deliveryRate,
  deliveries,
  onAddDelivery,
  onUpdateDelivery,
  addNotification
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [itemCount, setItemCount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const approvedDeliveries = deliveries.filter(d => d.status === DeliveryStatus.APPROVED);

    const todayApprovedItems = approvedDeliveries.filter(d => d.date === today).reduce((sum, d) => sum + d.itemCount, 0);
    const totalItems = approvedDeliveries.reduce((sum, d) => sum + d.itemCount, 0);
    const totalEarnings = approvedDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);

    const unpaidDeliveries = approvedDeliveries.filter(d => d.paymentStatus !== PaymentStatus.PAID);
    const unpaidEarnings = unpaidDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
    const isPayoutPending = unpaidDeliveries.some(d => d.paymentStatus === PaymentStatus.PENDING_REQUEST);

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyApprovedItems = approvedDeliveries.filter(d => new Date(d.date) >= startOfWeek).reduce((sum, d) => sum + d.itemCount, 0);
    const pendingCount = deliveries.filter(d => d.status === DeliveryStatus.PENDING).length;

    // Deteksi jika sudah lapor untuk hari ini
    const hasReportedToday = deliveries.some(d => d.date === today);

    return {
      todayEarnings: todayApprovedItems * deliveryRate,
      weeklyEarnings: weeklyApprovedItems * deliveryRate,
      totalEarnings,
      totalItems,
      unpaidEarnings,
      isPayoutPending,
      pendingCount,
      hasReportedToday,
      today
    };
  }, [deliveries, deliveryRate]);

  const handleSubmit = (e?: React.FormEvent, customCount?: number) => {
    if (e) e.preventDefault();
    setError(null);

    const finalCount = customCount !== undefined ? customCount : itemCount;

    if (finalCount <= 0) {
      setError("Jumlah paket harus lebih dari 0.");
      return;
    }

    onAddDelivery({
      id: Math.random().toString(36).substr(2, 9),
      courierId: user.id,
      date,
      itemCount: finalCount,
      ratePerItem: deliveryRate,
      totalAmount: finalCount * deliveryRate,
      status: DeliveryStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      notes: customCount ? "Dibuat otomatis oleh Smart-Sync Sistem" : ""
    });

    setItemCount(0);
    setShowLogModal(false);
    toast.success('Laporan pengiriman berhasil dikirim!');
  };

  const handleRequestPayout = () => {
    const unpaid = deliveries.filter(d => d.status === DeliveryStatus.APPROVED && d.paymentStatus === PaymentStatus.UNPAID);
    if (unpaid.length === 0) return;

    unpaid.forEach(d => {
      onUpdateDelivery({ ...d, paymentStatus: PaymentStatus.PENDING_REQUEST });
    });

    addNotification({
      userId: 'admin',
      title: 'Permintaan Payout Baru',
      message: `${user.name} mengajukan penarikan gaji sebesar Rp ${stats.unpaidEarnings.toLocaleString('id-ID')}.`,
      type: 'PAYOUT_REQUEST'
    });
    toast.success('Permintaan pembayaran gaji berhasil diajukan!');
  };

  const [printingOverview, setPrintingOverview] = useState(false);

  const handlePrintOverview = () => {
    setPrintingOverview(true);
    setTimeout(() => {
      window.print();
      setPrintingOverview(false);
    }, 100);
  };

  return (
    <div className="space-y-8">
      {printingOverview && (
        <div className="print-only receipt-container p-8">
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">KurirPay</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Laporan Riwayat Pengiriman</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-none border border-slate-200 mb-10">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
              <p className="text-xs font-bold text-slate-500">NAMA KURIR</p>
              <p className="font-black text-lg text-slate-900">{user.name}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-500">PERIODE DATA</p>
              <p className="text-sm font-medium">Semua Riwayat - {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          <table className="w-full mb-10 text-sm">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-3 text-left font-black uppercase">Tanggal</th>
                <th className="py-3 text-center font-black uppercase">Jumlah</th>
                <th className="py-3 text-right font-black uppercase">Estimasi Pendapatan</th>
                <th className="py-3 text-center font-black uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveries.map(d => (
                <tr key={d.id}>
                  <td className="py-2 text-slate-700">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="py-2 text-center text-slate-900 font-bold">{d.itemCount} Pkt</td>
                  <td className="py-2 text-right">Rp {d.totalAmount.toLocaleString()}</td>
                  <td className="py-2 text-center text-xs uppercase font-bold">{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-20">
            <div className="bg-slate-900 text-white p-6 w-72">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">TOTAL PENDAPATAN (VERIFIED)</p>
              <h3 className="text-2xl font-black">Rp {stats.totalEarnings.toLocaleString('id-ID')}</h3>
            </div>
          </div>

          <div className="mt-20 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold italic">Dokumen ini dicetak otomatis dari sistem KurirPay.</p>
          </div>
        </div>
      )}


      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Halo, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 flex items-center gap-2">
            Tarif: <span className="font-bold text-indigo-600">Rp {deliveryRate.toLocaleString('id-ID')}/paket</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLogModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">+ Lapor Manual</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Wallet Section */}
        <div className="md:col-span-4 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>

          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Gaji Belum Ditarik</p>
          <h3 className="text-4xl font-bold mb-8 relative z-10">Rp {stats.unpaidEarnings.toLocaleString('id-ID')}</h3>

          <button
            onClick={handleRequestPayout}
            disabled={stats.unpaidEarnings <= 0 || stats.isPayoutPending}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all relative z-10 ${stats.isPayoutPending
              ? 'bg-amber-500 text-white cursor-default'
              : stats.unpaidEarnings > 0
                ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            {stats.isPayoutPending ? '🕒 Menunggu Admin...' : 'Tarik Gaji'}
          </button>

          {stats.isPayoutPending && (
            <p className="text-[10px] text-amber-400 mt-4 text-center italic relative z-10">Admin telah dinotifikasi untuk memproses gaji Anda.</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendapatan Hari Ini</p>
            <h3 className="text-2xl font-bold text-slate-900">Rp {stats.todayEarnings.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendapatan Minggu Ini</p>
            <h3 className="text-2xl font-bold text-indigo-600">Rp {stats.weeklyEarnings.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paket (Verified)</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalItems} Paket</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Menunggu Persetujuan</p>
            <h3 className={`text-2xl font-bold ${stats.pendingCount > 0 ? 'text-amber-500' : 'text-slate-900'}`}>{stats.pendingCount} Laporan</h3>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-900">Riwayat Pengiriman</h2>
          <button onClick={handlePrintOverview} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Unduh Laporan PDF</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Jumlah Paket</th>
                <th className="px-6 py-4">Status Laporan</th>
                <th className="px-6 py-4">Info</th>
                <th className="px-6 py-4 text-right">Status Gaji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">Belum ada riwayat pengiriman.</td>
                </tr>
              ) : (
                deliveries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{d.itemCount} Pkt</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${d.status === DeliveryStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-100' :
                        d.status === DeliveryStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>{d.status === DeliveryStatus.APPROVED ? 'DISETUJUI' : d.status === DeliveryStatus.REJECTED ? 'DITOLAK' : 'MENUNGGU'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] text-slate-400 font-medium">{d.notes || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${d.paymentStatus === PaymentStatus.PAID ? 'text-indigo-600' :
                        d.paymentStatus === PaymentStatus.PENDING_REQUEST ? 'text-amber-600 italic' : 'text-slate-300'
                        }`}>{d.paymentStatus === PaymentStatus.PAID ? 'LUNAS' : d.paymentStatus === PaymentStatus.PENDING_REQUEST ? 'DI PROSES' : 'BELUM DIBAYAR'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Lapor Pengiriman</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tanggal Pengiriman</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah Paket Berhasil</label>
                <div className="relative">
                  <input
                    type="number"
                    value={itemCount || ''}
                    onChange={(e) => setItemCount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-5 border border-slate-200 rounded-3xl text-4xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-600 outline-none text-center"
                    placeholder="0"
                    required
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">PKT</div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-[10px] text-slate-500 italic">* Estimasi: Rp {(itemCount * deliveryRate).toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowLogModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Kirim Laporan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierDashboard;
