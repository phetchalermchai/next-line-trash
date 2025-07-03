import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import DropzoneUploader from "@/components/DropzoneUploader";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import ImageCropperModal from "@/components/ImageCropperModal";
import { toast } from "sonner";
import type { Complaint } from "@/types/complaint";
import { useMediaQuery } from "@/lib/use-media-query";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });
const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });

type EditComplaintDrawerProps = {
    complaint: Complaint | null;
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<Complaint>) => void;
};

export default function EditComplaintDrawer({ complaint, open, onClose, onSave }: EditComplaintDrawerProps) {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [formData, setFormData] = useState({
        reporterName: complaint?.reporterName || "",
        receivedBy: complaint?.receivedBy || "",
        phone: complaint?.phone || "",
        source: (complaint?.source ?? "") as Complaint["source"],
        description: complaint?.description || "",
        message: complaint?.message || "",
        status: (complaint?.status ?? "PENDING") as Complaint["status"],
        location: complaint?.location || "",
    });

    const [imageFiles, setImageFiles] = useState<{ imageBefore: File[]; imageAfter: File[] }>({ imageBefore: [], imageAfter: [] });
    const [imageBeforeUrls, setImageBeforeUrls] = useState<string[]>([]);
    const [imageAfterUrls, setImageAfterUrls] = useState<string[]>([]);
    const [cropImage, setCropImage] = useState<File | null>(null);
    const [onCropDone, setOnCropDone] = useState<((file: File) => void) | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
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
        onSave({
            ...formData,
            imageBefore: imageBeforeUrls.join(","),
            imageAfter: imageAfterUrls.join(","),
            imageBeforeFiles: imageFiles.imageBefore,
            imageAfterFiles: imageFiles.imageAfter,
        } as Partial<Record<string, any>>);
        onClose();
    };

    useEffect(() => {
        if (complaint) {
            const before = complaint.imageBefore ? complaint.imageBefore.split(",").map(u => u.trim()) : [];
            const after = complaint.imageAfter ? complaint.imageAfter.split(",").map(u => u.trim()) : [];

            setImageBeforeUrls(before);
            setImageAfterUrls(after);
        }
    }, [complaint]);

    return (
        <Drawer open={open} onOpenChange={onClose} direction={isMobile ? "bottom" : "right"}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>แก้ไขเรื่องร้องเรียน</DrawerTitle>
                </DrawerHeader>

                <div className="px-4 pt-2 pb-4 space-y-4 text-sm overflow-y-auto max-h-screen">
                    <div className="flex flex-col gap-2" >
                        <Label>ชื่อผู้ร้องเรียน</Label>
                        <Input name="reporterName" value={formData.reporterName as string} onChange={handleChange} placeholder="ชื่อผู้ร้องเรียน" />
                    </div>

                    <div className="flex flex-col gap-2" >
                        <Label>รับเรื่องโดย</Label>
                        <Input name="receivedBy" value={formData.receivedBy} onChange={handleChange} placeholder="เจ้าหน้าที่รับเรื่อง" />
                    </div>

                    <div className="flex flex-col gap-2" >
                        <Label>เบอร์โทร</Label>
                        <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="เบอร์โทร" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>ช่องทาง</Label>
                        <Select value={formData.source} onValueChange={(v) => setFormData((prev) => ({ ...prev, source: v as Complaint["source"] }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกช่องทาง" />
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

                    <div className="flex flex-col gap-2" >
                        <Label>รายละเอียด</Label>
                        <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="รายละเอียดเรื่องร้องเรียน" />
                    </div>

                    <div className="flex flex-col gap-2" >
                        <Label>สรุปผล</Label>
                        <Textarea name="message" value={formData.message} onChange={handleChange} placeholder="ข้อความตอบกลับ / สรุปผล" />
                    </div>

                    <div className="flex flex-col gap-2" >
                        <Label>สถานะ</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v as "PENDING" | "DONE" }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกสถานะ" />
                            </SelectTrigger>
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

                    <div className="space-y-3">
                        <Label htmlFor="location">ระบุตำแหน่งจาก GPS</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input id="location" name="location" value={formData.location || ""} onChange={handleChange} className="flex-1" />
                            <Button
                                type="button"
                                onClick={() => {
                                    if (!navigator.geolocation) return;
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            const { latitude, longitude } = pos.coords;
                                            setFormData((p) => ({ ...p, location: `${latitude},${longitude}` }));
                                        },
                                        (err) => {
                                            toast.error("ไม่สามารถดึงตำแหน่งปัจจุบันได้");
                                            console.error("GPS error:", err);
                                        }
                                    );
                                }}
                            >
                                ตำแหน่งปัจจุบัน
                            </Button>
                        </div>
                        {formData.location && (
                            <>
                                <MapPicker location={formData.location} onChange={(loc) => setFormData((p) => ({ ...p, location: loc }))} />
                                <MiniMapPreview location={formData.location} />
                            </>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 p-4">
                    <Button className="cursor-pointer" variant="outline" onClick={onClose}>ยกเลิก</Button>
                    <Button className="cursor-pointer" onClick={handleSubmit}>บันทึก</Button>
                </div>

                {cropImage && onCropDone && (
                    <ImageCropperModal
                        file={cropImage}
                        onClose={() => setCropImage(null)}
                        onDone={(file) => {
                            onCropDone(file);
                            setCropImage(null);
                        }}
                    />
                )}

                {showGallery && (
                    <ImageGalleryModal images={previewImages} initialIndex={previewIndex} onClose={() => setShowGallery(false)} />
                )}
            </DrawerContent>
        </Drawer>
    );
}