"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ComplaintForm() {
  const [lineProfile, setLineProfile] = useState<{ userId: string; displayName: string } | null>(null);
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        setLocation(`${latitude},${longitude}`);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineProfile) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append("lineUserId", lineProfile.userId);
    formData.append("lineDisplayName", lineProfile.displayName);
    formData.append("description", description);
    formData.append("phone", phone);
    if (location) formData.append("location", location);
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await axios.post(`https://main-application-production-92c0.up.railway.app/complaints`, formData);
      const complaintId = res.data.id;
      await axios.put(`https://main-application-production-92c0.up.railway.app/webhook/line/${complaintId}/notify`);
      alert("ส่งเรื่องเรียบร้อยแล้ว! ขอบคุณที่แจ้งครับ 🙏");
      setDescription("");
      setPhone("");
      setImages([]);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการส่งเรื่อง");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">แจ้งเรื่องร้องเรียน</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input input-bordered w-full"
          placeholder="เบอร์ติดต่อ (เช่น 0812345678)"
          required
        />
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea textarea-bordered w-full"
          placeholder="กรอกรายละเอียดปัญหา"
        />
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImages(Array.from(e.target.files || []))}
          className="file-input file-input-bordered w-full"
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting ? "กำลังส่ง..." : "ส่งเรื่องร้องเรียน"}
        </button>
      </form>
    </div>
  );
}
