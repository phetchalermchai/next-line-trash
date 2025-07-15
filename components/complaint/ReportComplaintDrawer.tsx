"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Complaint } from "@/types/complaint";
import { formatThaiDatetime } from "@/utils/date";
import { Label } from "../ui/label";
import { toast } from "sonner";
import axios from "axios";
import dynamic from "next/dynamic";
import DropzoneUploader from "../DropzoneUploader";
import ImageGalleryModal from "../ImageGalleryModal";
import ImageCropperModal from "../ImageCropperModal";

const MiniMapPreview = dynamic(() => import("../MiniMapPreview"), { ssr: false });


interface ReportComplaintDrawerProps {
    complaint: Complaint;
    open: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

export default function ReportComplaintDrawer({ complaint, open, onClose, onRefresh }: ReportComplaintDrawerProps) {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [message, setMessage] = useState("");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [cropImage, setCropImage] = useState<File | null>(null);
    const [onCropDone, setOnCropDone] = useState<any>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    const validateForm = () => {
        if (!message.trim()) {
            toast.error("กรุณากรอกสรุปผล");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const form = new FormData();
            form.append("message", message);
            imageFiles.forEach((file) => form.append("imageAfterFiles", file));

            await axios.patch(`/api/complaints/${complaint.id}/report`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("บันทึกผลสำเร็จ");
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            console.error("[Report Submit] Error:", error);
            toast.error("เกิดข้อผิดพลาดในการบันทึกผล");
        }
    };

    return (
        <Drawer open={open} onOpenChange={onClose} direction={isMobile ? "bottom" : "right"}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>รายงานผลเรื่องร้องเรียน</DrawerTitle>
                    <DrawerDescription>กรุณากรอกผลการดำเนินการและแนบภาพหลัง</DrawerDescription>
                </DrawerHeader>

                <div className="px-4 py-2 pb-4 space-y-4 text-sm overflow-y-auto max-h-screen">
                    <div><strong>รหัสอ้างอิง:</strong> #{complaint.id.slice(-6).toUpperCase() || "-"}</div>
                    <div><strong>วันที่แจ้ง:</strong> {formatThaiDatetime(complaint.createdAt) || "-"}</div>
                    <div><strong>วันที่อัปเดต:</strong> {formatThaiDatetime(complaint.updatedAt) || "-"}</div>
                    {complaint.notifiedAt && (
                        <div><strong>วันที่แจ้งผล:</strong> {formatThaiDatetime(complaint.notifiedAt) || "-"}</div>
                    )}
                    <div><strong>ชื่อผู้แจ้ง:</strong> {complaint.reporterName || "-"}</div>
                    {complaint.receivedBy && (
                        <div><strong>รับเรื่องโดย:</strong> {complaint.receivedBy || "-"}</div>
                    )}
                    <div><strong>เบอร์โทร:</strong> {complaint.phone || "-"}</div>
                    <div><strong>รายละเอียด:</strong> {complaint.description || "-"}</div>
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

                    <div>
                        <label className="block text-sm font-medium mb-1">สรุปผล</label>
                        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="ข้อความตอบกลับ / สรุปผล" />
                    </div>

                    <DropzoneUploader
                        field="imageAfter"
                        label="ภาพหลังดำเนินการ"
                        files={imageFiles}
                        previewUrls={previewUrls}
                        setPreviewUrls={setPreviewUrls}
                        setFiles={setImageFiles}
                        onCrop={(file, done) => {
                            setCropImage(file);
                            setOnCropDone(() => done);
                        }}
                        onPreview={(urls, idx) => {
                            setPreviewImages(urls);
                            setPreviewIndex(idx);
                            setShowGallery(true);
                        }}
                    />

                    {cropImage && onCropDone && (
                        <ImageCropperModal
                            file={cropImage}
                            onClose={() => setCropImage(null)}
                            onDone={(croppedFile) => {
                                onCropDone(croppedFile);
                                setCropImage(null);
                            }}
                        />
                    )}

                    {showGallery && (
                        <ImageGalleryModal
                            images={previewImages}
                            initialIndex={previewIndex}
                            onClose={() => setShowGallery(false)}
                        />
                    )}

                    <div className="flex justify-end gap-2">
                        <Button className="cursor-pointer" variant="outline" onClick={onClose}>ยกเลิก</Button>
                        <Button className="cursor-pointer" variant="default" onClick={handleSubmit}>บันทึก</Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}