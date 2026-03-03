
-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Everyone can view teams
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT TO authenticated USING (true);

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Team creators can update team name
CREATE POLICY "Creators can update teams" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Migrate existing integer team_ids to teams table
-- Insert teams for existing team_ids (1-5)
INSERT INTO public.teams (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Team 1'),
  ('00000000-0000-0000-0000-000000000002', 'Team 2'),
  ('00000000-0000-0000-0000-000000000003', 'Team 3'),
  ('00000000-0000-0000-0000-000000000004', 'Team 4'),
  ('00000000-0000-0000-0000-000000000005', 'Team 5');

-- Add new team_uuid column to profiles
ALTER TABLE public.profiles ADD COLUMN team_uuid uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Migrate data from team_id integer to team_uuid
UPDATE public.profiles SET team_uuid = 
  CASE team_id
    WHEN 1 THEN '00000000-0000-0000-0000-000000000001'::uuid
    WHEN 2 THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN 3 THEN '00000000-0000-0000-0000-000000000003'::uuid
    WHEN 4 THEN '00000000-0000-0000-0000-000000000004'::uuid
    WHEN 5 THEN '00000000-0000-0000-0000-000000000005'::uuid
  END;

-- Update the handle_new_user function to accept team_uuid instead of team_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, team_uuid)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'team_uuid')::uuid, NULL)
  );
  RETURN NEW;
END;
$function$;
