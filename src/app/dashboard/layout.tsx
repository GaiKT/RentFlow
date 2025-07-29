'use client';

import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import { customToast } from '@/lib/toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    customToast.logoutSuccess();
    // Small delay to show the toast before redirect
    setTimeout(() => {
      logout();
    }, 500);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-base-200">
        {user && (
          <Navbar 
            user={user} 
            onLogout={handleLogout}
            notificationCount={0}
          />
        )}
        <main className="pt-0">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
