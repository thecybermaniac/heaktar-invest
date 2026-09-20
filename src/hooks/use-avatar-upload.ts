import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/hk/toast";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
}

export function useAvatarUpload() {
  const { user } = useAuth();
  const { profile, setProfile } = useApp();
  const { saveProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (!user) return;
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Unsupported file", "Please choose a JPG, PNG or WEBP image.");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Image too large", "Please choose an image under 5MB.");
        return;
      }

      setUploading(true);
      try {
        // Fixed filename per user (one avatar each) so re-uploading overwrites in place —
        // upsert avoids accumulating orphaned files in the bucket over time.
        const path = `${user.id}/avatar.${extensionFor(file)}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        // Cache-bust: the path is stable across re-uploads, so without this the browser
        // (and any CDN in front of storage) would keep showing the old cached image.
        const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

        await saveProfile({ avatarUrl });
        setProfile({ ...profile, avatarUrl });
        toast.success("Photo updated", "Your profile photo has been changed.");
      } catch (err) {
        toast.error(
          "Couldn't upload photo",
          err instanceof Error ? err.message : "Please try again.",
        );
      } finally {
        setUploading(false);
      }
    },
    [user, profile, setProfile, saveProfile],
  );

  return { upload, uploading };
}
