import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useTeamAvailabilities, Availability } from "@/hooks/useAvailabilities";
import { useProfile } from "@/hooks/useAvailabilities";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Sparkles, Users, Clock, Check, ChevronUp, CalendarPlus, ChevronRight, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  updateParticipants: (id: string, names: string[]) => void;
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
  const startDt = `${date.replace(/-/g, "")}T${startTime.replace(/:/g, "")}00`;
  const endDt = `${date.replace(/-/g, "")}T${endTime.replace(/:/g, "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Team Meeting`,
    dates: `${startDt}/${endDt}`,
    details: `Participants: ${names.join(", ")}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatDateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  return format(d, "EEEE, dd/MM/yy");
}

interface TimeRange {
  start: string;
  end: string;
}

interface DayGroup {
  date: string;
  slots: Suggestion[];
  maxCount: number;
  ranges: TimeRange[];
}

// --- Add People Dialog ---
function AddPeopleDialog({
  booking,
  onUpdate,
}: {
  booking: { id: string; date: string; start_time: string; end_time: string; participant_names: string[] };
  onUpdate: (id: string, names: string[]) => void;
}) {
  const { data: profile } = useProfile();
  const teamUuid = profile?.team_uuid;
  const { data: members = [] } = useTeamMembers(teamUuid);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setSelected([...booking.participant_names]);
    }
    setOpen(isOpen);
  };

  const allNames = members.map((m) => m.full_name).filter(Boolean);
  const availableToAdd = allNames.filter((n) => !booking.participant_names.includes(n));

  const handleToggle = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleSave = () => {
    onUpdate(booking.id, selected);
    setOpen(false);
  };

  const newNames = selected.filter((n) => !booking.participant_names.includes(n));

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" title="Add people">
          <UserPlus className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Participants</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-3">
          {formatDateLabel(booking.date)} · {booking.start_time}–{booking.end_time}
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {allNames.map((name) => (
            <label key={name} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded hover:bg-muted/40">
              <Checkbox checked={selected.includes(name)} onCheckedChange={() => handleToggle(name)} />
              <span>{name}</span>
              {booking.participant_names.includes(name) && (
                <Badge variant="secondary" className="text-[10px] ml-auto">current</Badge>
              )}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-3">
          <Button className="flex-1" disabled={selected.length === 0} onClick={handleSave}>
            <Check className="w-4 h-4 mr-1.5" /> Save
          </Button>
          {newNames.length > 0 && (
            <a
              href={buildGoogleCalendarUrl(booking.date, booking.start_time, booking.end_time, selected)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Google Cal
              </Button>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SuggestedMeetings({ bookingsState }: Props) {
  const { data: profile } = useProfile();
  const teamUuid = profile?.team_uuid;
  const { data: teamData, isLoading } = useTeamAvailabilities(teamUuid);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
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
      .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));
  }, [teamData, bookingsState]);

  const dayGroups = useMemo((): DayGroup[] => {
    const groups: Record<string, Suggestion[]> = {};
    suggestions.forEach((s) => {
      if (!groups[s.date]) groups[s.date] = [];
      groups[s.date].push(s);
    });
    return Object.entries(groups)
      .map(([date, slots]) => {
        const sorted = slots.sort((a, b) => a.slot.localeCompare(b.slot));
        const ranges: TimeRange[] = [];
        sorted.forEach((s) => {
          const end = nextSlot(s.slot);
          if (ranges.length > 0 && ranges[ranges.length - 1].end === s.slot) {
            ranges[ranges.length - 1].end = end;
          } else {
            ranges.push({ start: s.slot, end });
          }
        });
        return {
          date,
          slots: sorted,
          maxCount: Math.max(...sorted.map((s) => s.count)),
          ranges,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [suggestions]);

  const maxMembers = teamData?.members.length || 4;

  const handleExpandDate = (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
      return;
    }
    setExpandedDate(date);
    const group = dayGroups.find((g) => g.date === date);
    if (group && group.slots.length > 0) {
      const allNames = new Set(group.slots.flatMap((s) => s.names));
      setSelectedNames([...allNames]);
      setSelectedStartSlot(group.slots[0].slot);
      const firstRange = group.ranges[0];
      setSelectedEndSlot(firstRange ? firstRange.end : nextSlot(group.slots[0].slot));
    }
  };

  const handleToggleName = (name: string) => {
    setSelectedNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleBook = (date: string) => {
    if (selectedNames.length === 0 || !selectedStartSlot || !selectedEndSlot) return;
    bookingsState.addBooking({
      date,
      startSlot: selectedStartSlot,
      endSlot: selectedEndSlot,
      names: selectedNames,
    });
    setExpandedDate(null);
  };

  const getStartOptions = (group: DayGroup) => {
    return group.slots
      .filter((s) => selectedNames.length === 0 || selectedNames.some((n) => s.names.includes(n)))
      .map((s) => s.slot);
  };

  const getEndOptions = (group: DayGroup) => {
    const startIdx = group.slots.findIndex((s) => s.slot === selectedStartSlot);
    if (startIdx < 0) return [nextSlot(group.slots[0].slot)];
    const options: string[] = [];
    for (let i = startIdx; i < group.slots.length; i++) {
      const s = group.slots[i];
      if (selectedNames.length > 0 && !selectedNames.some((n) => s.names.includes(n))) break;
      if (i > startIdx && nextSlot(group.slots[i - 1].slot) !== s.slot) break;
      options.push(nextSlot(s.slot));
    }
    return options.length > 0 ? options : [nextSlot(group.slots[startIdx].slot)];
  };

  const getDayNames = (group: DayGroup) => {
    const names = new Set(group.slots.flatMap((s) => s.names));
    return [...names];
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
                  <span className="font-medium">{formatDateLabel(b.date)}</span> {b.start_time}–{b.end_time}
                  <div className="text-muted-foreground">{b.participant_names.join(", ")}</div>
                </div>
                <div className="flex items-center gap-1">
                  <AddPeopleDialog booking={b} onUpdate={bookingsState.updateParticipants} />
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

      {dayGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No overlapping slots found yet. Add more availability!</p>
      ) : (
        <div className="space-y-2">
          {dayGroups.map((group) => (
            <div key={group.date} className="rounded-lg border border-border/50 overflow-hidden">
              {/* Day header */}
              <button
                className={cn(
                  "w-full p-3 flex items-center justify-between text-left transition-colors",
                  expandedDate === group.date ? "bg-primary/5 border-b border-border/50" : "hover:bg-muted/40"
                )}
                onClick={() => handleExpandDate(group.date)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold">{formatDateLabel(group.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.slots.length} slot{group.slots.length > 1 ? "s" : ""} · {group.ranges.map((r, i) => (
                        <span key={i}>{i > 0 && ", "}{r.start}–{r.end}</span>
                      ))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={group.maxCount === maxMembers ? "default" : "secondary"} className="text-xs">
                    {group.maxCount}/{maxMembers}
                  </Badge>
                  {expandedDate === group.date ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded day drilldown */}
              {expandedDate === group.date && (
                <div className="p-4 space-y-4 bg-card">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Available slots</p>
                    <div className="flex flex-wrap gap-1">
                      {group.slots.map((s) => (
                        <div
                          key={s.slot}
                          className={cn(
                            "px-2 py-1 rounded text-xs border",
                            s.count === maxMembers
                              ? "bg-primary/10 border-primary/30 text-primary font-medium"
                              : "bg-muted/40 border-border/50"
                          )}
                          title={s.names.join(", ")}
                        >
                          {s.slot} <span className="text-muted-foreground">({s.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Participants</p>
                    <div className="flex flex-wrap gap-2">
                      {getDayNames(group).map((n) => (
                        <label key={n} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox checked={selectedNames.includes(n)} onCheckedChange={() => handleToggleName(n)} />
                          {n}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Start time</p>
                      <Select value={selectedStartSlot} onValueChange={(v) => { setSelectedStartSlot(v); setSelectedEndSlot(nextSlot(v)); }}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {getStartOptions(group).map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">End time</p>
                      <Select value={selectedEndSlot} onValueChange={setSelectedEndSlot}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {getEndOptions(group).map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button className="w-full" disabled={selectedNames.length < 2} onClick={() => handleBook(group.date)}>
                    <Check className="w-4 h-4 mr-1.5" /> Book {selectedStartSlot}–{selectedEndSlot}
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
