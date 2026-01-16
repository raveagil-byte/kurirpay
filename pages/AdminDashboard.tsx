
import React, { useState, useMemo } from 'react';
import { User, Delivery, Role, DeliveryStatus, PaymentStatus, AppNotification } from '../types.ts';
import { DELIVERY_RATE, APP_NAME } from '../constants.ts';


interface AdminDashboardProps {
  users: User[];
  deliveries: Delivery[];
  appName: string;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (user: User) => void;
  onDeleteDelivery: (id: string) => void;
  onUpdateDelivery: (delivery: Delivery) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  deliveries,
  appName,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
  onDeleteDelivery,
  onUpdateDelivery,
  addNotification
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'couriers' | 'deliveries' | 'payroll' | 'identitas'>('overview');
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [viewingSignature, setViewingSignature] = useState<User | null>(null);

  // Advanced Filter State
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatus | 'ALL'>('ALL');
  const [filterMinPkg, setFilterMinPkg] = useState<string>("");
  const [filterMaxPkg, setFilterMaxPkg] = useState<string>("");
  const [filterCourierId, setFilterCourierId] = useState<string>("ALL");

  // State for single delivery printing
  const [printingDelivery, setPrintingDelivery] = useState<Delivery | null>(null);

  // Payroll Confirmation State
  const [paymentModalData, setPaymentModalData] = useState<{ courier: User; amount: number } | null>(null);
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const approvedDeliveries = deliveries.filter(d => d.status === DeliveryStatus.APPROVED);
    const totalItems = approvedDeliveries.reduce((sum, d) => sum + d.itemCount, 0);
    const totalEarnings = approvedDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
    const courierCount = users.filter(u => u.role === Role.COURIER).length;

    // Status Breakdown
    const pendingCount = deliveries.filter(d => d.status === DeliveryStatus.PENDING).length;
    const approvedCount = deliveries.filter(d => d.status === DeliveryStatus.APPROVED).length;
    const rejectedCount = deliveries.filter(d => d.status === DeliveryStatus.REJECTED).length;

    const unpaidEarnings = deliveries
      .filter(d => d.status === DeliveryStatus.APPROVED && d.paymentStatus !== PaymentStatus.PAID)
      .reduce((sum, d) => sum + d.totalAmount, 0);

