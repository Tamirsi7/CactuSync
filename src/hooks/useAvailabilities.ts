import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export interface Availability {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface AvailabilityWithProfile extends Availability {
  profiles?: { full_name: string; team_id: number } | null;
}

export function useMyAvailabilities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-availabilities", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availabilities")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as Availability[];
    },
    enabled: !!user,
  });
}

export function useTeamAvailabilities(teamId?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team-availabilities", teamId],
    queryFn: async () => {
      // Get team members
      const { data: members, error: mErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, team_id")
        .eq("team_id", teamId!);
      if (mErr) throw mErr;

      const userIds = members.map((m) => m.user_id);
      if (userIds.length === 0) return { availabilities: [], members };

      const { data: avails, error: aErr } = await supabase
        .from("availabilities")
        .select("*")
        .in("user_id", userIds)
        .order("date")
        .order("start_time");
      if (aErr) throw aErr;

      return { availabilities: avails as Availability[], members };
    },
    enabled: !!user && !!teamId,
  });
}

export function useAddAvailability() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (slot: { date: string; start_time: string; end_time: string }) => {
      const { error } = await supabase.from("availabilities").insert({
        user_id: user!.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-availabilities"] });
      qc.invalidateQueries({ queryKey: ["team-availabilities"] });
      toast({ title: "Availability added" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteAvailability() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availabilities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-availabilities"] });
      qc.invalidateQueries({ queryKey: ["team-availabilities"] });
      toast({ title: "Slot removed" });
    },
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
