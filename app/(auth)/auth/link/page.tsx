"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios"; 

export default function LinkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user && session.accessToken) {
      const provider = session.user.image?.includes("googleusercontent") ? "google"
                     : session.user.image?.includes("line-profile") ? "line"
                     : "facebook";

      const providerAccountId = session.user.id;

      axios.post("/auth/link-account", {
        provider,
        providerAccountId,
      })
        .then(() => {
          alert("เชื่อมบัญชีเรียบร้อยแล้ว");
          router.push("/settings");
        })
        .catch((err) => {
          alert("ไม่สามารถเชื่อมบัญชีได้");
          console.error(err);
          router.push("/settings");
        });
    }
  }, [status]);

  return <p>กำลังเชื่อมบัญชี...</p>;
}