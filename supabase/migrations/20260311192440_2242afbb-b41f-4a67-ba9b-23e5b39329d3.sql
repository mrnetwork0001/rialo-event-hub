
-- Albums table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'approved',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved albums" ON public.albums
  FOR SELECT TO public USING (status = 'approved');

CREATE POLICY "Anyone can submit albums" ON public.albums
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');

CREATE POLICY "Admins can manage albums" ON public.albums
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Album photos table
CREATE TABLE public.album_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read photos of approved albums" ON public.album_photos
  FOR SELECT TO public USING (
    EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND status = 'approved')
  );

CREATE POLICY "Anyone can insert photos" ON public.album_photos
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage photos" ON public.album_photos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for album photos
INSERT INTO storage.buckets (id, name, public) VALUES ('album-photos', 'album-photos', true);

-- Storage policies
CREATE POLICY "Anyone can upload album photos" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'album-photos');

CREATE POLICY "Anyone can read album photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'album-photos');

CREATE POLICY "Admins can delete album photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'album-photos' AND public.has_role(auth.uid(), 'admin'));
