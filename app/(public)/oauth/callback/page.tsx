'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeToken } from '@/lib/jwt';
import { setCookie } from 'cookies-next';

function OAuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');

    if (token) {
      try {
        // ✅ เก็บ token ลง cookie แทน localStorage
        setCookie('accessToken', token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 วัน
          sameSite: 'lax',
          secure: false, // เปลี่ยนเป็น true ถ้า deploy จริง
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

  return <p>กำลังเข้าสู่ระบบ...</p>;
}

export default function OAuthCallbackPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Suspense fallback={<p>กำลังโหลด...</p>}>
        <OAuthCallbackContent />
      </Suspense>
    </div>
  );
}