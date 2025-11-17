-- Add custom_name column to uploads table
ALTER TABLE public.uploads 
ADD COLUMN custom_name TEXT;

-- Add index for better query performance
CREATE INDEX idx_uploads_custom_name ON public.uploads(custom_name);