"use client"

import { useEffect, useState } from "react"
import { getSession, signIn, signOut, useSession } from "next-auth/react"
import api from "@/lib/axios"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [linkedAccounts, setLinkedAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const linked = searchParams.get("linked")
    if (linked) {
      toast.success(`เชื่อมบัญชี ${linked} สำเร็จ`)
      const url = new URL(window.location.href)
      url.searchParams.delete("linked")
      router.replace(url.toString())
    }
  }, [searchParams, router])

  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      try {
        const res = await api.get("/auth/linked-accounts")
        setLinkedAccounts(res.data) // เช่น ["google", "facebook"]
      } catch (err) {
        console.error("Error fetching linked accounts", err)
        toast.error("โหลดข้อมูลบัญชีล้มเหลว")
      } finally {
        setLoading(false)
      }
    }
    fetchLinkedAccounts()
  }, [])

  const providers = ["google", "facebook", "line"]
  const providerNames: Record<string, string> = {
    google: "Google",
    facebook: "Facebook",
    line: "LINE",
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ตั้งค่าบัญชีผู้ใช้</h1>
        <button
          onClick={() => signOut()}
          className="text-sm text-red-600 hover:underline"
        >
          ออกจากระบบ
        </button>
      </div>

      {session?.user && (
        <div className="p-4 bg-gray-100 rounded shadow-sm">
          <p className="font-medium">{session.user.name}</p>
          <p className="text-sm text-gray-600">{session.user.email}</p>
        </div>
      )}

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <div
              key={p}
              className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded shadow-sm"
            >
              <span>บัญชี {providerNames[p]}</span>
              {linkedAccounts.includes(p) ? (
                <span className="text-green-600 font-medium">เชื่อมแล้ว</span>
              ) : (
                <button
                  onClick={() => {
                    if (session?.user?.id) {
                      sessionStorage.setItem("linkingUserId", session.user.id);
                    }
                    signIn(p, { callbackUrl: "/settings/callback" });
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                >
                  เชื่อมบัญชี
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
