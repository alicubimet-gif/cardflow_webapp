'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-3" />
      <p className="text-sm font-semibold text-[#64748B]">Redirecting...</p>
    </div>
  );
}
