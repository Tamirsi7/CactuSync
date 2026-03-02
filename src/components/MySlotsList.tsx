import { format, parseISO } from "date-fns";
import { Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyAvailabilities, useDeleteAvailability } from "@/hooks/useAvailabilities";

export function MySlotsList() {
  const { data: slots, isLoading } = useMyAvailabilities();
  const deleteMutation = useDeleteAvailability();

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Slots</h3>
      {!slots?.length ? (
        <p className="text-sm text-muted-foreground">No availability added yet.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50 group transition-all hover:border-primary/20"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{format(parseISO(slot.date), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate(slot.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
