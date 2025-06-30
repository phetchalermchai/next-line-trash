import { NextRequest, NextResponse } from "next/server";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { findComplaintById, updateComplaint, deleteComplaint } from "@/lib/complaint/service";


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await apiKeyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const complaint = await findComplaintById(id);

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  return NextResponse.json(complaint);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await apiKeyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const formData = await req.formData();
  const data: Record<string, FormDataEntryValue> = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  const imageBeforeFiles = formData.getAll("imageBeforeFiles") as File[];
  const imageAfterFiles = formData.getAll("imageAfterFiles") as File[];

  try {
    const updated = await updateComplaint(id, data, {
      imageBeforeFiles,
      imageAfterFiles,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH Complaint] Error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await apiKeyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const success = await deleteComplaint(id);
    if (!success) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Complaint deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE Complaint] Error:", error);
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}