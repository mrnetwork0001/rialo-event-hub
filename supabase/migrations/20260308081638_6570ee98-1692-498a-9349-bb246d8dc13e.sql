
ALTER TABLE public.events 
ADD COLUMN recurrence_type text DEFAULT 'none' NOT NULL,
ADD COLUMN recurrence_parent_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.recurrence_type IS 'none, weekly, or monthly';
COMMENT ON COLUMN public.events.recurrence_parent_id IS 'Links to the original recurring event template';
