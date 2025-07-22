'use client';

import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSession } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { customToast } from '@/lib/toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    customToast.logoutSuccess();
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-base-200">
        {session?.user && (
          <Navbar 
            user={session.user} 
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