    return {
      totalItems,
      totalEarnings,
      courierCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      unpaidEarnings
    };
  }, [deliveries, users]);

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

  const courierStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return users
      .filter(u => u.role === Role.COURIER)
      .map(u => {
        const uDeliveries = deliveries.filter(d => d.courierId === u.id && d.status === DeliveryStatus.APPROVED);
        const totalItems = uDeliveries.reduce((sum, d) => sum + d.itemCount, 0);
        const totalEarnings = uDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);

        const unpaidDeliveries = uDeliveries.filter(d => d.paymentStatus !== PaymentStatus.PAID);
        const unpaidAmount = unpaidDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
        const hasPayoutRequest = unpaidDeliveries.some(d => d.paymentStatus === PaymentStatus.PENDING_REQUEST);

        const weeklyDeliveries = uDeliveries.filter(d => new Date(d.date) >= startOfWeek);
        const weeklyItems = weeklyDeliveries.reduce((sum, d) => sum + d.itemCount, 0);
        const weeklyEarnings = weeklyDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);

        return {
          ...u,
          totalItems,
          totalEarnings,
          weeklyItems,
          weeklyEarnings,
          unpaidAmount,
          hasPayoutRequest,
          unpaidDeliveriesCount: unpaidDeliveries.length
        };
      });
  }, [users, deliveries]);

  const handleUpdateStatus = (delivery: Delivery, status: DeliveryStatus) => {
    onUpdateDelivery({ ...delivery, status });
  };

  const handleOpenPaymentModal = (courier: any) => {
    setPaymentModalData({ courier, amount: courier.unpaidAmount });
    setManualAmount(courier.unpaidAmount);
    setPaymentError(null);
  };

  const handleConfirmPayment = () => {
    if (manualAmount <= 0) {
      setPaymentError("Jumlah gaji harus lebih besar dari 0.");
      return;
    }

    if (!paymentModalData) return;

    const { courier } = paymentModalData;
    const unpaid = deliveries.filter(d => d.courierId === courier.id && d.status === DeliveryStatus.APPROVED && d.paymentStatus !== PaymentStatus.PAID);

    unpaid.forEach(d => {
      onUpdateDelivery({ ...d, paymentStatus: PaymentStatus.PAID });
    });

    addNotification({
      userId: 'admin',
      title: 'Pembayaran Selesai',
      message: `Gaji untuk ${courier.name} sebesar Rp ${manualAmount.toLocaleString('id-ID')} telah berhasil ditandai sebagai TERBAYAR.`,
      type: 'SYSTEM'
    });

    setPaymentModalData(null);
  };

  const getSignatureUrl = (user: User) => {
    const timestamp = new Date().toLocaleString('id-ID');
    const trxId = Math.random().toString(16).slice(2, 10).toUpperCase();
    const officialData = `KURIRPAY-VERIFIED[#${trxId}] U:${user.id.toUpperCase()} | NAME:${user.name} | TS:${timestamp}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(officialData)}&bgcolor=ffffff&color=0f172a&margin=1`;
  };

  const handlePrintSingle = (delivery: Delivery) => {
    setPrintingDelivery(delivery);
    setTimeout(() => {
      window.print();
      setPrintingDelivery(null);
    }, 100);
  };

  const clearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterPaymentStatus('ALL');
    setFilterMinPkg("");
    setFilterMaxPkg("");
    setFilterCourierId("ALL");
  };

  const payoutRequestsCount = courierStats.filter(c => c.hasPayoutRequest).length;

  return (
    <div className="space-y-8">
      {/* Printable Receipt Area (Only shown during print) */}
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

          <div className="grid grid-cols-2 gap-20 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-20">TTD KURIR</p>
              <div className="border-b border-slate-900 pb-2 font-bold uppercase">{users.find(u => u.id === printingDelivery.courierId)?.name}</div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-20">ADMIN VALIDASI</p>
              <div className="border-b border-slate-900 pb-2 font-bold uppercase tracking-widest">SISTEM {appName}</div>
            </div>
          </div>

          <div className="mt-20 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-bold italic">Laporan ini dihasilkan secara otomatis oleh sistem KurirPay dan merupakan dokumen sah internal.</p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Kelola operasional, payroll, dan validasi laporan harian.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex p-1 bg-slate-100 rounded-lg self-start">
            {['overview', 'couriers', 'deliveries', 'payroll', 'identitas'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize flex items-center gap-2 ${activeTab === tab ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {tab === 'deliveries' && stats.pendingCount > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full"></span>}
                {tab === 'payroll' && payoutRequestsCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                {tab === 'deliveries' ? `Detail Laporan` : tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {activeTab === 'overview' && (
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
      )}

      {activeTab === 'payroll' && (
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
      )}

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
        </div>
      )}

      {activeTab === 'couriers' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden no-print">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Manajemen Kurir</h2>
            <button onClick={() => setIsAddingUser(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Tambah Kurir</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Informasi Kurir</th>
                <th className="px-6 py-4">Performa Minggu Ini</th>
                <th className="px-6 py-4">Akumulasi Total</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courierStats.map((courier) => (
                <tr key={courier.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{courier.name}</p>
                    <p className="text-xs text-slate-500">{courier.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">Paket:</span>
                        <span className="text-sm font-bold text-indigo-600">{courier.weeklyItems} Pkt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">Gaji:</span>
                        <span className="text-sm font-bold text-green-600">Rp {courier.weeklyEarnings.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">{courier.totalItems} Paket Total</p>
                      <p className="text-sm font-bold text-slate-900">Rp {courier.totalEarnings.toLocaleString('id-ID')}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <button onClick={() => setViewingSignature(courier)} className="text-indigo-600 text-[10px] font-bold uppercase tracking-tighter hover:underline">Verifikasi QR</button>
                      <button onClick={() => onDeleteUser(courier.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-tighter">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'deliveries' && (
        <div className="space-y-6 no-print">
          <div className="bg-indigo-900 text-white p-6 rounded-3xl flex justify-between items-center shadow-lg">
            <div>
              <h2 className="text-xl font-bold">Detail Riwayat Pengiriman</h2>
              <p className="text-indigo-200 text-xs">Menampilkan {filteredDeliveries.length} dari {deliveries.length} laporan.</p>
            </div>
            <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/20">Export Laporan</button>
          </div>

          {/* Advanced Filter UI */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
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

          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
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
      )}

      {activeTab === 'identitas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
          {users.filter(u => u.role === Role.COURIER).map((courier) => (
            <div key={courier.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-slate-900 p-4 text-center text-white relative">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">KurirPay Verified Pass</p>
                <h3 className="font-bold truncate px-4 text-sm">{courier.name}</h3>
              </div>
              <div className="p-8 text-center space-y-4">
                <div className="p-2 bg-slate-50 inline-block rounded-2xl border border-slate-100">
                  <img src={getSignatureUrl(courier)} alt="QR Signature" className="w-40 h-40" />
                </div>
                <button onClick={() => window.print()} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold no-print">Cetak Identitas</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingSignature && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[100] no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200 text-center">
            <h3 className="text-xl font-bold mb-2">Digital Signature Pass</h3>
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800 uppercase tracking-widest border border-green-200">
                VERIFIED BY KURIRPAY SYSTEM
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl mb-6">
              <img src={getSignatureUrl(viewingSignature)} alt="QR" className="w-48 h-48 mx-auto" />
            </div>

            <div className="space-y-3 mb-6 text-left border-t border-slate-100 pt-4">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Courier Name</span>
                <span className="text-xs font-bold text-slate-900">{viewingSignature.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Unique Identity ID</span>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded self-start">KP-U-{viewingSignature.id.toUpperCase()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Last Verification Timestamp</span>
                <span className="text-[10px] font-medium text-slate-900">{new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}</span>
              </div>
            </div>

            <button onClick={() => setViewingSignature(null)} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Tutup Jendela</button>
          </div>
        </div>
      )}

      {isAddingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[100] no-print">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6 text-slate-900">Tambah Kurir Baru</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onAddUser({
                id: Math.random().toString(36).substr(2, 9),
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: Role.COURIER
              });
              setIsAddingUser(false);
            }} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Nama</label><input required name="name" type="text" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Email</label><input required name="email" type="email" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600" /></div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingUser(false)} className="flex-1 py-3 border rounded-xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
