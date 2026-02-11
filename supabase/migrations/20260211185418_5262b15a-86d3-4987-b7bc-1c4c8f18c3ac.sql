
-- Create event category enum
CREATE TYPE public.event_category AS ENUM ('AMA', 'Quiz & Games', 'X Space', 'Workshop', 'Meetup', 'Builders Showcase', 'Educational');

-- Create event status enum
CREATE TYPE public.event_status AS ENUM ('upcoming', 'live', 'past');

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category event_category NOT NULL,
  status event_status NOT NULL DEFAULT 'upcoming',
  event_date TIMESTAMPTZ NOT NULL,
  host TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT '',
  join_link TEXT,
  share_link TEXT,
  recap_summary TEXT,
  recording_link TEXT,
  rsvp_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Events RLS: anyone can read
CREATE POLICY "Anyone can read events"
  ON public.events FOR SELECT
  USING (true);

-- Events RLS: only admins can insert
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Events RLS: only admins can update
CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Events RLS: only admins can delete
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles RLS: only admins can read roles
CREATE POLICY "Admins can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial events
INSERT INTO public.events (title, description, category, status, event_date, host, platform, join_link, share_link, rsvp_count) VALUES
  ('Confidentiality in Africa''s Finance', 'Privacy meets utility, the future we want! From Oxfairblock''s encrypted shields to RialoHQ''s real world build, community vibes.', 'X Space', 'upcoming', '2026-02-12T14:00:00Z', 'RialoAfrica', 'Twitter Space', '#', '#', 24),
  ('Rialo Builders Showcase #3', 'Join the third edition of Rialo Builders Showcase where community devs present their latest projects built on the Rialo ecosystem.', 'Builders Showcase', 'live', '2026-02-11T10:00:00Z', 'RialoHQ', 'Google Meet', '#', NULL, 56),
  ('Intro to Rialo Smart Contracts', 'A beginner-friendly workshop covering the fundamentals of developing smart contracts within the Rialo ecosystem.', 'Workshop', 'upcoming', '2026-02-18T16:00:00Z', 'MrNetwork', 'Discord Stage', '#', NULL, 38),
  ('Rialo Community Trivia Night', 'Test your knowledge about the Rialo ecosystem! Prizes for top scorers.', 'Quiz & Games', 'past', '2026-02-05T19:00:00Z', 'CommunityDAO', 'Twitter Space', NULL, NULL, 120),
  ('AMA with Rialo Core Team', 'Ask the core team anything about Rialo''s roadmap, partnerships, and upcoming features.', 'AMA', 'past', '2026-01-28T15:00:00Z', 'RialoHQ', 'Twitter Space', NULL, NULL, 89),
  ('Lagos Web3 Community Meetup', 'In-person meetup for Rialo community members in Lagos. Networking, talks, and workshops.', 'Meetup', 'upcoming', '2026-03-01T13:00:00Z', 'RialoAfrica', 'In-Person (Lagos)', '#', NULL, 42),
  ('DeFi Fundamentals for Africa', 'Understanding decentralized finance and its impact on African economies.', 'Educational', 'past', '2026-01-20T11:00:00Z', 'RialoEdu', 'YouTube Live', NULL, NULL, 67);

-- Add recap/recording for past events
UPDATE public.events SET recap_summary = 'Over 120 participants joined! Top 3 winners received RIALO tokens.', recording_link = '#' WHERE title = 'Rialo Community Trivia Night';
UPDATE public.events SET recap_summary = 'Key announcements: Testnet v2 launch confirmed for March.', recording_link = '#' WHERE title = 'AMA with Rialo Core Team';
UPDATE public.events SET recap_summary = 'Comprehensive session covering DeFi basics and yield farming.', recording_link = '#' WHERE title = 'DeFi Fundamentals for Africa';
