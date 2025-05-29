"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (image) formData.append("image", image);

      await axios.post(
        `https://main-application-production-92c0.up.railway.app/webhook/line/complaints/${id}/image-after`,
        formData
      );

      alert("แจ้งผลการดำเนินงานเรียบร้อยแล้ว ✅");
      router.push(`/admin/complaints/${id}`);
    } catch (err) {
      console.error(err);
      alert("แจ้งผลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">📮 แจ้งผลการดำเนินงาน</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-medium">แนบรูปภาพหลังดำเนินการ (ถ้ามี):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="file-input file-input-bordered w-full mt-1"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting ? "กำลังส่ง..." : "ส่งผลการดำเนินงาน"}
        </button>
      </form>
    </div>
  );
}