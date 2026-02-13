
-- Function to auto-update upcoming events to live when their date arrives
CREATE OR REPLACE FUNCTION public.auto_update_event_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.events 
  SET status = 'live' 
  WHERE status = 'upcoming' 
  AND event_date <= now();
END;
$$;

-- Site settings table for configurable values like submit event URL
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Seed the submit event URL setting
INSERT INTO public.site_settings (key, value) VALUES ('submit_event_url', '');
