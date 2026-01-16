
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

  // Password Change State
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!name.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'Nama dan Email wajib diisi.' });
      return;
    }

    // Password Validation
    let payload: any = { ...user, name: name.trim(), email: email.trim() };

    if (changePasswordMode) {
      if (!newPassword || !confirmPassword) {
        setMessage({ type: 'error', text: 'Password tidak boleh kosong.' });
        return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password minimal 6 karakter.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
        return;
      }
      // Add password to payload
      payload.password = newPassword;
    }

    // Call Update
    onUpdateUser(payload);

    setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
    setIsEditing(false);
    setChangePasswordMode(false);
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => setMessage(null), 3000);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setChangePasswordMode(false); // Reset password mode when toggling main edit
  };

  const now = new Date();
  const formattedDate = now.toLocaleString('id-ID');
  const trxId = Math.random().toString(16).slice(2, 10).toUpperCase();
  const officialVerificationData = `${appName.toUpperCase()}-VERIFIED[#${trxId}] U:${user.id.toUpperCase()} | NAME:${user.name} | TS:${formattedDate}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(officialVerificationData)}&bgcolor=ffffff&color=0f172a&margin=1`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <header><h1 className="text-3xl font-black text-slate-800 tracking-tight">Profil & Keamanan</h1></header>

      {message && (
        <div className={`p-4 rounded-xl font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-8">
          {/* Account Info Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Informasi Akun</h2>
              {!isEditing && (
                <button onClick={toggleEdit} className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors text-sm">
                  Edit Profil
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>

                {/* Change Password Toggle inside Edit Mode */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-bold text-slate-700">Ganti Password</label>
                    <button type="button" onClick={() => setChangePasswordMode(!changePasswordMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${changePasswordMode ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${changePasswordMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {changePasswordMode && (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password Baru</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          placeholder="Minimal 6 karakter"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Konfirmasi Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          placeholder="Ulangi password baru"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={toggleEdit} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all">Simpan Perubahan</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap</p>
                    <p className="text-base font-bold text-slate-800">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email Address</p>
                    <p className="text-base font-bold text-slate-800">{user.email}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                    Password dapat diubah dengan menekan tombol <b>Edit Profil</b> di atas. Pastikan menggunakan password yang kuat untuk keamanan akun Anda.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="bg-slate-900 rounded-3xl p-8 text-center text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-6">Official Digital Pass</p>

            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="p-4 bg-white rounded-3xl relative z-10 shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
              </div>
            </div>

            <h3 className="text-2xl font-black mb-1">{user.name}</h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wide">Verified User</span>
            </div>

            <p className="text-slate-400 text-xs mt-8 font-mono opacity-60">ID: {user.id.split('-')[0]}••••</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
