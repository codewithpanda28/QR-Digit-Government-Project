-- Add missing columns to emergency_alerts table
ALTER TABLE public.emergency_alerts 
ADD COLUMN IF NOT EXISTS evidence_photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS evidence_video TEXT;

-- Update the schema cache (handled by Supabase, but good to have the SQL recorded)
COMMENT ON COLUMN public.emergency_alerts.evidence_photos IS 'Array of public URLs for evidence photos captured during SOS';
COMMENT ON COLUMN public.emergency_alerts.evidence_video IS 'Public URL for evidence video captured during SOS';
