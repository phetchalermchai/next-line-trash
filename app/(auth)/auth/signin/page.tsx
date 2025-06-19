"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

const SignInPage = () => {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">เข้าสู่ระบบ</h1>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          เข้าสู่ระบบด้วย Google
        </button>

        <button
          onClick={() => signIn("facebook", { callbackUrl })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          เข้าสู่ระบบด้วย Facebook
        </button>

        <button
          onClick={() => signIn("line", { callbackUrl })}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          เข้าสู่ระบบด้วย LINE
        </button>
      </div>
    </div>
  )
}

export default SignInPage
