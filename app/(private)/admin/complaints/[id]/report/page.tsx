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
import { Complaint } from "@/types/complaint";

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

  const renderSourceBadge = (source: string) => {
    const colorMap: Record<string, string> = {
      LINE: "bg-green-100 text-green-700 border-green-300",
      FACEBOOK: "bg-blue-100 text-blue-700 border-blue-300",
      PHONE: "bg-yellow-100 text-yellow-800 border-yellow-300",
      COUNTER: "bg-pink-100 text-pink-700 border-pink-300",
      OTHER: "bg-gray-100 text-gray-800 border-gray-300",
    };

    const color = colorMap[source] ?? "bg-gray-100 text-gray-700 border-gray-300";

    return (
      <span className={`inline-block text-xs px-2 py-1 rounded border ${color}`}>
        {source}
      </span>
    );
  };

  const shortId = complaint.id.slice(-6).toUpperCase();

  const thaiTime = new Date(complaint.createdAt).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">รายงานผลการดำเนินงาน #{shortId}</h1>

      <div className="bg-muted p-4 rounded-md text-sm space-y-1 border">
        <p><strong>รายละเอียดเรื่องร้องเรียน:</strong> {complaint.description}</p>
        {complaint.location && (
          <p>
            <strong>ตำแหน่งที่ตั้ง:</strong>{" "}
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
        {complaint.reporterName && <p><strong>ผู้แจ้ง:</strong> {complaint.reporterName}</p>}
        <p><strong>วันที่แจ้ง:</strong> {`${thaiTime} น.`}</p>
        <p className="flex items-center gap-2">
          <strong>ช่องทาง:</strong> {renderSourceBadge(complaint.source)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">สรุปผล</label>
        <Textarea
          placeholder="สรุปผล"
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

      <div className="pt-4 flex justify-end gap-2">
        <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto cursor-pointer">
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