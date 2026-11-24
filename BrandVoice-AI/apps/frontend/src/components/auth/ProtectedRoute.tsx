import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const token = localStorage.getItem('brandvoice-token');
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>(() => {
    return token ? 'loading' : 'unauthenticated';
  });

  useEffect(() => {
    const currentToken = localStorage.getItem('brandvoice-token');
    if (!currentToken) {
      setStatus('unauthenticated');
      return;
    }

    let isMounted = true;

    apiGet('/auth/me')
      .then(() => {
        if (isMounted) {
          setStatus('authenticated');
        }
      })
      .catch(() => {
        localStorage.removeItem('brandvoice-token');
        if (isMounted) {
          setStatus('unauthenticated');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
