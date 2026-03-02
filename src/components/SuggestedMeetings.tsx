import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useTeamAvailabilities, Availability } from "@/hooks/useAvailabilities";
import { useProfile } from "@/hooks/useAvailabilities";
import { Sparkles, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Suggestion {
  date: string;
  hour: number;
  count: number;
  names: string[];
}

export function SuggestedMeetings() {
  const { data: profile } = useProfile();
  const { data: teamData, isLoading } = useTeamAvailabilities(profile?.team_id);

  const suggestions = useMemo(() => {
    if (!teamData) return [];
    const map: Record<string, { count: number; names: string[] }> = {};

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

    const today = new Date().toISOString().split("T")[0];
    return Object.entries(map)
      .filter(([key, v]) => v.count >= 2 && key.split("-").slice(0, 3).join("-") >= today)
      .map(([key, v]): Suggestion => {
        const parts = key.split("-");
        const hour = parseInt(parts[3]);
        const date = parts.slice(0, 3).join("-");
        return { date, hour, count: v.count, names: v.names };
      })
      .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.hour - b.hour)
      .slice(0, 10);
  }, [teamData]);

  const maxMembers = teamData?.members.length || 4;

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Suggested Times</h3>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No overlapping slots found yet. Add more availability!</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {suggestions.map((s, i) => (
            <div
              key={`${s.date}-${s.hour}`}
              className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2 transition-all hover:border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium">
                    {format(parseISO(s.date), "MMM d")} · {String(s.hour).padStart(2, "0")}:00
                  </span>
                </div>
                <Badge variant={s.count === maxMembers ? "default" : "secondary"} className="text-xs">
                  {s.count}/{maxMembers}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.names.map((n) => (
                  <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
