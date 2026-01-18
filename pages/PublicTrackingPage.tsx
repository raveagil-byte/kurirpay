import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

interface PublicDelivery {
    id: string;
    date: string;
    itemCount: number;
    status: string;
    courier: { name: string };
    createdAt: string;
}

const PublicTrackingPage: React.FC = () => {
    const [deliveries, setDeliveries] = useState<PublicDelivery[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                const res = await fetch(`${API_URL}/api/deliveries/public?limit=50`);
                if (res.ok) {
                    const json = await res.json();
                    setDeliveries(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch public stats");
            } finally {
                setLoading(false);
            }
        };

        fetchDeliveries();

        // Auto-refresh every 30 seconds for live board feel
        const interval = setInterval(fetchDeliveries, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header / Navbar */}
            <div className="bg-slate-900 text-white p-6 shadow-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter">KurirPay<span className="text-indigo-400">.Track</span></h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Delivery Board</p>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Laporan</p>
                        <h3 className="text-3xl font-black text-slate-900">{deliveries.length}</h3>
                    </div>
                    <div className="bg-green-50 p-6 rounded-2xl shadow-sm border border-green-100">
                        <p className="text-[10px] uppercase font-bold text-green-600 tracking-widest mb-1">Selesai (Hari Ini)</p>
                        <h3 className="text-3xl font-black text-green-700">
                            {deliveries.filter(d => new Date(d.date).toDateString() === new Date().toDateString()).length}
                        </h3>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-slate-800">Aktivitas Pengiriman Terbaru</h2>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-green-600">LIVE UPDATED</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Waktu Laporan</th>
                                    <th className="px-6 py-4">Kurir</th>
                                    <th className="px-6 py-4 text-center">Jumlah Paket</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">ID Referensi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : deliveries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Belum ada data publik.</td>
                                    </tr>
                                ) : (
                                    deliveries.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                {new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                                                        {d.courier.name.substring(0, 2)}
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-sm hidden md:inline-block">{d.courier.name}</span>
                                                    <span className="font-bold text-slate-900 text-sm md:hidden">{d.courier.name.split(' ')[0]}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-slate-900 text-lg">
                                                {d.itemCount}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                                                    TERVERIFIKASI
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <code className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-mono group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    #{d.id.substring(0, 8).toUpperCase()}
                                                </code>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-400 text-xs">
                    <p>&copy; {new Date().getFullYear()} KurirPay Systems. Data diperbarui secara real-time.</p>
                </div>
            </div>
        </div>
    );
};

export default PublicTrackingPage;
