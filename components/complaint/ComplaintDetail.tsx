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
import dayjs from "dayjs";
import { toast } from "sonner";

const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });

export const ComplaintDetail = ({ complaintId }: { complaintId: string }) => {
    const { data: session } = useSession();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lineProfile, setLineProfile] = useState<{ userId: string; displayName: string } | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showReopenDialog, setShowReopenDialog] = useState(false);
    const [reopenLoading, setReopenLoading] = useState(false);
    const [reopenReason, setReopenReason] = useState("");


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

    const showReopenButton =
        complaint &&
        complaint.status === "DONE" &&
        complaint.source === "LINE" &&
        lineProfile?.userId === complaint.lineUserId &&
        dayjs().diff(dayjs(complaint.updatedAt || complaint.createdAt), "day") < 3;

    const handleCancelComplaint = async () => {
        if (!complaint || !lineProfile) return;
        setCancelLoading(true);
        try {
            await axios.patch(`/api/complaints/${complaint.id}/cancel`, {
                userId: lineProfile.userId,
            });
            toast.success("ยกเลิกเรื่องร้องเรียนสำเร็จ");
            setShowCancelDialog(false);
            fetchComplaint(complaintId);
        } catch (err) {
            toast.error("เกิดข้อผิดพลาดในการยกเลิก");
        } finally {
            setCancelLoading(false);
        }
    };

    const handleReopenComplaint = async () => {
        if (!complaint || !lineProfile) return;
        setReopenLoading(true);
        try {
            await axios.patch(`/api/complaints/${complaint.id}/reopen`, {
                userId: lineProfile.userId,
                reason: reopenReason
            });
            toast.success("ส่งคำขอแก้ไขสำเร็จ");
            setShowReopenDialog(false);
            fetchComplaint(complaintId); // รีเฟรชข้อมูล
        } catch (err) {
            toast.error("เกิดข้อผิดพลาดในการส่งคำขอแก้ไข");
        } finally {
            setReopenLoading(false);
            setReopenReason("");
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
                <div className="flex justify-end gap-2">
                    <Button
                        variant="destructive"
                        onClick={() => setShowCancelDialog(true)}
                        className="mt-4"
                        disabled={cancelLoading}
                    >
                        {cancelLoading ? "กำลังยกเลิก..." : "ขอยกเลิก"}
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
                </div>
            )}

            {showReopenButton && (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setShowReopenDialog(true)}
                        className="mt-4"
                        disabled={reopenLoading}
                    >
                        {reopenLoading ? "กำลังส่ง..." : "แจ้งขอแก้ไข"}
                    </Button>
                    <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
                        <DialogContent>
                            <DialogTitle>แจ้งขอแก้ไขงาน</DialogTitle>
                            <DialogDescription>
                                <div>
                                    คุณต้องการแจ้งให้เจ้าหน้าที่กลับไปแก้ไขงานนี้ใช่หรือไม่? <br />
                                    (ร้องขอได้ภายใน 3 วันหลังปิดงาน)
                                </div>
                                <textarea
                                    placeholder="โปรดระบุเหตุผล (ถ้ามี)"
                                    value={reopenReason}
                                    onChange={(e) => setReopenReason(e.target.value)}
                                    className="w-full mt-2 p-2 border rounded"
                                    rows={3}
                                />
                            </DialogDescription>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setShowReopenDialog(false)}>ยกเลิก</Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReopenComplaint}
                                    disabled={reopenLoading}
                                >
                                    {reopenLoading ? "กำลังส่ง..." : "ยืนยันแจ้งแก้ไข"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
};