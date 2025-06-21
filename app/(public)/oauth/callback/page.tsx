'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeToken } from '@/lib/jwt';
import { setCookie } from 'cookies-next';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');

    if (token) {
      try {
        // ✅ เก็บ token ลง cookie แทน localStorage
        setCookie('accessToken', token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: true, // ✅ ถ้าเป็น local dev
        });

        const payload = decodeToken(token);
        console.log('[OAuth] Decoded Token:', payload);

        router.replace('/admin/dashboard');
      } catch (err) {
        console.error('Invalid token:', err);
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [params, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>กำลังเข้าสู่ระบบ...</p>
    </div>
  );
}
