"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function AdminComplaintPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (!session?.user) {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        router.push("/");
        return;
      }
      setSessionChecked(true);
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (!id || !sessionChecked) return;
    axios
      .get(`https://main-application-production-92c0.up.railway.app/complaints/${id}`)
      .then((res) => setComplaint(res.data))
      .catch(() => alert("ไม่พบข้อมูลเรื่องร้องเรียนนี้"))
      .finally(() => setLoading(false));
  }, [id, sessionChecked]);

  if (loading || !sessionChecked) return <div className="p-4">กำลังโหลด...</div>;
  if (!complaint) return <div className="p-4 text-red-600">ไม่พบข้อมูล</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">🔧 รายละเอียดเรื่องร้องเรียน (Admin)</h1>
      <p><strong>ID:</strong> {complaint.id}</p>
      <p><strong>ผู้แจ้ง:</strong> {complaint.lineDisplayName || "ไม่ระบุ"}</p>
      <p><strong>เบอร์:</strong> {complaint.phone || "ไม่ระบุ"}</p>
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
      <p><strong>สถานะ:</strong> {complaint.status === 'DONE' ? '✅ ดำเนินการแล้ว' : '⏳ รอดำเนินการ'}</p>
      <div>
        <strong>รูปก่อน:</strong>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {complaint.imageBefore.split(",").map((url, idx) => (
            <img key={idx} src={url} alt="before" className="rounded shadow" />
          ))}
        </div>
      </div>
      {complaint.imageAfter && (
        <div>
          <strong>รูปหลัง:</strong>
          <div className="mt-2">
            <img src={complaint.imageAfter} alt="after" className="rounded shadow" />
          </div>
        </div>
      )}
    </div>
  );
}