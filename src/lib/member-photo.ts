import { supabase } from "@/lib/supabase";

export const MEMBER_PHOTO_BUCKET = "member-photos";
export const MAX_MEMBER_PHOTO_BYTES = 5 * 1024 * 1024;

const ALLOWED_MEMBER_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function extensionFor(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;
  return file.type.split("/")[1] || "jpg";
}

export function validateMemberPhoto(file: File): string | null {
  if (!ALLOWED_MEMBER_PHOTO_TYPES.has(file.type)) {
    return "Gunakan foto JPG, PNG, atau WEBP.";
  }
  if (file.size > MAX_MEMBER_PHOTO_BYTES) {
    return "Ukuran foto maksimal 5 MB.";
  }
  return null;
}

export async function uploadMemberPhoto(file: File): Promise<string> {
  const validationError = validateMemberPhoto(file);
  if (validationError) throw new Error(validationError);

  const path = `members/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Gagal mengunggah foto siswa: ${error.message}`);
  return path;
}

export async function removeMemberPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(MEMBER_PHOTO_BUCKET).remove([path]);
  if (error) console.warn("[Supabase] Gagal membersihkan foto siswa:", error.message);
}

export async function createMemberPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (!uniquePaths.length) return {};

  const { data, error } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .createSignedUrls(uniquePaths, 60 * 60);
  if (error) throw new Error(`Gagal memuat foto siswa: ${error.message}`);

  return Object.fromEntries(
    (data ?? [])
      .filter((item) => Boolean(item.path && item.signedUrl))
      .map((item) => [item.path as string, item.signedUrl as string]),
  );
}