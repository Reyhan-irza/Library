import { supabase } from "@/lib/supabase";

export const BOOK_COVER_BUCKET = "book-covers";
export const MAX_BOOK_COVER_BYTES = 5 * 1024 * 1024;

const ALLOWED_BOOK_COVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function extensionFor(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;
  return file.type.split("/")[1] || "jpg";
}

export function validateBookCover(file: File): string | null {
  if (!ALLOWED_BOOK_COVER_TYPES.has(file.type)) {
    return "Gunakan gambar JPG, PNG, WEBP, atau AVIF.";
  }
  if (file.size > MAX_BOOK_COVER_BYTES) {
    return "Ukuran sampul maksimal 5 MB.";
  }
  return null;
}

export async function uploadBookCover(file: File): Promise<string> {
  const validationError = validateBookCover(file);
  if (validationError) throw new Error(validationError);

  const path = `covers/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(BOOK_COVER_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Gagal mengunggah sampul: ${error.message}`);

  const { data } = supabase.storage
    .from(BOOK_COVER_BUCKET)
    .getPublicUrl(path);

  if (!data.publicUrl) throw new Error("URL sampul tidak tersedia setelah upload.");
  return data.publicUrl;
}