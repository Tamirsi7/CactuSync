import { useMemo, useState, useCallback, useRef } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { useTeamAvailabilities, useAddAvailability, Availability } from "@/hooks/useAvailabilities";
import { useProfile } from "@/hooks/useAvailabilities";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

// 30-minute slots from 7:00 to 23:00
const SLOTS: string[] = [];
for (let h = 7; h <= 22; h++) {
  SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}
SLOTS.push("23:00");

function nextSlot(slot: string): string {
  const h = parseInt(slot.split(":")[0]);
  const m = parseInt(slot.split(":")[1]);
  if (m === 0) return `${String(h).padStart(2, "0")}:30`;
  return `${String(h + 1).padStart(2, "0")}:00`;
}

interface SlotInfo {
  count: number;
  names: string[];
}

interface BookingsState {
  isSlotBooked: (date: string, slot: string) => boolean;
  getBookingAt: (date: string, slot: string) => { names: string[] } | undefined;
}

interface Props {
  bookingsState: BookingsState;
}

export function HeatmapCalendar({ bookingsState }: Props) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const teamUuid = profile?.team_uuid;
  const { data: teamData, isLoading } = useTeamAvailabilities(teamUuid);
  const addMutation = useAddAvailability();
  const [weekOffset, setWeekOffset] = useState(0);

  // Drag state
  const [dragState, setDragState] = useState<{ date: string; startIdx: number; endIdx: number } | null>(null);
  const isDragging = useRef(false);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const heatmap = useMemo(() => {
    if (!teamData) return {};
    const map: Record<string, SlotInfo> = {};

    teamData.availabilities.forEach((a: Availability) => {
      const member = teamData.members.find((m) => m.user_id === a.user_id);
      const name = member?.full_name || "Unknown";
      const startH = parseInt(a.start_time.split(":")[0]);
      const startM = parseInt(a.start_time.split(":")[1]);
      const endH = parseInt(a.end_time.split(":")[0]);
      const endM = parseInt(a.end_time.split(":")[1]);

      // Iterate through 30-minute slots
      for (const slot of SLOTS) {
        const sh = parseInt(slot.split(":")[0]);
        const sm = parseInt(slot.split(":")[1]);
        const slotMinutes = sh * 60 + sm;
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
          const key = `${a.date}-${slot}`;
          if (!map[key]) map[key] = { count: 0, names: [] };
          if (!map[key].names.includes(name)) {
            map[key].count++;
            map[key].names.push(name);
          }
        }
      }
    });

    return map;
  }, [teamData]);

  const maxCount = teamData?.members.length || 4;

  const getHeatColor = (count: number, date: string, slot: string) => {
    if (bookingsState.isSlotBooked(date, slot)) return "bg-booked text-booked-foreground";
    if (count === 0) return "bg-[hsl(var(--heat-0))]";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-[hsl(var(--heat-1))]";
    if (ratio <= 0.5) return "bg-[hsl(var(--heat-2))]";
    if (ratio <= 0.75) return "bg-[hsl(var(--heat-3))] text-primary-foreground";
    return "bg-[hsl(var(--heat-4))] text-primary-foreground";
  };

  const handleMouseDown = useCallback((dateStr: string, slotIdx: number) => {
    isDragging.current = true;
    setDragState({ date: dateStr, startIdx: slotIdx, endIdx: slotIdx });
  }, []);

  const handleMouseEnter = useCallback((dateStr: string, slotIdx: number) => {
    if (!isDragging.current || !dragState) return;
    if (dateStr !== dragState.date) return;
    setDragState((prev) => prev ? { ...prev, endIdx: slotIdx } : null);
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !dragState) {
      isDragging.current = false;
      setDragState(null);
      return;
    }
    isDragging.current = false;

    const minIdx = Math.min(dragState.startIdx, dragState.endIdx);
    const maxIdx = Math.max(dragState.startIdx, dragState.endIdx);
    const startTime = SLOTS[minIdx];
    const endTime = maxIdx + 1 < SLOTS.length ? SLOTS[maxIdx + 1] : "23:30";

    addMutation.mutate({
      date: dragState.date,
      start_time: startTime,
      end_time: endTime,
    });

    setDragState(null);
  }, [dragState, addMutation]);

  const isInDragRange = (dateStr: string, slotIdx: number) => {
    if (!dragState || dateStr !== dragState.date) return false;
    const minIdx = Math.min(dragState.startIdx, dragState.endIdx);
    const maxIdx = Math.max(dragState.startIdx, dragState.endIdx);
    return slotIdx >= minIdx && slotIdx <= maxIdx;
  };

  const teamName = (profile as any)?.teams?.name || `Team`;

  if (isLoading) return <div className="text-muted-foreground text-sm p-8">Loading heatmap...</div>;

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {teamName} Availability
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[140px] text-center">
            {format(days[0], "MMM d")} – {format(days[6], "MMM d, yyyy")}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Drag across cells to add your availability</p>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px mb-px">
            <div />
            {days.map((d) => (
              <div key={d.toISOString()} className="text-center py-2">
                <p className="text-xs text-muted-foreground">{format(d, "EEE")}</p>
                <p className="text-sm font-medium">{format(d, "d")}</p>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border/30 rounded-lg overflow-hidden select-none">
            {SLOTS.map((slot, slotIdx) => {
              const isHour = slot.endsWith(":00");
              return (
                <>
                  <div key={`label-${slot}`} className={cn("text-xs text-muted-foreground flex items-center justify-end pr-2 bg-background", isHour ? "py-1" : "py-0.5")}>
                    {isHour ? slot : ""}
                  </div>
                  {days.map((d) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const key = `${dateStr}-${slot}`;
                    const info = heatmap[key] || { count: 0, names: [] };
                    const inDrag = isInDragRange(dateStr, slotIdx);
                    const booked = bookingsState.isSlotBooked(dateStr, slot);
                    const booking = bookingsState.getBookingAt(dateStr, slot);

                    return (
                      <Popover key={key}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "h-5 w-full transition-colors duration-100 text-[10px] font-medium hover:ring-1 hover:ring-primary/30 focus:outline-none",
                              inDrag ? "bg-primary/30 ring-1 ring-primary/50" : getHeatColor(info.count, dateStr, slot),
                              !isHour && "border-t border-border/20"
                            )}
                            onMouseDown={(e) => { e.preventDefault(); handleMouseDown(dateStr, slotIdx); }}
                            onMouseEnter={() => handleMouseEnter(dateStr, slotIdx)}
                          >
                            {booked ? "●" : info.count > 0 ? info.count : ""}
                          </button>
                        </PopoverTrigger>
                        {(info.count > 0 || booked) && (
                          <PopoverContent className="w-48 p-3" align="center">
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-muted-foreground">
                                {format(d, "MMM d")} at {slot}
                              </p>
                              {booked && booking && (
                                <div className="text-xs text-booked font-medium">
                                  Booked: {booking.names.join(", ")}
                                </div>
                              )}
                              {info.count > 0 && (
                                <div className="space-y-1">
                                  {info.names.map((n) => (
                                    <div key={n} className="flex items-center gap-1.5 text-sm">
                                      <Users className="w-3 h-3 text-primary" />
                                      {n}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        )}
                      </Popover>
                    );
                  })}
                </>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end flex-wrap">
            <span className="text-xs text-muted-foreground">Less</span>
            {["bg-[hsl(var(--heat-0))]", "bg-[hsl(var(--heat-1))]", "bg-[hsl(var(--heat-2))]", "bg-[hsl(var(--heat-3))]", "bg-[hsl(var(--heat-4))]"].map((c, i) => (
              <div key={i} className={cn("w-5 h-5 rounded-sm border border-border/30", c)} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
            <span className="text-xs text-muted-foreground ml-2">|</span>
            <div className="w-5 h-5 rounded-sm border border-border/30 bg-booked" />
            <span className="text-xs text-muted-foreground">Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
