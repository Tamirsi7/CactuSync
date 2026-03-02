import { useMemo, useState } from "react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { useTeamAvailabilities, Availability } from "@/hooks/useAvailabilities";
import { useProfile } from "@/hooks/useAvailabilities";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7:00 - 23:00

interface SlotInfo {
  count: number;
  names: string[];
}

export function HeatmapCalendar() {
  const { data: profile } = useProfile();
  const { data: teamData, isLoading } = useTeamAvailabilities(profile?.team_id);
  const [weekOffset, setWeekOffset] = useState(0);

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
      const endH = parseInt(a.end_time.split(":")[0]);
      const endM = parseInt(a.end_time.split(":")[1]);

      for (let h = startH; h < endH + (endM > 0 ? 1 : 0); h++) {
        const key = `${a.date}-${h}`;
        if (!map[key]) map[key] = { count: 0, names: [] };
        if (!map[key].names.includes(name)) {
          map[key].count++;
          map[key].names.push(name);
        }
      }
    });

    return map;
  }, [teamData]);

  const maxCount = teamData?.members.length || 4;

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-[hsl(var(--heat-0))]";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-[hsl(var(--heat-1))]";
    if (ratio <= 0.5) return "bg-[hsl(var(--heat-2))]";
    if (ratio <= 0.75) return "bg-[hsl(var(--heat-3))] text-primary-foreground";
    return "bg-[hsl(var(--heat-4))] text-primary-foreground";
  };

  if (isLoading) return <div className="text-muted-foreground text-sm p-8">Loading heatmap...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Team {profile?.team_id} Availability
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
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border/30 rounded-lg overflow-hidden">
            {HOURS.map((hour) => (
              <>
                <div key={`label-${hour}`} className="text-xs text-muted-foreground flex items-center justify-end pr-2 py-1 bg-background">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {days.map((d) => {
                  const dateStr = format(d, "yyyy-MM-dd");
                  const key = `${dateStr}-${hour}`;
                  const info = heatmap[key] || { count: 0, names: [] };

                  return (
                    <Popover key={key}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "h-8 w-full transition-colors duration-200 text-xs font-medium hover:ring-1 hover:ring-primary/30 focus:outline-none",
                            getHeatColor(info.count)
                          )}
                        >
                          {info.count > 0 && info.count}
                        </button>
                      </PopoverTrigger>
                      {info.count > 0 && (
                        <PopoverContent className="w-48 p-3" align="center">
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">
                              {format(d, "MMM d")} at {hour}:00
                            </p>
                            <div className="space-y-1">
                              {info.names.map((n) => (
                                <div key={n} className="flex items-center gap-1.5 text-sm">
                                  <Users className="w-3 h-3 text-primary" />
                                  {n}
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      )}
                    </Popover>
                  );
                })}
              </>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-xs text-muted-foreground">Less</span>
            {["bg-[hsl(var(--heat-0))]", "bg-[hsl(var(--heat-1))]", "bg-[hsl(var(--heat-2))]", "bg-[hsl(var(--heat-3))]", "bg-[hsl(var(--heat-4))]"].map((c, i) => (
              <div key={i} className={cn("w-5 h-5 rounded-sm border border-border/30", c)} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
