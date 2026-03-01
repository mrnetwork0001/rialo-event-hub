
CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms', 'telegram')),
  contact text NOT NULL,
  remind_at timestamp with time zone NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert reminders" ON public.reminders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read own reminders by contact" ON public.reminders
  FOR SELECT USING (true);

CREATE INDEX idx_reminders_pending ON public.reminders (remind_at) WHERE sent = false;
