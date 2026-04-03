-- Add branding columns for User Dashboards
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#4f46e5';
