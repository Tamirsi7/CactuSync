import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export function useTeamMembers(teamUuid?: string) {
  return useQuery({
    queryKey: ["team-members", teamUuid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, created_at")
        .eq("team_uuid", teamUuid!)
        .order("created_at");
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!teamUuid,
  });
}

export function useLeaveTeam() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ team_uuid: null })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["team-availabilities"] });
      toast({ title: "You left the team" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}
