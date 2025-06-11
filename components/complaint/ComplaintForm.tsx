"use client";

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import DropzoneUploader from "@/components/DropzoneUploader";
import ImageCropperModal from "@/components/ImageCropperModal";
import ImageGalleryModal from "@/components/ImageGalleryModal";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });
const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });

export default function ComplaintCreatePage() {
  const router = useRouter();
  const phoneRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    description: "",
    imageBefore: "",
    location: "",
  });
  const [errors, setErrors] = useState<{ phone?: string; description?: string; imageBefore?: string }>({});
  const [imageFiles, setImageFiles] = useState<{ imageBefore: File[] }>({ imageBefore: [] });
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [cropImage, setCropImage] = useState<File | null>(null);
  const [onCropDone, setOnCropDone] = useState<((f: File) => void) | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imageBeforeUrls, setImageBeforeUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [showGallery, setShowGallery] = useState(false);
  const [lineProfile, setLineProfile] = useState<{ userId: string; displayName: string } | null>(null);

  useEffect(() => {
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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((p) => ({ ...p, location: `${latitude},${longitude}` }));
      });
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value ?? "" }));
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทร";
    if (!formData.description.trim()) newErrors.description = "กรุณากรอกรายละเอียด";
    if (imageBeforeUrls.length === 0 || imageFiles.imageBefore.length === 0) newErrors.imageBefore = "กรุณาแนบภาพก่อนอย่างน้อย 1 รูป";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      toast.error(Object.values(newErrors)[0]);
      if (firstField === "phone" && phoneRef.current) phoneRef.current.focus();
      if (firstField === "description" && descriptionRef.current) descriptionRef.current.focus();
      if (firstField === "imageBefore" && uploaderRef.current) uploaderRef.current.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    return true;
  };


  const handleSave = async () => {
    if (!lineProfile) {
      toast.error("ไม่พบข้อมูลผู้ใช้ LINE");
      return;
    }

    if (!validateForm()) return;

    try {
      const form = new FormData();
      const dataToSubmit = {
        ...formData,
        imageBefore: imageBeforeUrls.join(","),
      };

      Object.entries(dataToSubmit).forEach(([key, value]) => {
        form.append(key, value);
      });

      form.append("lineUserId", lineProfile.userId);
      form.append("lineDisplayName", lineProfile.displayName);
      imageFiles.imageBefore.forEach((file) => form.append("imageBeforeFiles", file));

      setLoading(true);

      const res = await api.post(`/complaints`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            const percent = Math.round((e.loaded * 100) / e.total);
            setUploadProgress((p) => ({ ...p, total: percent }));
          }
        },
      });
      const complaintId = res.data.id;
      await api.put(`/webhook/line/${complaintId}/notify`);
      toast.success("สร้างรายการเรียบร้อย");
      router.push("/");
    } catch {
      toast.error("สร้างรายการล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">สร้างรายการร้องเรียน</h1>

      <div className="grid w-full items-center gap-3">
        <Label htmlFor="displayName">ผู้แจ้ง</Label>
        <Input id="displayName" name="displayName" value={lineProfile?.displayName ?? ""} readOnly disabled />
      </div>

      <div className="grid w-full items-center gap-3">
        <Label htmlFor="phone">เบอร์โทร</Label>
        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="เบอร์โทร" className={errors.phone ? "border-red-500" : ""} ref={phoneRef}/>
        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
      </div>

      <div className="grid w-full items-center gap-3">
        <Label htmlFor="description">รายละเอียด</Label>
        <Textarea id="description" name="description" value={formData.description || ""} onChange={handleChange} rows={3} placeholder="รายละเอียด" className={errors.description ? "border-red-500" : ""} ref={descriptionRef}/>
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>

      <div ref={uploaderRef}>
        <DropzoneUploader
          field="imageBefore"
          label="ภาพก่อน"
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

      <div className="space-y-2">
        <Label htmlFor="location">ระบุตำแหน่งจาก GPS</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input id="location" name="location" value={formData.location || ""} onChange={handleChange} className="flex-1" />
          <Button
            type="button"
            className="cursor-pointer"
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
          {formData.location && (
            <MapPicker location={formData.location} onChange={(loc) => setFormData((p) => ({ ...p, location: loc }))} />
          )}
        </div>
        {formData.location && <MiniMapPreview location={formData.location} />}
      </div>

      {uploadProgress.total !== undefined && (
        <div>
          <p className="text-sm text-muted-foreground">กำลังอัปโหลด: {uploadProgress.total}%</p>
          <Progress value={uploadProgress.total} className="h-2" />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={loading} className="px-6 cursor-pointer">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "บันทึก"}
        </Button>
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