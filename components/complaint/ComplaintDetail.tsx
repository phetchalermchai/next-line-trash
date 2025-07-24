"use client";

import { useEffect, useState } from "react";
import { Complaint } from "@/types/complaint";
import { ComplaintInfo } from "@/components/complaint/ComplaintInfo";
import dynamic from "next/dynamic";
import { ComplaintImages } from "./ComplaintImages";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Button } from "../ui/button";
import Link from "next/link";
import ComplaintDetailSkeleton from "@/app/(public)/complaints/[id]/Skeleton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";

const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });

export const ComplaintDetail = ({ complaintId }: { complaintId: string }) => {
    const { data: session } = useSession();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lineProfile, setLineProfile] = useState<{ userId: string; displayName: string } | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);


    useEffect(() => {
        // ถ้ามี session และ role เป็น ADMIN/SUPERADMIN จะไม่โหลด LIFF
        const role = session?.user?.role;
        if (role === "ADMIN" || role === "SUPERADMIN") return;

        // เงื่อนไข: โหลด LIFF เฉพาะ user ที่เปิดจาก LINE (WebView)
        if (typeof window !== "undefined" && window.navigator.userAgent.toLowerCase().includes("line")) {
            import("@line/liff").then((liff) => {
                liff.default.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }).then(() => {
                    if (!liff.default.isLoggedIn()) liff.default.login();
                    liff.default.getProfile().then((profile) => {
                        setLineProfile({
                            userId: profile.userId,
                            displayName: profile.displayName,
                        });
                    });
                });
            });
        }
    }, [session]);

    const fetchComplaint = async (id: string) => {
        try {
            const res = await axios.get(`/api/complaints/${id}`);
            setComplaint(res.data);
        } catch (err) {
            console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", err);
            setError("ไม่สามารถโหลดข้อมูลเรื่องร้องเรียนได้");
        }
    };

    useEffect(() => {
        fetchComplaint(complaintId);
    }, [complaintId]);

    const showCancelButton =
        complaint &&
        complaint.status === "PENDING" &&
        complaint.source === "LINE" &&
        lineProfile?.userId === complaint.lineUserId;

    const handleCancelComplaint = async () => {
        if (!complaint || !lineProfile) return;
        setCancelLoading(true);
        try {
            await axios.patch(`/api/complaints/${complaint.id}/cancel`, {
                userId: lineProfile.userId,
            });
            toast.success("ยกเลิกเรื่องร้องเรียนสำเร็จ");
            setShowCancelDialog(false);
            // reload ข้อมูล complaint
            fetchComplaint(complaintId);
            // หรือจะ redirect ไปหน้าอื่น
            // router.push("/complaints/mine")
        } catch (err) {
            toast.error("เกิดข้อผิดพลาดในการยกเลิก");
        } finally {
            setCancelLoading(false);
        }
    };

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded border border-red-200">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!complaint) return <ComplaintDetailSkeleton />;

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <ComplaintInfo complaint={complaint} />
            <div>
                <Label className="text-sm font-semibold mb-2">ตำแหน่งที่ตั้ง</Label>
                {complaint.location ? (
                    <a
                        href={`https://www.google.com/maps?q=${encodeURIComponent(complaint.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MiniMapPreview location={complaint.location} />
                    </a>
                ) : (
                    <p className="text-sm text-muted-foreground">ไม่มีพิกัดที่ตั้ง</p>
                )}
            </div>
            <ComplaintImages
                imageBefore={complaint.imageBefore ? complaint.imageBefore.split(",").map(u => u.trim()) : []}
                imageAfter={complaint.imageAfter ? complaint.imageAfter.split(",").map(u => u.trim()) : []}
            />

            {session?.user?.role && (
                <div className="flex justify-end gap-2">
                    <Link href="/admin/complaints/manage">
                        <Button className="cursor-pointer" variant="default" >ย้อนกลับ</Button>
                    </Link>
                </div>
            )}

            {showCancelButton && (
                <>
                    <Button
                        variant="destructive"
                        onClick={() => setShowCancelDialog(true)}
                        className="mt-4"
                        disabled={cancelLoading}
                    >
                        {cancelLoading ? "กำลังยกเลิก..." : "ขอยกเลิกเรื่องร้องเรียน"}
                    </Button>
                    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                        <DialogContent>
                            <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
                            <DialogDescription>
                                คุณต้องการยกเลิกเรื่องร้องเรียนนี้ใช่หรือไม่?<br />
                                หลังจากยกเลิกจะไม่สามารถแก้ไขหรือดำเนินการต่อได้อีก
                            </DialogDescription>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>ยกเลิก</Button>
                                <Button variant="destructive" onClick={handleCancelComplaint} disabled={cancelLoading}>
                                    {cancelLoading ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
};