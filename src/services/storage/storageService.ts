import { supabase } from "../supabase/client";

const BUCKET = "produtos";

export function getPublicUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(
  file: File,
  folder: "images" | "documents",
  userId: string
) {
  const extension = file.name.split(".").pop() ?? "bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const path = `${userId}/${folder}/${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return path;
}

export async function uploadImages(files: File[], userId: string) {
  const paths: string[] = [];
  for (const file of files) {
    paths.push(await uploadFile(file, "images", userId));
  }
  return paths;
}

export async function uploadDocuments(files: File[], userId: string) {
  const paths: string[] = [];
  for (const file of files) {
    paths.push(await uploadFile(file, "documents", userId));
  }
  return paths;
}

export async function removeFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function uploadCompanyMedia(
  file: File,
  kind: "logo" | "banner",
  userId: string
) {
  const extension = file.name.split(".").pop() ?? "png";
  const path = `companies/${userId}/${kind}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
