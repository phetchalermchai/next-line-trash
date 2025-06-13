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
        id: "",
        reporterName: "",
        receivedBy: "",
        phone: "",
        description: "",
        message: "",
        status: "PENDING",
        source: "",
        imageBefore: "",
        imageAfter: "",
        location: "",
        notifiedAt: "",
        createdAt: "",
        updatedAt: "",
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

    const thaiTime = ((date: string) => {
        return new Date(date).toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        })
    })

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">แก้ไขรายการร้องเรียน #{formData.id.slice(-6).toUpperCase()}</h1>
            <div className="bg-muted p-4 rounded-md text-sm space-y-1 border">
                <p><strong>วันที่แจ้ง:</strong> {`${thaiTime(formData.createdAt)} น.`}</p>
                <p><strong>อัปเดตล่าสุด:</strong> {`${thaiTime(formData.updatedAt)} น.`}</p>
                {formData.notifiedAt && (
                    <p><strong>แจ้งเตือนล่าสุด:</strong> {`${thaiTime(formData.notifiedAt)} น.`}</p>
                )}
            </div>
            <div className="grid w-full items-center gap-3">
                <Label htmlFor="reporterName">ผู้แจ้ง</Label>
                <Input id="reporterName" name="reporterName" value={formData.reporterName} onChange={handleChange} placeholder="ผู้แจ้ง" />
            </div>
            {formData.receivedBy && (
                <div className="grid w-full items-center gap-3">
                    <Label htmlFor="receivedBy">ผู้รับแจ้ง</Label>
                    <Input id="receivedBy" name="receivedBy" value={formData.receivedBy} onChange={handleChange} placeholder="ผู้รับแจ้ง" />
                </div>
            )}
            <div className="grid w-full items-center gap-3">
                <Label htmlFor="phone">เบอร์โทร</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="เบอร์โทร" />
            </div>
            <div className="grid w-full items-center gap-3">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea id="description" name="description" value={formData.description || ""} onChange={handleChange} rows={3} placeholder="รายละเอียด" />
            </div>
            {formData.source && (
                <div className="grid w-full items-center gap-3">
                    <Label htmlFor="source">ช่องทาง</Label>
                    <Select value={formData.source} onValueChange={(val) => setFormData((prev) => ({ ...prev, source: val }))}>
                        <SelectTrigger id="source"><SelectValue placeholder="เลือกช่องทาง" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LINE">LINE</SelectItem>
                            <SelectItem value="FACEBOOK">FACEBOOK</SelectItem>
                            <SelectItem value="PHONE">PHONE</SelectItem>
                            <SelectItem value="COUNTER">COUNTER</SelectItem>
                            <SelectItem value="OTHER">OTHER</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
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
