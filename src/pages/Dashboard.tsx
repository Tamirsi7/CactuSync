import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useAvailabilities";
import { AddAvailabilityForm } from "@/components/AddAvailabilityForm";
import { MySlotsList } from "@/components/MySlotsList";
import { HeatmapCalendar } from "@/components/HeatmapCalendar";
import { SuggestedMeetings } from "@/components/SuggestedMeetings";
import { Button } from "@/components/ui/button";
import { CalendarClock, LogOut } from "lucide-react";

const Dashboard = () => {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">TeamSync</span>
            {profile && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Team {profile.team_id}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {profile && <span className="text-sm text-muted-foreground hidden sm:block">{profile.full_name}</span>}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6">
          {/* Left sidebar: Input + My Slots */}
          <aside className="space-y-6">
            <div className="glass-card rounded-xl p-5 space-y-6">
              <AddAvailabilityForm />
              <div className="border-t border-border/50" />
              <MySlotsList />
            </div>
          </aside>

          {/* Center: Heatmap */}
          <section className="glass-card rounded-xl p-5 min-w-0">
            <HeatmapCalendar />
          </section>

          {/* Right sidebar: Suggestions */}
          <aside>
            <div className="glass-card rounded-xl p-5">
              <SuggestedMeetings />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
