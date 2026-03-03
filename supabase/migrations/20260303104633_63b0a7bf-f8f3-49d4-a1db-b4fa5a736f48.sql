
-- Fix: allow any team member to update the team name, not just the creator
DROP POLICY IF EXISTS "Creators can update teams" ON public.teams;
CREATE POLICY "Team members can update teams"
ON public.teams
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.team_uuid = teams.id
    AND profiles.user_id = auth.uid()
  )
);

-- Create bookings table for persisted meetings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_uuid uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  participant_names text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Team members can view bookings for their team
CREATE POLICY "Team members can view bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.team_uuid = bookings.team_uuid
    AND profiles.user_id = auth.uid()
  )
);

-- Team members can insert bookings for their team
CREATE POLICY "Team members can insert bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.team_uuid = bookings.team_uuid
    AND profiles.user_id = auth.uid()
  )
);

-- Team members can delete bookings for their team
CREATE POLICY "Team members can delete bookings"
ON public.bookings FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.team_uuid = bookings.team_uuid
    AND profiles.user_id = auth.uid()
  )
);
