import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Role } from '../../types';

interface UserModalProps {
    onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ onClose }) => {
    const { addUser } = useData();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await addUser({
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            role: Role.COURIER
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[100] no-print">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold mb-6 text-slate-900">Tambah Kurir Baru</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Nama</label><input required name="name" type="text" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Email</label><input required name="email" type="email" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Password</label><input required name="password" type="text" placeholder="Password untuk login kurir" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600" /></div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border rounded-xl font-bold">Batal</button>
                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
