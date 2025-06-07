"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import DropzoneUploader from "@/components/DropzoneUploader";
import ImageCropperModal from "@/components/ImageCropperModal";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import { create } from "domain";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });
const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });


export default function ComplaintEditPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: "",
        phone: "",
        description: "",
        message: "",
        status: "PENDING",
        imageBefore: "",
        imageAfter: "",
        location: "",
        createdAt: "",
    });
    const [imageFiles, setImageFiles] = useState<{ imageBefore: File[]; imageAfter: File[] }>({ imageBefore: [], imageAfter: [] });
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [cropImage, setCropImage] = useState<File | null>(null);
    const [onCropDone, setOnCropDone] = useState<((f: File) => void) | null>(null);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [imageBeforeUrls, setImageBeforeUrls] = useState<string[]>([]);
    const [imageAfterUrls, setImageAfterUrls] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState<number>(0);
    const [showGallery, setShowGallery] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/complaints/${id}`);
                setFormData(res.data);
                setImageBeforeUrls(
                    res.data.imageBefore ? res.data.imageBefore.split(',').map((s: string) => s.trim()).filter(Boolean) : []
                );
                setImageAfterUrls(
                    res.data.imageAfter ? res.data.imageAfter.split(',').map((s: string) => s.trim()).filter(Boolean) : []
                );
            } catch {
                toast.error("โหลดข้อมูลล้มเหลว");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value ?? "" }));
    };

    const handleSave = async () => {
        if (!formData.phone?.trim()) {
            toast.error("กรุณากรอกเบอร์โทร");
            return;
        }

        if (!formData.description?.trim()) {
            toast.error("กรุณากรอกรายละเอียด");
            return;
        }

        if (!formData.status) {
            toast.error("กรุณาเลือกสถานะ");
            return;
        }
        try {
            const form = new FormData();

            // รวมรูปจาก previewUrls ที่เหลืออยู่กลับไปเป็น string
            const dataToSubmit = {
                ...formData,
                imageBefore: imageBeforeUrls.join(','),
                imageAfter: imageAfterUrls.join(','),
            };

            // เพิ่มข้อมูลทั้งหมดใน formData ลงใน FormData object
            Object.entries(dataToSubmit).forEach(([key, value]) => {
                form.append(key, value);
            });

            // เพิ่มไฟล์ที่อัปโหลดใหม่ลงใน FormData
            imageFiles.imageBefore.forEach((file) =>
                form.append("imageBeforeFiles", file)
            );
            imageFiles.imageAfter.forEach((file) =>
                form.append("imageAfterFiles", file)
            );

            // ส่ง PUT request
            await api.put(`/complaints/${id}`, form, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (e) => {
                    if (e.total) {
                        const percent = Math.round((e.loaded * 100) / e.total);
                        setUploadProgress((p) => ({ ...p, total: percent }));
                    }
                },
            });

            toast.success("บันทึกเรียบร้อย");
            router.push("/admin/complaints");
        } catch {
            toast.error("บันทึกล้มเหลว");
        }
    };

    const formatThaiDate = (date: Date) =>
        format(date, "dd/MM/") + (date.getFullYear() + 543);

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">แก้ไขรายการร้องเรียน</h1>
            <div className="mb-4 p-4 bg-gray-100 rounded-lg space-y-1">
                <p className="text-sm text-muted-foreground">
                    🆔 หมายเลขเรื่อง: <span className="font-semibold">#{formData.id.slice(-4)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                    📅 วันที่แจ้ง: <span className="font-semibold">
                        {formatThaiDate(new Date(formData.createdAt))}
                    </span>
                </p>
                <p className="text-sm text-muted-foreground">
                    📍 พิกัด:
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${formData.location}`}
                        className="text-blue-600 underline ml-1"
                        target="_blank"
                    >
                        เปิดใน Google Maps
                    </a>
                </p>
            </div>
            <div className="grid w-full items-center gap-3">
                <Label htmlFor="phone">เบอร์โทร</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="เบอร์โทร" />
            </div>
            <div className="grid w-full items-center gap-3">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea id="description" name="description" value={formData.description || ""} onChange={handleChange} rows={3} placeholder="รายละเอียด" />
            </div>
            <div className="grid w-full items-center gap-3">
                <Label htmlFor="message">สรุปผล</Label>
                <Textarea id="message" name="message" value={formData.message || ""} onChange={handleChange} rows={2} placeholder="สรุปผล" />
            </div>

            <div className="grid w-full items-center gap-3">
                <Label htmlFor="status">สถานะ</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}>
                    <SelectTrigger id="status"><SelectValue placeholder="เลือกสถานะ" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PENDING">รอดำเนินการ</SelectItem>
                        <SelectItem value="DONE">เสร็จสิ้น</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DropzoneUploader
                field="imageBefore"
                label="ภาพก่อน"
                files={imageFiles.imageBefore}
                previewUrls={imageBeforeUrls}
                setPreviewUrls={setImageBeforeUrls}
                setFiles={(files) => setImageFiles((prev) => ({ ...prev, imageBefore: files }))}
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
            <DropzoneUploader
                field="imageAfter"
                label="ภาพหลัง"
                files={imageFiles.imageAfter}
                previewUrls={imageAfterUrls}
                setPreviewUrls={setImageAfterUrls}
                setFiles={(files) => setImageFiles((prev) => ({ ...prev, imageAfter: files }))}
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

            {showGallery && (
                <ImageGalleryModal
                    images={previewImages}
                    initialIndex={previewIndex}
                    onClose={() => setShowGallery(false)}
                />
            )}

            <div className="space-y-2">
                <Label htmlFor="location">ระบุตำแหน่งจาก GPS</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input id="location" name="location" value={formData.location || ""} onChange={handleChange} className="flex-1" />
                    <Button type="button" className="cursor-pointer" onClick={() => {
                        if (!navigator.geolocation) return;
                        navigator.geolocation.getCurrentPosition((pos) => {
                            const { latitude, longitude } = pos.coords;
                            setFormData((p) => ({ ...p, location: `${latitude},${longitude}` }));
                        }, (err) => {
                            toast.error("ไม่สามารถดึงตำแหน่งปัจจุบันได้");
                            console.error("GPS error:", err);
                        });
                    }}>
                        ตำแหน่งปัจจุบัน
                    </Button>
                    {formData.location && (
                        <MapPicker location={formData.location} onChange={(loc) => setFormData((p) => ({ ...p, location: loc }))} />
                    )}
                </div>
                {formData.location && (
                    <MiniMapPreview location={formData.location} />
                )}
            </div>

            {uploadProgress.total !== undefined && (
                <div>
                    <p className="text-sm text-muted-foreground">กำลังอัปโหลด: {uploadProgress.total}%</p>
                    <Progress value={uploadProgress.total} className="h-2" />
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.back()} className="px-6 cursor-pointer">
                    ย้อนกลับ
                </Button>
                <Button onClick={handleSave} className="px-6 cursor-pointer">บันทึก</Button>
            </div>

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
        </div>
    );
}
