
-- Table to store Telegram bot subscribers
CREATE TABLE public.telegram_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL UNIQUE,
  username text,
  is_admin boolean NOT NULL DEFAULT false,
  subscribed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_subscribers ENABLE ROW LEVEL SECURITY;

-- Only admins can read subscribers
CREATE POLICY "Admins can read subscribers"
ON public.telegram_subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Edge functions insert via service role, no public insert needed
-- But we need the webhook (service role) to insert, so no RLS insert policy needed for anon

-- Allow service role operations (no restrictive policies block service role)
