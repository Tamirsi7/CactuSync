import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useAvailabilities";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useMemo } from "react";

export interface Booking {
  id: string;
  team_uuid: string;
  date: string;
  start_time: string;
  end_time: string;
  participant_names: string[];
  created_by: string;
  created_at: string;
}

export function useBookings() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const teamUuid = profile?.team_uuid;
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", teamUuid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("team_uuid", teamUuid!)
        .order("date")
        .order("start_time");
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user && !!teamUuid,
  });

  const addMutation = useMutation({
    mutationFn: async (b: { date: string; startSlot: string; endSlot: string; names: string[] }) => {
      const { error } = await supabase.from("bookings").insert({
        team_uuid: teamUuid!,
        date: b.date,
        start_time: b.startSlot,
        end_time: b.endSlot,
        participant_names: b.names,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", teamUuid] });
      toast({ title: "Meeting booked" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", teamUuid] });
      toast({ title: "Booking removed" });
    },
  });

  const addBooking = useCallback(
    (b: { date: string; startSlot: string; endSlot: string; names: string[] }) => {
      addMutation.mutate(b);
    },
    [addMutation]
  );

  const removeBooking = useCallback(
    (id: string) => {
      removeMutation.mutate(id);
    },
    [removeMutation]
  );

  const isSlotBooked = useCallback(
    (date: string, slot: string) => {
      return bookings.some(
        (b) => b.date === date && slot >= b.start_time && slot < b.end_time
      );
    },
    [bookings]
  );

  const getBookingAt = useCallback(
    (date: string, slot: string) => {
      const b = bookings.find(
        (b) => b.date === date && slot >= b.start_time && slot < b.end_time
      );
      if (!b) return undefined;
      return { names: b.participant_names };
    },
    [bookings]
  );

  return { bookings, addBooking, removeBooking, isSlotBooked, getBookingAt };
}
