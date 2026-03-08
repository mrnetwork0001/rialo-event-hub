
ALTER TABLE public.profiles
ADD COLUMN discord_username text DEFAULT '',
ADD COLUMN wallet_address text DEFAULT '',
ADD COLUMN avatar_url text DEFAULT '';
