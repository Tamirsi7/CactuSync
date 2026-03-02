import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddAvailability } from "@/hooks/useAvailabilities";

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 23; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

export function AddAvailabilityForm() {
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const addMutation = useAddAvailability();

  const handleAdd = () => {
    if (!date || !startTime || !endTime) return;
    addMutation.mutate(
      { date: format(date, "yyyy-MM-dd"), start_time: startTime, end_time: endTime },
      { onSuccess: () => { setDate(undefined); setStartTime(""); setEndTime(""); } }
    );
  };

  const endTimeOptions = TIME_OPTIONS.filter((t) => t > startTime);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Add Availability</h3>
      <div className="grid gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="grid grid-cols-2 gap-3">
          <Select value={startTime} onValueChange={(v) => { setStartTime(v); if (endTime <= v) setEndTime(""); }}>
            <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
            <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
            <SelectContent>
              {endTimeOptions.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAdd} disabled={!date || !startTime || !endTime || addMutation.isPending} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Availability
        </Button>
      </div>
    </div>
  );
}
