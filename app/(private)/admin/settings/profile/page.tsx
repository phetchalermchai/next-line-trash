"use client";

import { useEffect, useState } from "react";
import AccountApiKeySection from "@/components/settings/AccountApiKeySection";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import axios from "axios";
import ProfileSection from "@/components/settings/ProfileSection";
import SkeletonProfile from "@/components/settings/SkeletonProfile";

const ProfileSettingsPage = () => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loadingFetch, setLoadingFetch] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const fetchUser = async () => {
      try {
        setLoadingFetch(true);
        const res = await axios.get(`/api/users/${session.user.id}`);
        if (!res.data) {
          toast.info("ไม่พบผู้ใช้งานตามเงื่อนไข");
          setUser(null);
        } else {
          setUser(res.data);
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
      } finally {
        setLoadingFetch(false);
      }
    };
    if (session?.user?.id) fetchUser();
  }, [status, session?.user?.id]);

  if (status === "loading" || loadingFetch)
    return <SkeletonProfile />;

  if (!user)
    return (
      <div className="py-12 text-center text-destructive space-y-3">
        <div>ไม่พบข้อมูลผู้ใช้ หรือ session หมดอายุ</div>
        <button
          className="btn btn-outline"
          onClick={() => window.location.reload()}
        >
          รีเฟรชหน้า
        </button>
      </div>
    );

  return (
    <div className="space-y-4 m-6 ">
      <h2 className="text-xl font-bold">ข้อมูลบัญชี</h2>
      <ProfileSection user={user} />
      <AccountApiKeySection />
    </div>
  )
}

export default ProfileSettingsPage