import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { API_URL } from '../config';

interface LoginPageProps {
  appName: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ appName }) => {
  const { login, register, loading, error } = useAuth();
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Quick toggle for demo registration

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    try {
      if (viewMode === 'login') {
        await login(email, password);
      } else if (viewMode === 'register') {
        await register(name, email, password, isAdmin ? Role.ADMIN : Role.COURIER);
        alert('Registrasi berhasil! Silakan login.');
        setViewMode('login');
        setPassword('');
        setShowPassword(false);
      } else if (viewMode === 'forgot') {
        // Handle Forgot Password
        const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (response.ok) {
          setForgotMessage("Link reset password telah dikirim ke email Anda.");
        } else {
          alert(data.message || 'Gagal mengirim email');
        }
      }
    } catch (err) {
      // Error handled in context state usually
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4">
            {appName.charAt(0)}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            {viewMode === 'login' ? 'Masuk ke Akun' : viewMode === 'register' ? 'Daftar Akun Baru' : 'Lupa Password?'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {viewMode === 'forgot' ? 'Masukkan email Anda untuk mereset password.' : 'Sistem Manajemen Pengajian & Logistik'}
          </p>
        </div>

        {error && viewMode !== 'forgot' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {forgotMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-in fade-in">
            <p className="text-sm text-green-700 font-bold">{forgotMessage}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {viewMode === 'register' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm shadow-sm"
                  placeholder="Nama Lengkap"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm shadow-sm"
                placeholder="email@contoh.com"
              />
            </div>

            {viewMode !== 'forgot' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm shadow-sm pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                    Ingat saya
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" onClick={(e) => { e.preventDefault(); setViewMode('forgot'); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Lupa password?
                  </a>
                </div>
              </div>
            )}

            {viewMode === 'register' && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isAdmin" className="text-sm text-slate-600">Daftar sebagai Admin (Demo)</label>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-extrabold rounded-2xl text-white ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-100 transition-all`}
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {viewMode === 'login' ? 'Masuk Sekarang' : viewMode === 'register' ? 'Daftar Akun' : 'Kirim Reset Link'}
            </button>
          </div>

          <div className="text-center space-y-2">
            {viewMode === 'forgot' ? (
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Kembali ke Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setViewMode(viewMode === 'login' ? 'register' : 'login');
                }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {viewMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
