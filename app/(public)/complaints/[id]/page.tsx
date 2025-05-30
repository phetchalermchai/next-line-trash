"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

interface Complaint {
  id: string;
  description: string;
  phone?: string;
  lineDisplayName?: string;
  imageBefore: string;
  imageAfter?: string;
  location?: string;
  status: string;
  createdAt: string;
}

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_COMPLAINTS}/complaints/${id}`)
      .then((res) => setComplaint(res.data))
      .catch(() => alert("ไม่พบข้อมูลเรื่องร้องเรียนนี้"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4 text-center">กำลังโหลด...</div>;
  if (!complaint) return <div className="p-4 text-center text-red-600">ไม่พบข้อมูล</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">📄 รายละเอียดเรื่องร้องเรียน</h1>
      <p><strong>หมายเลขอ้างอิง:</strong> {complaint.id}</p>
      <p><strong>ผู้แจ้ง:</strong> {complaint.lineDisplayName || "ไม่ระบุ"}</p>
      <p><strong>เบอร์ติดต่อ:</strong> {complaint.phone || "ไม่ระบุ"}</p>
      <p><strong>รายละเอียด:</strong> {complaint.description}</p>
      <p>
        <strong>พิกัด:</strong>{" "}
        {complaint.location ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${complaint.location}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            📍 เปิดใน Google Maps
          </a>
        ) : (
          "ไม่ระบุ"
        )}
      </p>
      <p>
        <strong>สถานะ:</strong> {complaint.status === "DONE" ? "✅ ดำเนินการเสร็จแล้ว" : "⏳ รอดำเนินการ"}
      </p>

      <div>
        <strong>รูปภาพก่อนดำเนินการ:</strong>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {complaint.imageBefore.split(",").map((url, idx) => (
            <img key={idx} src={url} alt="before" className="rounded shadow" />
          ))}
        </div>
      </div>

      {complaint.imageAfter && (
        <div>
          <strong>รูปภาพหลังดำเนินการ:</strong>
          <div className="mt-2">
            <img src={complaint.imageAfter} alt="after" className="rounded shadow" />
          </div>
        </div>
      )}
    </div>
  );
}