"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

export default function AdminReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [summary, setSummary] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("message", summary);
      if (image) formData.append("images", image);

      await axios.post(
        `https://main-application-production-92c0.up.railway.app/webhook/line/complaints/${id}/image-after`,
        formData
      );

      alert("ส่งผลเรียบร้อยแล้ว ✅");
      router.push(`/admin/complaints/${id}`);
    } catch (err) {
      alert("แจ้งผลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">📮 แจ้งผลการดำเนินงาน</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-medium">ข้อความสรุปผล *</label>
          <textarea
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="textarea textarea-bordered w-full mt-1"
            placeholder="เช่น เก็บขยะเสร็จแล้ว"
          />
        </div>

        <div>
          <label className="font-medium">แนบรูปภาพ (ถ้ามี)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input file-input-bordered w-full mt-1"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="rounded shadow mt-2"
            />
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "กำลังส่ง..." : "ส่งผลการดำเนินงาน"}
          </button>
        </div>
      </form>
    </div>
  );
}
