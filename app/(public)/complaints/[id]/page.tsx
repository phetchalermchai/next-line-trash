import { ComplaintDetail } from "@/components/complaint/ComplaintDetail";

const ComplaintDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!id) {
    return <div className="text-center text-red-500">ไม่พบรหัสร้องเรียน</div>;
  }
  return <ComplaintDetail complaintId={id} />;
};

export default ComplaintDetailPage;