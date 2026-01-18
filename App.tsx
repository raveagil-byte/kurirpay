import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Role } from './types';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { DataProvider } from './contexts/DataContext';

// Hooks
import { useUsers } from './hooks/useUsers';
import { useDeliveries } from './hooks/useDeliveries';

// Components & Pages
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminPayouts from './pages/AdminPayouts';
import CourierDashboard from './pages/CourierDashboard';
import ProfilePage from './pages/ProfilePage';
import AdminSettings from './pages/AdminSettings';
import DashboardLayout from './layouts/DashboardLayout';

import PublicTrackingPage from './pages/PublicTrackingPage';

// Sub-component to handle routing logic so hooks can be used
const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { users, addUser, deleteUser, updateUser } = useUsers();
  const {
    deliveries,
    addDelivery,
    updateDelivery,

    clearDeliveries
  } = useDeliveries();
  const { addNotification, clearAll: clearNotifications } = useNotifications();

  // Reset Data Helper
  const handleResetData = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) return;

      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/settings/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      // Clear local state
      clearDeliveries();
      clearNotifications();
      // Force refresh of users or other stats if needed
      window.location.reload();
    } catch (e) {
      console.error("Failed to reset data", e);
    }
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<PublicTrackingPage />} />
        <Route path="/tracking" element={<PublicTrackingPage />} />
        <Route path="/login" element={
          <LoginPage
            appName={settings.appName}
          />
        } />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/tracking" element={<PublicTrackingPage />} />
        <Route
          path="/"
          element={
            user.role === Role.ADMIN ? (
              <AdminDashboard
                users={users}
                deliveries={deliveries}
                appName={settings.appName}
                onAddUser={addUser}
                onDeleteUser={deleteUser}

                onUpdateDelivery={updateDelivery}
              />
            ) : (
              <CourierDashboard
                user={user}
                deliveryRate={settings.deliveryRate}
                deliveries={deliveries.filter(d => d.courierId === user?.id)}
                onAddDelivery={addDelivery}
                onUpdateDelivery={updateDelivery}
                addNotification={addNotification}
              />
            )
          }
        />
        <Route
          path="/profile"
          element={
            <ProfilePage
              user={user}
              onUpdateUser={updateUser}
              appName={settings.appName}
            />
          }
        />
        <Route
          path="/settings"
          element={
            user.role === Role.ADMIN ? (
              <AdminSettings
                settings={settings}
                onUpdateSettings={updateSettings}
                onResetData={handleResetData}
                deliveries={deliveries}
              />
            ) : <Navigate to="/" />
          }
        />
        <Route
          path="/admin/payouts"
          element={
            user.role === Role.ADMIN ? (
              <AdminPayouts />
            ) : <Navigate to="/" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </DashboardLayout>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <SettingsProvider>
          <NotificationProvider>
            <DataProvider>
              <AppRoutes />
              <Toaster position="top-center" richColors />
            </DataProvider>
          </NotificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
