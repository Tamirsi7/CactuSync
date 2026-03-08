import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export function useMyJoinRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-join-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_join_requests")
        .select("*, teams:team_id(id, name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateJoinRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from("team_join_requests")
        .insert({ user_id: user!.id, team_id: teamId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-join-requests"] });
      toast({ title: "Request sent", description: "Waiting for admin approval." });
    },
    onError: (e: any) => {
      const msg = e.message?.includes("unique_pending_request")
        ? "You already have a pending request for this team."
        : e.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });
}

// Admin hooks
export function useAllJoinRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all-join-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_join_requests")
        .select("*, teams:team_id(id, name), profiles!team_join_requests_user_id_fkey(user_id, full_name, email)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, userId, teamId }: { requestId: string; userId: string; teamId: string }) => {
      // Update the request status
      const { error: reqError } = await supabase
        .from("team_join_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (reqError) throw reqError;

      // Assign user to team
      const { error: profError } = await supabase
        .from("profiles")
        .update({ team_uuid: teamId })
        .eq("user_id", userId);
      if (profError) throw profError;

      // Reject other pending requests from same user
      await supabase
        .from("team_join_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "pending");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-join-requests"] });
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
      toast({ title: "Request approved" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useRejectJoinRequest() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("team_join_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-join-requests"] });
      toast({ title: "Request rejected" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}
