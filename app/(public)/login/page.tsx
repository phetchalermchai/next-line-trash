'use client';

const providerUrls = {
  google: `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
  line: `${process.env.NEXT_PUBLIC_API_URL}/auth/line`,
  facebook: `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook`,
};

export default function LoginPage() {
  const handleLogin = (provider: keyof typeof providerUrls) => {
    window.location.href = providerUrls[provider];
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">เข้าสู่ระบบ</h1>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin('google')}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            เข้าสู่ระบบด้วย Google
          </button>

          <button
            onClick={() => handleLogin('line')}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            เข้าสู่ระบบด้วย LINE
          </button>

          <button
            onClick={() => handleLogin('facebook')}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            เข้าสู่ระบบด้วย Facebook
          </button>
        </div>
      </div>
    </div>
  );
}