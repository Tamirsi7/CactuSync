
-- Add unique constraint on profiles.user_id so we can FK to it
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add FK from team_join_requests.user_id to profiles.user_id
ALTER TABLE public.team_join_requests 
  ADD CONSTRAINT team_join_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
