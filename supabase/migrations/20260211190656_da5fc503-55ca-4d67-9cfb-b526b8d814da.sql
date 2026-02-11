-- Add image_url and is_pinned columns to events table
ALTER TABLE public.events ADD COLUMN image_url text;
ALTER TABLE public.events ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;