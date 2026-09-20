-- Profile photo storage. profiles.avatar_url stores the public URL; the file itself lives
-- in a dedicated 'avatars' bucket, one object per user at "<user_id>/avatar.<ext>" so a
-- re-upload can just overwrite (upsert) rather than accumulating old files.
ALTER TABLE public.profiles ADD COLUMN avatar_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public bucket, so reads don't strictly need a policy to be servable via the public URL,
-- but this makes authenticated listing/reads work consistently too.
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- storage.foldername(name) splits the object path on '/' — the first segment must be the
-- uploader's own user id, so nobody can write into or overwrite another user's avatar.
CREATE POLICY "Users upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
