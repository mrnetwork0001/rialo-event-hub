
-- Add approval_status column to events
ALTER TABLE public.events 
ADD COLUMN approval_status text NOT NULL DEFAULT 'approved';

-- Set all existing events as approved
UPDATE public.events SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Allow anyone (anonymous/authenticated) to insert events as 'pending'
CREATE POLICY "Anyone can submit events"
ON public.events FOR INSERT
TO anon, authenticated
WITH CHECK (approval_status = 'pending');
