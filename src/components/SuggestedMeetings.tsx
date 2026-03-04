import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useTeamAvailabilities, Availability } from "@/hooks/useAvailabilities";
import { useProfile } from "@/hooks/useAvailabilities";
import { Sparkles, Users, Clock, Check, ChevronDown, ChevronUp, CalendarPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Suggestion {
  date: string;
  slot: string;
  count: number;
  names: string[];
}

interface BookingsState {
  bookings: { id: string; date: string; start_time: string; end_time: string; participant_names: string[] }[];
  addBooking: (b: { date: string; startSlot: string; endSlot: string; names: string[] }) => void;
  removeBooking: (id: string) => void;
  isSlotBooked: (date: string, slot: string) => boolean;
}

interface Props {
  bookingsState: BookingsState;
}

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

function buildGoogleCalendarUrl(date: string, startTime: string, endTime: string, names: string[]): string {
  const startDt = `${date.replace(/-/g, "")}T${startTime.replace(":", "")}00`;
  const endDt = `${date.replace(/-/g, "")}T${endTime.replace(":", "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Team Meeting`,
    dates: `${startDt}/${endDt}`,
    details: `Participants: ${names.join(", ")}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function SuggestedMeetings({ bookingsState }: Props) {
  const { data: profile } = useProfile();
  const teamUuid = profile?.team_uuid;
  const { data: teamData, isLoading } = useTeamAvailabilities(teamUuid);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [selectedStartSlot, setSelectedStartSlot] = useState("");
  const [selectedEndSlot, setSelectedEndSlot] = useState("");

  const suggestions = useMemo(() => {
    if (!teamData) return [];
    const map: Record<string, { count: number; names: string[] }> = {};

    teamData.availabilities.forEach((a: Availability) => {
      const member = teamData.members.find((m) => m.user_id === a.user_id);
      const name = member?.full_name || "Unknown";
      const startH = parseInt(a.start_time.split(":")[0]);
      const startM = parseInt(a.start_time.split(":")[1]);
      const endH = parseInt(a.end_time.split(":")[0]);
      const endM = parseInt(a.end_time.split(":")[1]);

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

    const today = new Date().toISOString().split("T")[0];
    return Object.entries(map)
      .filter(([key, v]) => {
        if (v.count < 2) return false;
        const parts = key.split("-");
        const date = parts.slice(0, 3).join("-");
        if (date < today) return false;
        const slot = key.substring(date.length + 1);
        if (bookingsState.isSlotBooked(date, slot)) return false;
        return true;
      })
      .map(([key, v]): Suggestion => {
        const parts = key.split("-");
        const date = parts.slice(0, 3).join("-");
        const slot = key.substring(date.length + 1);
        return { date, slot, count: v.count, names: v.names };
      })
      .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot))
      .slice(0, 20);
  }, [teamData, bookingsState]);

  const maxMembers = teamData?.members.length || 4;

  const handleExpand = (idx: number, s: Suggestion) => {
    if (expandedIdx === idx) { setExpandedIdx(null); return; }
    setExpandedIdx(idx);
    setSelectedNames([...s.names]);
    setSelectedStartSlot(s.slot);
    setSelectedEndSlot(nextSlot(s.slot));
  };

  const handleToggleName = (name: string) => {
    setSelectedNames((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  const handleBook = (s: Suggestion) => {
    if (selectedNames.length === 0) return;
    bookingsState.addBooking({
      date: s.date,
      startSlot: selectedStartSlot || s.slot,
      endSlot: selectedEndSlot || nextSlot(s.slot),
      names: selectedNames,
    });
    setExpandedIdx(null);
  };

  const getEndSlotOptions = (s: Suggestion) => {
    const startIdx = SLOTS.indexOf(selectedStartSlot || s.slot);
    if (startIdx < 0) return [nextSlot(s.slot)];
    const options: string[] = [];
    for (let i = startIdx + 1; i < SLOTS.length; i++) {
      options.push(SLOTS[i]);
      const nextSuggestion = suggestions.find((sg) => sg.date === s.date && sg.slot === SLOTS[i]);
      if (!nextSuggestion || !selectedNames.every((n) => nextSuggestion.names.includes(n))) break;
    }
    return options.length > 0 ? options : [nextSlot(s.slot)];
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Suggested Times</h3>
      </div>

      {/* Booked meetings */}
      {bookingsState.bookings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-booked">Booked</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {bookingsState.bookings.map((b) => (
              <div key={b.id} className="p-2 rounded-lg bg-booked/10 border border-booked/30 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-medium">{format(parseISO(b.date), "MMM d")}</span> {b.start_time}–{b.end_time}
                  <div className="text-muted-foreground">{b.participant_names.join(", ")}</div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={buildGoogleCalendarUrl(b.date, b.start_time, b.end_time, b.participant_names)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" title="Add to Google Calendar">
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => bookingsState.removeBooking(b.id)}>
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border/50" />
        </div>
      )}

      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No overlapping slots found yet. Add more availability!</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {suggestions.map((s, i) => (
            <div key={`${s.date}-${s.slot}`}>
              <div
                className={cn(
                  "p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2 transition-all cursor-pointer",
                  expandedIdx === i ? "border-primary/40" : "hover:border-primary/20"
                )}
                onClick={() => handleExpand(i, s)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-medium">
                      {format(parseISO(s.date), "MMM d")} · {s.slot}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={s.count === maxMembers ? "default" : "secondary"} className="text-xs">
                      {s.count}/{maxMembers}
                    </Badge>
                    {expandedIdx === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.names.map((n) => (
                    <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{n}</span>
                  ))}
                </div>
              </div>

              {expandedIdx === i && (
                <div className="mt-1 p-3 rounded-lg border border-primary/20 bg-card space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Select participants & time</p>
                  <div className="space-y-1.5">
                    {s.names.map((n) => (
                      <label key={n} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={selectedNames.includes(n)} onCheckedChange={() => handleToggleName(n)} />
                        {n}
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Start</p>
                      <Select value={selectedStartSlot} onValueChange={(v) => { setSelectedStartSlot(v); setSelectedEndSlot(nextSlot(v)); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value={s.slot}>{s.slot}</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">End</p>
                      <Select value={selectedEndSlot} onValueChange={setSelectedEndSlot}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {getEndSlotOptions(s).map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button size="sm" className="w-full" disabled={selectedNames.length === 0} onClick={() => handleBook(s)}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Book this slot
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
