-- Create uploads table to track all file uploads
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  download_count INTEGER DEFAULT 0
);

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('uploads', 'uploads', true, 104857600, NULL);

-- Enable RLS on uploads table
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read upload info (needed to download files)
CREATE POLICY "Anyone can read uploads"
ON public.uploads
FOR SELECT
USING (true);

-- Allow anyone to insert uploads (public file sharing)
CREATE POLICY "Anyone can insert uploads"
ON public.uploads
FOR INSERT
WITH CHECK (true);

-- Storage policies for uploads bucket
CREATE POLICY "Anyone can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Anyone can read uploaded files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'uploads');

-- Function to generate unique short IDs
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired uploads
CREATE OR REPLACE FUNCTION delete_expired_uploads()
RETURNS void AS $$
DECLARE
  expired_upload RECORD;
BEGIN
  FOR expired_upload IN 
    SELECT id, storage_path FROM public.uploads 
    WHERE expire_at IS NOT NULL AND expire_at < now()
  LOOP
    -- Delete from storage
    PERFORM storage.delete_object('uploads', expired_upload.storage_path);
    -- Delete record
    DELETE FROM public.uploads WHERE id = expired_upload.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster expiration queries
CREATE INDEX idx_uploads_expire_at ON public.uploads(expire_at) WHERE expire_at IS NOT NULL;