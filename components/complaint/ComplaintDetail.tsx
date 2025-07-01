"use client";

import { useEffect, useState } from "react";
import { Complaint } from "@/types/complaint";
import { Skeleton } from "@/components/ui/skeleton";
import { ComplaintInfo } from "@/components/complaint/ComplaintInfo";
import dynamic from "next/dynamic";
import { ComplaintImages } from "./ComplaintImages";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import axios from "axios";

const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });

export const ComplaintDetail = ({ complaintId }: { complaintId: string }) => {
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    if (!complaint) return <Skeleton className="h-64 w-full" />;

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
        </div>
    );
};