
-- Create team join requests table
CREATE TABLE public.team_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one pending request per user per team
CREATE UNIQUE INDEX unique_pending_request ON public.team_join_requests (user_id, team_id) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
  ON public.team_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
  ON public.team_join_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
  ON public.team_join_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
