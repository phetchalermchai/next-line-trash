"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/axios";
import DropzoneUploader from "@/components/DropzoneUploader";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import ImageCropperModal from "@/components/ImageCropperModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface Complaint {
  id: string;
  message?: string;
  imageAfter?: string;
  status: "PENDING" | "DONE";
  description: string;
  location?: string;
  lineDisplayName?: string;
  createdAt: string;
}

export default function ComplaintReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [message, setMessage] = useState("");
  const [imageAfterUrls, setImageAfterUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<{ imageAfter: File[] }>({ imageAfter: [] });
  const [loading, setLoading] = useState(false);
  const [cropImage, setCropImage] = useState<File | null>(null);
  const [onCropDone, setOnCropDone] = useState<any>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const res = await api.get(`/complaints/${id}`);
        setComplaint(res.data);
        setMessage(res.data.message || "");
        if (res.data.imageAfter) setImageAfterUrls([res.data.imageAfter]);
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
        router.push("/admin/complaints");
      }
    };
    if (id) fetchComplaint();
  }, [id]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("กรุณากรอกข้อความสรุปผล");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("message", message);

      imageFiles.imageAfter.forEach((file) => {
        form.append("images", file);
      });

      await api.post(`/webhook/line/complaints/${id}/image-after`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("บันทึกรายงานผลเรียบร้อยแล้ว");
      router.push("/admin/complaints");
    } catch (err) {
      console.error("Submit error", err);
      toast.error("ไม่สามารถบันทึกรายงานผลได้");
    } finally {
      setLoading(false);
    }
  };

  if (!complaint) return null;
  if (complaint.status === "DONE") {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">เรื่องนี้ได้รับการดำเนินการเสร็จแล้ว</h1>
        <p className="text-muted-foreground">ไม่สามารถรายงานผลซ้ำได้</p>
      </div>
    );
  }

  const shortId = complaint.id.slice(-4).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">รายงานผลการดำเนินงาน #{shortId}</h1>

      <div className="bg-muted p-4 rounded-md text-sm space-y-1 border">
        <p><strong>รายละเอียดเรื่องร้องเรียน:</strong> {complaint.description}</p>
        {complaint.location && (
          <p>
            <strong>สถานที่:</strong>{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(complaint.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Google Maps
                </a>
              </TooltipTrigger>
              <TooltipContent>เปิดดูสถานที่บน Google Maps</TooltipContent>
            </Tooltip>
          </p>
        )}
        {complaint.lineDisplayName && <p><strong>ผู้แจ้ง:</strong> {complaint.lineDisplayName}</p>}
        <p><strong>วันที่แจ้ง:</strong> {format(new Date(complaint.createdAt), "dd/MM/") + (parseInt(format(new Date(complaint.createdAt), "yyyy")) + 543)}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">สรุปผล</label>
        <Textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div>
        <DropzoneUploader
          field="imageAfter"
          label="ภาพหลังดำเนินการ"
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
      </div>

      <div className="pt-4">
        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
          {loading ? "กำลังบันทึก..." : "บันทึกรายงานผล"}
        </Button>
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
    </div>
  );
}