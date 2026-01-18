import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAdminStats } from '../../hooks/useAdminStats';
import { User } from '../../types';

interface AdminCouriersProps {
    onAddUserClick: () => void;
    onViewSignature: (user: User) => void;
}

const AdminCouriers: React.FC<AdminCouriersProps> = ({ onAddUserClick, onViewSignature }) => {
    const { deleteUser } = useData();
    const { courierStats } = useAdminStats();

    const handleDelete = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus kurir ini?')) {
            await deleteUser(id);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden no-print">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Manajemen Kurir</h2>
                <button onClick={onAddUserClick} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Tambah Kurir</button>
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
                                    <button onClick={() => onViewSignature(courier)} className="text-indigo-600 text-[10px] font-bold uppercase tracking-tighter hover:underline">Verifikasi QR</button>
                                    <button onClick={() => handleDelete(courier.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-tighter">Hapus</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminCouriers;
