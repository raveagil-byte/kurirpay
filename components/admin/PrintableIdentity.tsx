import React from 'react';
import { User } from '../../types';

interface PrintableIdentityProps {
    user: User;
    appName: string;
}

const PrintableIdentity: React.FC<PrintableIdentityProps> = ({ user, appName }) => {

    const getSignatureUrl = (user: User) => {
        const timestamp = new Date().toLocaleString('id-ID');
        const trxId = Math.random().toString(16).slice(2, 10).toUpperCase();
        const officialData = `KURIRPAY-VERIFIED[#${trxId}] U:${user.id.toUpperCase()} | NAME:${user.name} | TS:${timestamp}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(officialData)}&bgcolor=ffffff&color=0f172a&margin=1`;
    };

    return (
        <div className="print-only receipt-container items-center justify-center flex flex-col h-screen">
            <div className="border-4 border-slate-900 p-8 rounded-3xl w-full max-w-lg text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-4 bg-slate-900"></div>

                <h1 className="text-3xl font-black text-slate-900 mb-2 mt-4">{appName}</h1>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-8">Official Courier Identity</p>

                <div className="mb-8 relative inline-block">
                    <img src={getSignatureUrl(user)} alt="QR" className="w-64 h-64 mix-blend-multiply" />
                    <div className="absolute inset-0 border-2 border-slate-900/10 rounded-xl"></div>
                </div>

                <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase">{user.name}</h2>
                <div className="inline-block px-4 py-1 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest rounded-full mb-8">
                    {user.role}
                </div>

                <div className="grid grid-cols-2 gap-4 text-left border-t-2 border-slate-100 pt-8">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Kurir</p>
                        <p className="font-mono font-bold text-lg">{user.id.split('-')[0].toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bergabung Sejak</p>
                        <p className="font-bold text-lg">{new Date().getFullYear()}</p>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold italic">Kartu identitas ini sah dan dikeluarkan oleh sistem {appName}.</p>
                </div>
            </div>
        </div>
    );
};

export default PrintableIdentity;
