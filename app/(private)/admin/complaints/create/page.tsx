"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import DropzoneUploader from "@/components/DropzoneUploader";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import ImageCropperModal from "@/components/ImageCropperModal";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import axios from "axios";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function AdminComplaintCreatePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        receivedBy: "",
        source: "PHONE",
        reporterName: "",
        phone: "",
        description: "",
        location: "13.8619461,100.5131675",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [imageFiles, setImageFiles] = useState<{ imageBefore: File[] }>({ imageBefore: [] });
    const [imageBeforeUrls, setImageBeforeUrls] = useState<string[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [showGallery, setShowGallery] = useState(false);
    const [cropImage, setCropImage] = useState<File | null>(null);
    const [onCropDone, setOnCropDone] = useState<((f: File) => void) | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors: typeof errors = {};
        if (!formData.receivedBy.trim()) newErrors.receivedBy = "กรุณาระบุชื่อผู้รับแจ้ง";
        if (!formData.reporterName.trim()) newErrors.reporterName = "กรุณาระบุชื่อผู้แจ้ง";
        if (!formData.phone.trim()) newErrors.phone = "กรุณาระบุเบอร์โทร";
        if (!formData.description.trim()) newErrors.description = "กรุณาระบุรายละเอียด";
        if (!formData.location.trim()) newErrors.location = "กรุณาระบุตำแหน่ง";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error(Object.values(newErrors)[0]);
            return false;
        }
        return true;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            setLoading(true);
            const form = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value) form.append(key, value);
            });
            imageFiles.imageBefore.forEach((file) => form.append("imageBeforeFiles", file));

            const res = await axios.post(`/api/complaints/admin`, form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (e) => {
                    if (e.total) {
                        const percent = Math.round((e.loaded * 100) / e.total);
                        setUploadProgress((p) => ({ ...p, total: percent }));
                    }
                },
            });
            const complaintId = res.data.id;
            toast.success("สร้างรายการเรียบร้อยแล้ว");
            router.push(`/complaints/${complaintId}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setLoading(false);
        }
    };

    function parseLocation(str: string | null | undefined): { lat: number, lng: number } | null {
        if (!str) return null;
        const [lat, lng] = str.split(",").map(Number);
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    }

    function locationToString(loc: { lat: number, lng: number } | null | undefined): string {
        if (!loc) return "";
        return `${loc.lat},${loc.lng}`;
    }

    return (
        <div className="w-full flex justify-center">
            <div className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                <div className="space-y-3">
                    <Label htmlFor="receivedBy">ผู้รับแจ้ง</Label>
                    <Input id="receivedBy" name="receivedBy" value={formData.receivedBy} placeholder="ชื่อผู้รับแจ้ง" onChange={handleChange} className={errors.receivedBy ? "border-red-500" : ""} />
                    {errors.receivedBy && <p className="text-sm text-red-500">{errors.receivedBy}</p>}
                </div>
                <div className="space-y-3">
                    <Label htmlFor="reporterName">ผู้แจ้ง</Label>
                    <Input id="reporterName" name="reporterName" value={formData.reporterName} placeholder="ชื่อผู้แจ้ง" onChange={handleChange} className={errors.reporterName ? "border-red-500" : ""} />
                    {errors.reporterName && <p className="text-sm text-red-500">{errors.reporterName}</p>}
                </div>
                <div className="space-y-3">
                    <Label htmlFor="phone">เบอร์โทร</Label>
                    <Input id="phone" name="phone" value={formData.phone} placeholder="เบอร์โทร" onChange={handleChange} className={errors.phone ? "border-red-500" : ""} />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
                <div className="space-y-3">
                    <Label htmlFor="source">ช่องทาง</Label>
                    <Select value={formData.source} onValueChange={(val) => setFormData((prev) => ({ ...prev, source: val }))}>
                        <SelectTrigger id="source">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LINE">LINE</SelectItem>
                            <SelectItem value="FACEBOOK">FACEBOOK</SelectItem>
                            <SelectItem value="PHONE">PHONE</SelectItem>
                            <SelectItem value="COUNTER">COUNTER</SelectItem>
                            <SelectItem value="OTHER">OTHER</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-full space-y-3">
                    <Label htmlFor="description">รายละเอียด</Label>
                    <Textarea id="description" name="description" value={formData.description} placeholder="รายละเอียด" onChange={handleChange} rows={3} className={errors.description ? "border-red-500" : ""} />
                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>
                <div className="col-span-full">
                    <DropzoneUploader
                        field="imageBefore"
                        label="ภาพก่อน (ไม่บังคับ)"
                        files={imageFiles.imageBefore}
                        previewUrls={imageBeforeUrls}
                        setPreviewUrls={(urls) => setImageBeforeUrls(Array.from(new Set(urls)))}
                        setFiles={(files) => setImageFiles({ imageBefore: files })}
                        error={errors.imageBefore}
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
                </div>
                {showGallery && (
                    <ImageGalleryModal
                        images={previewImages}
                        initialIndex={previewIndex}
                        onClose={() => setShowGallery(false)}
                    />
                )}
                {cropImage && onCropDone && (
                    <ImageCropperModal
                        file={cropImage}
                        onClose={() => setCropImage(null)}
                        onDone={(cropped) => {
                            onCropDone(cropped);
                            setCropImage(null);
                        }}
                    />
                )}
                <div className="col-span-full space-y-3">
                    <Label htmlFor="location">ระบุตำแหน่งจาก GPS</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <MapPicker location={parseLocation(formData.location) || undefined} onChange={(loc) => setFormData((p) => ({ ...p, location: locationToString(loc) }))} />
                    </div>
                </div>
                {uploadProgress.total !== undefined && (
                    <div className="col-span-full">
                        <p className="text-sm text-muted-foreground">กำลังอัปโหลด: {uploadProgress.total}%</p>
                        <Progress value={uploadProgress.total} className="h-2" />
                    </div>
                )}
                <div className="col-span-full flex justify-end">
                    <Button className="cursor-pointer" onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} บันทึก
                    </Button>
                </div>
            </div>
        </div>
    );
}
