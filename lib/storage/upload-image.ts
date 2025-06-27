import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ใช้ Service Role Key เพื่ออัปโหลดไฟล์
);

export async function uploadImageToSupabase(buffer: Buffer, filename: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET!)
    .upload(filename, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${filename}`;
}
