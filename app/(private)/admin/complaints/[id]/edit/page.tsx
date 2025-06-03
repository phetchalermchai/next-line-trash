"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import DropzoneUploader from "@/components/DropzoneUploader";
import ImageCropperModal from "@/components/ImageCropperModal";
import ImageGalleryModal from "@/components/ImageGalleryModal";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });
const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });


export default function ComplaintEditPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        phone: "",
        description: "",
        message: "",
        status: "PENDING",
        imageBefore: "",
        imageAfter: "",
        location: "",
    });
    const [imageFiles, setImageFiles] = useState<{ imageBefore: File[]; imageAfter: File[] }>({ imageBefore: [], imageAfter: [] });
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [cropImage, setCropImage] = useState<File | null>(null);
    const [onCropDone, setOnCropDone] = useState<((f: File) => void) | null>(null);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState<number>(0);
    const [showGallery, setShowGallery] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/complaints/${id}`);
                setFormData(res.data);
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
        try {
            const form = new FormData();
            Object.entries(formData).forEach(([k, v]) => form.append(k, v));
            imageFiles.imageBefore.forEach((f) => form.append("imageBeforeFiles", f));
            imageFiles.imageAfter.forEach((f) => form.append("imageAfterFiles", f));

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

            <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="เบอร์โทร" />
            <Textarea name="description" value={formData.description || ""} onChange={handleChange} rows={3} placeholder="รายละเอียด" />
            <Textarea name="message" value={formData.message || ""} onChange={handleChange} rows={2} placeholder="สรุปผล" />

            <Select value={formData.status} onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}>
                <SelectTrigger><SelectValue placeholder="เลือกสถานะ" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="PENDING">รอดำเนินการ</SelectItem>
                    <SelectItem value="DONE">เสร็จสิ้น</SelectItem>
                </SelectContent>
            </Select>

            <DropzoneUploader
                field="imageBefore"
                label="ภาพก่อน"
                files={imageFiles.imageBefore}
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
                <label className="text-sm font-medium">ระบุตำแหน่งจาก GPS</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input name="location" value={formData.location || ""} onChange={handleChange} className="flex-1" />
                    <Button type="button" onClick={() => {
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

            <div className="flex justify-end">
                <Button onClick={handleSave} className="px-6">บันทึก</Button>
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
