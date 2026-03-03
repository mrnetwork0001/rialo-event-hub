
CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_hash text NOT NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_visits_hash ON public.site_visits (visitor_hash);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a visit
CREATE POLICY "Anyone can insert visits"
  ON public.site_visits FOR INSERT
  WITH CHECK (true);

-- Only admins can read visits directly
CREATE POLICY "Admins can read visits"
  ON public.site_visits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create a function to get unique visitor count (public, no auth needed)
CREATE OR REPLACE FUNCTION public.get_visitor_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT visitor_hash) FROM public.site_visits;
$$;
