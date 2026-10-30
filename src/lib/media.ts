import { put } from "@vercel/blob/client";
import { api } from "@/lib/api";

/** Brand images (backend src/modules/media): upload straight to storage, then save the link. */
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_BYTES = 2_000_000;

type Target = { pathname: string; clientToken: string; access: "public" | "private" };

async function upload(target: Target, file: File) {
  const blob = await put(target.pathname, file, { access: target.access as "public", token: target.clientToken, contentType: file.type });
  return blob.pathname;
}

/** A problem with the file itself, in words, before anything is uploaded. */
export const fileProblem = (file: File) => (!IMAGE_TYPES.includes(file.type) ? "Use a PNG, JPEG or WebP image." : file.size > MAX_IMAGE_BYTES ? "Images can be up to 2 MB." : null);

export const media = {
  async setLogo(orgId: string, file: File | null) {
    if (!file) return api<{ logo: string | null }>(`/orgs/${orgId}/logo`, { method: "PUT", body: { pathname: null } });
    const target = await api<Target>(`/orgs/${orgId}/logo/upload`, { body: { contentType: file.type, sizeBytes: file.size } });
    return api<{ logo: string | null }>(`/orgs/${orgId}/logo`, { method: "PUT", body: { pathname: await upload(target, file) } });
  },
  async setPhoto(file: File | null) {
    if (!file) return api<{ image: string | null }>("/me/photo", { method: "PUT", body: { pathname: null } });
    const target = await api<Target>("/me/photo/upload", { body: { contentType: file.type, sizeBytes: file.size } });
    return api<{ image: string | null }>("/me/photo", { method: "PUT", body: { pathname: await upload(target, file) } });
  },
};
