'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('authToken', token);

      refreshUser().finally(() => {
        router.replace('/');
      });
    } else {
      console.error('No token found in URL');
      router.replace('/');
    }
  }, [refreshUser, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      {/* spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 dark:border-primary-400 mb-6"></div>

      {/* message */}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Logging you in...
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Please wait while we redirect you to your dashboard.
      </p>
    </div>
  );
}
