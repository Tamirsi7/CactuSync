import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useAvailabilities";
import { useTeams, useUpdateTeamName } from "@/hooks/useTeams";
import { useBookings } from "@/hooks/useBookings";
import { useIsAdmin } from "@/hooks/useAdmin";
import { AddAvailabilityForm } from "@/components/AddAvailabilityForm";
import { MySlotsList } from "@/components/MySlotsList";
import { HeatmapCalendar } from "@/components/HeatmapCalendar";
import { SuggestedMeetings } from "@/components/SuggestedMeetings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyTeam } from "@/components/MyTeam";
import { CalendarClock, LogOut, Pencil, Check, X, Shield, Users, Clock } from "lucide-react";
import { useState } from "react";
import { Navigate, Link } from "react-router-dom";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateTeamName = useUpdateTeamName();
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState("");
  const bookingsState = useBookings();
  const { data: isAdmin } = useIsAdmin();

  if (!user) return <Navigate to="/" replace />;

  const teamName = (profile as any)?.teams?.name || "No team";
  const teamUuid = profile?.team_uuid;

  const handleEditTeamName = () => {
    setTeamNameInput(teamName);
    setEditingTeamName(true);
  };

  const handleSaveTeamName = () => {
    if (teamUuid && teamNameInput.trim()) {
      updateTeamName.mutate({ id: teamUuid, name: teamNameInput.trim() });
    }
    setEditingTeamName(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">🌵 CactuSync</span>
            {profile && (
              <div className="flex items-center gap-1">
                {editingTeamName ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      className="h-6 text-xs w-32"
                      onKeyDown={(e) => e.key === "Enter" && handleSaveTeamName()}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveTeamName}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTeamName(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:bg-muted/80" onClick={handleEditTeamName}>
                    {teamName}
                    <Pencil className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <Shield className="w-4 h-4 mr-1" /> Admin
                </Button>
              </Link>
            )}
            {profile && <span className="text-sm text-muted-foreground hidden sm:block">{profile.full_name}</span>}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-[220px_1fr] gap-4">
          <aside className="space-y-4">
            <div className="glass-card rounded-xl p-4 space-y-4">
              <AddAvailabilityForm />
              <div className="border-t border-border/50" />
              <MySlotsList />
            </div>
          </aside>

          <div className="space-y-4 min-w-0">
            <section className="glass-card rounded-xl p-4">
              <HeatmapCalendar bookingsState={bookingsState} />
            </section>

            <section className="glass-card rounded-xl p-4">
              <SuggestedMeetings bookingsState={bookingsState} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
