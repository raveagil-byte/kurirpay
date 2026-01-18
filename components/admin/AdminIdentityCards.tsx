import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Role, User } from '../../types';

interface AdminIdentityCardsProps {
    onPrintIdentity: (user: User) => void;
}

const AdminIdentityCards: React.FC<AdminIdentityCardsProps> = ({ onPrintIdentity }) => {
    const { users } = useData();

    const getSignatureUrl = (user: User) => {
        const timestamp = new Date().toLocaleString('id-ID');
        const trxId = Math.random().toString(16).slice(2, 10).toUpperCase();
        const officialData = `KURIRPAY-VERIFIED[#${trxId}] U:${user.id.toUpperCase()} | NAME:${user.name} | TS:${timestamp}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(officialData)}&bgcolor=ffffff&color=0f172a&margin=1`;
    };

    return (
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
                        <button onClick={() => onPrintIdentity(courier)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold no-print">Cetak Identitas</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminIdentityCards;
