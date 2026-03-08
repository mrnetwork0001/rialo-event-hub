
-- Suggestions table
CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open'
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read suggestions
CREATE POLICY "Anyone can read suggestions" ON public.suggestions
  FOR SELECT USING (true);

-- Authenticated users can insert their own suggestions
CREATE POLICY "Users can insert own suggestions" ON public.suggestions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own suggestions
CREATE POLICY "Users can delete own suggestions" ON public.suggestions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Votes table (one vote per user per suggestion)
CREATE TABLE public.suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid REFERENCES public.suggestions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read votes
CREATE POLICY "Anyone can read votes" ON public.suggestion_votes
  FOR SELECT USING (true);

-- Authenticated users can insert own votes
CREATE POLICY "Users can vote" ON public.suggestion_votes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can remove their own votes
CREATE POLICY "Users can unvote" ON public.suggestion_votes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
