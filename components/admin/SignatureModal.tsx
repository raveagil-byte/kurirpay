import React from 'react';
import { User } from '../../types';

interface SignatureModalProps {
    user: User;
    onClose: () => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ user, onClose }) => {

    const getSignatureUrl = (user: User) => {
        const timestamp = new Date().toLocaleString('id-ID');
        const trxId = Math.random().toString(16).slice(2, 10).toUpperCase();
        const officialData = `KURIRPAY-VERIFIED[#${trxId}] U:${user.id.toUpperCase()} | NAME:${user.name} | TS:${timestamp}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(officialData)}&bgcolor=ffffff&color=0f172a&margin=1`;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[100] no-print">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200 text-center">
                <h3 className="text-xl font-bold mb-2">Digital Signature Pass</h3>
                <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800 uppercase tracking-widest border border-green-200">
                        VERIFIED BY KURIRPAY SYSTEM
                    </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl mb-6">
                    <img src={getSignatureUrl(user)} alt="QR" className="w-48 h-48 mx-auto" />
                </div>

                <div className="space-y-3 mb-6 text-left border-t border-slate-100 pt-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Courier Name</span>
                        <span className="text-xs font-bold text-slate-900">{user.name}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Unique Identity ID</span>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded self-start">KP-U-{user.id.toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Last Verification Timestamp</span>
                        <span className="text-[10px] font-medium text-slate-900">{new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}</span>
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Tutup Jendela</button>
            </div>
        </div>
    );
};

export default SignatureModal;
