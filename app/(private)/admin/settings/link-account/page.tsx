'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { getCookie } from 'cookies-next';

interface LinkedProviders {
  google: boolean;
  line: boolean;
  facebook: boolean;
}

const providerNames = {
  google: 'Google',
  line: 'LINE',
  facebook: 'Facebook',
};

export default function LinkAccountPage() {
  const [linked, setLinked] = useState<LinkedProviders | null>(null);

  useEffect(() => {
    const fetchLinked = async () => {
      try {
        const token = getCookie('accessToken');
        if (!token || typeof token !== 'string') return;

        const res = await axios.get('/me/linked-providers', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLinked(res.data);
      } catch (err) {
        console.error('Error fetching linked providers:', err);
      }
    };

    fetchLinked();
  }, []);

  const handleLink = (provider: keyof LinkedProviders) => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/link/${provider}`;
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">ผูกบัญชีของคุณ</h1>
      {linked ? (
        <div className="space-y-4">
          {Object.entries(linked).map(([provider, isLinked]) => (
            <div
              key={provider}
              className="flex items-center justify-between border p-4 rounded"
            >
              <span>{providerNames[provider as keyof LinkedProviders]}</span>
              {isLinked ? (
                <span className="text-green-600">เชื่อมแล้ว</span>
              ) : (
                <button
                  onClick={() => handleLink(provider as keyof LinkedProviders)}
                  className="bg-blue-600 text-white px-4 py-1 rounded"
                >
                  เชื่อมต่อ
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>กำลังโหลด...</p>
      )}
    </div>
  );
}