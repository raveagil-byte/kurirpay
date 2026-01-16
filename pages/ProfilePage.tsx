
import React, { useState } from 'react';
import { User } from '../types.ts';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (updated: User) => void;
  appName: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser, appName }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setMessage({ type: 'error', text: 'Wajib diisi.' }); return; }
    onUpdateUser({ ...user, name: name.trim(), email: email.trim() });
    setMessage({ type: 'success', text: 'Berhasil diperbarui.' });
    setIsEditing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const now = new Date();
  const formattedDate = now.toLocaleString('id-ID');
  const trxId = Math.random().toString(16).slice(2, 10).toUpperCase();
  const officialVerificationData = `${appName.toUpperCase()}-VERIFIED[#${trxId}] U:${user.id.toUpperCase()} | NAME:${user.name} | TS:${formattedDate}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(officialVerificationData)}&bgcolor=ffffff&color=0f172a&margin=1`;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header><h1 className="text-3xl font-bold">Profil & Keamanan</h1></header>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 bg-white rounded-3xl border p-8">
          <h2 className="text-lg font-bold mb-6">Informasi Akun</h2>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-xl" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-xl" />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Simpan</button>
            </form>
          ) : (
            <div className="space-y-4">
              <div><p className="text-xs text-slate-400 uppercase">Nama</p><p className="font-bold">{user.name}</p></div>
              <div><p className="text-xs text-slate-400 uppercase">Email</p><p className="font-bold">{user.email}</p></div>
              <button onClick={() => setIsEditing(true)} className="text-indigo-600 font-bold">Ubah Profil</button>
            </div>
          )}
        </div>
        <div className="md:col-span-5 bg-slate-900 rounded-3xl p-8 text-center text-white">
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-4">Official Digital Pass</p>
          <div className="p-4 bg-white rounded-2xl inline-block mb-6"><img src={qrUrl} alt="QR" className="w-40 h-40" /></div>
          <h3 className="text-xl font-bold">{user.name}</h3>
          <p className="text-indigo-400 text-xs mt-2">Verified: Official QR Pass</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
