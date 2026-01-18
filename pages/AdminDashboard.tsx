import React, { useState } from 'react';
import { User, Delivery } from '../types.ts';
import { useAdminStats } from '../hooks/useAdminStats';

// Components
import AdminOverview from '../components/admin/AdminOverview';
import AdminCouriers from '../components/admin/AdminCouriers';
import AdminDeliveries from '../components/admin/AdminDeliveries';
import AdminPayroll from '../components/admin/AdminPayroll';
import AdminAuditLogs from '../components/admin/AdminAuditLogs';
import AdminIdentityCards from '../components/admin/AdminIdentityCards';
import UserModal from '../components/admin/UserModal';
import SignatureModal from '../components/admin/SignatureModal.tsx';
import PrintableIdentity from '../components/admin/PrintableIdentity';

interface AdminDashboardProps {
  users: User[];
  deliveries: Delivery[];
  appName: string;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onUpdateDelivery: (delivery: Delivery) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ appName }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'couriers' | 'deliveries' | 'payroll' | 'identitas' | 'audit_logs'>('overview');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [viewingSignature, setViewingSignature] = useState<User | null>(null);
  const [printingIdentity, setPrintingIdentity] = useState<User | null>(null);

  const { stats, courierStats } = useAdminStats();

  const payoutRequestsCount = courierStats.filter(c => c.hasPayoutRequest).length;

  const handlePrintIdentity = (user: User) => {
    setPrintingIdentity(user);
    setTimeout(() => {
      window.print();
      setPrintingIdentity(null);
    }, 100);
  };

  return (
    <div className="space-y-8">
      {/* Printable Identity Card (Overlay) */}
      {printingIdentity && <PrintableIdentity user={printingIdentity} appName={appName} />}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Kelola operasional, payroll, dan validasi laporan harian.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex p-1 bg-slate-100 rounded-lg self-start">
            {['overview', 'couriers', 'deliveries', 'payroll', 'identitas'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize flex items-center gap-2 ${activeTab === tab ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {tab === 'deliveries' && stats.pendingCount > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full"></span>}
                {tab === 'payroll' && payoutRequestsCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                {tab === 'deliveries' ? `Detail Laporan` : tab}
              </button>
            ))}
            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize flex items-center gap-2 ${activeTab === 'audit_logs' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Audit Logs
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'overview' && <AdminOverview />}

      {activeTab === 'couriers' && (
        <AdminCouriers
          onAddUserClick={() => setIsAddingUser(true)}
          onViewSignature={setViewingSignature}
        />
      )}

      {activeTab === 'deliveries' && <AdminDeliveries appName={appName} />}

      {activeTab === 'payroll' && <AdminPayroll />}

      {activeTab === 'identitas' && (
        <AdminIdentityCards onPrintIdentity={handlePrintIdentity} />
      )}

      {activeTab === 'audit_logs' && <AdminAuditLogs />}

      {/* Modals */}
      {isAddingUser && <UserModal onClose={() => setIsAddingUser(false)} />}

      {viewingSignature && (
        <SignatureModal user={viewingSignature} onClose={() => setViewingSignature(null)} />
      )}

    </div>
  );
};

export default AdminDashboard;
