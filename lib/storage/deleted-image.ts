import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function deleteImageFromSupabase(url: string): Promise<void> {
  try {
    const bucket = process.env.SUPABASE_BUCKET!;
    const path = url.split(`/storage/v1/object/public/${bucket}/`)[1]?.split('?')[0];
    if (!path) throw new Error("ไม่พบ path ของไฟล์ที่จะลบ");

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  } catch (err) {
    console.error("[deleteImageFromSupabase] Error:", err);
    throw err;
  }
}