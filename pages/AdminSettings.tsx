
import React, { useState } from 'react';
import { AppSettings, Delivery } from '../types.ts';

interface AdminSettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetData: () => void;
  deliveries: Delivery[];
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onUpdateSettings, onResetData, deliveries }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setSuccessMsg("Pengaturan berhasil disimpan.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(deliveries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `kurirpay_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-slate-500">Konfigurasi parameter global dan manajemen basis data.</p>
      </header>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-100 rounded-2xl font-bold text-sm animate-in zoom-in-95">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
        {/* Branding Section */}
        <section className="bg-white rounded-3xl border shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            Identitas Aplikasi
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Aplikasi</label>
              <input 
                type="text" 
                value={localSettings.appName} 
                onChange={(e) => setLocalSettings({...localSettings, appName: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Financial Section */}
        <section className="bg-white rounded-3xl border shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-600 rounded-full"></span>
            Parameter Keuangan
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tarif per Paket (IDR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                <input 
                  type="number" 
                  min="0"
                  value={localSettings.deliveryRate} 
                  onChange={(e) => setLocalSettings({...localSettings, deliveryRate: parseInt(e.target.value) || 0})}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-600 outline-none font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Perubahan tarif akan berlaku untuk laporan baru yang dibuat setelah pengaturan disimpan.</p>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-3xl border shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-600 rounded-full"></span>
            Manajemen Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={exportData}
              className="flex items-center justify-center gap-2 px-6 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Ekspor Data (Backup JSON)
            </button>
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors border border-red-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus Semua Data
            </button>
          </div>
        </section>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            Simpan Semua Perubahan
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Hapus Seluruh Data?</h3>
            <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">
              Tindakan ini akan menghapus seluruh riwayat pengiriman, notifikasi, dan payroll secara permanen. <br/><span className="font-bold text-red-600">Data tidak dapat dikembalikan.</span>
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                  setSuccessMsg("Seluruh data berhasil dibersihkan.");
                  setTimeout(() => setSuccessMsg(null), 3000);
                }}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
