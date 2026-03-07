import { useAuth } from "@/lib/auth-context";
import { useIsAdmin, useAllProfiles, useAllTeams, useDeleteProfile, useDeleteTeam, useUpdateProfile } from "@/hooks/useAdmin";
import { useUpdateTeamName } from "@/hooks/useTeams";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, ArrowLeft, Trash2, Pencil, Check, X, Users, User } from "lucide-react";
import { useState } from "react";

const Admin = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { data: profiles } = useAllProfiles();
  const { data: teams } = useAllTeams();
  const deleteProfile = useDeleteProfile();
  const deleteTeam = useDeleteTeam();
  const updateProfile = useUpdateProfile();
  const updateTeamName = useUpdateTeamName();

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userNameInput, setUserNameInput] = useState("");
  const [userTeamInput, setUserTeamInput] = useState<string | null>(null);

  if (!user) return <Navigate to="/" replace />;
  if (loadingAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const startEditTeam = (id: string, name: string) => {
    setEditingTeamId(id);
    setTeamNameInput(name);
  };

  const saveTeamName = () => {
    if (editingTeamId && teamNameInput.trim()) {
      updateTeamName.mutate({ id: editingTeamId, name: teamNameInput.trim() });
    }
    setEditingTeamId(null);
  };

  const startEditUser = (userId: string, name: string, teamUuid: string | null) => {
    setEditingUserId(userId);
    setUserNameInput(name);
    setUserTeamInput(teamUuid);
  };

  const saveUser = () => {
    if (editingUserId) {
      updateProfile.mutate({ userId: editingUserId, full_name: userNameInput, team_uuid: userTeamInput });
    }
    setEditingUserId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">🌵 CactuSync — Admin</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Teams Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Teams ({teams?.length || 0})
          </h2>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Members</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams?.map((t) => {
                  const memberCount = profiles?.filter((p: any) => p.team_uuid === t.id).length || 0;
                  return (
                    <tr key={t.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3">
                        {editingTeamId === t.id ? (
                          <div className="flex items-center gap-1">
                            <Input value={teamNameInput} onChange={(e) => setTeamNameInput(e.target.value)} className="h-7 text-sm w-48" onKeyDown={(e) => e.key === "Enter" && saveTeamName()} />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveTeamName}><Check className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTeamId(null)}><X className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <span className="font-medium">{t.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{memberCount}</td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditTeam(t.id, t.name)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTeam.mutate(t.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Users Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Users ({profiles?.length || 0})
          </h2>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Team</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles?.map((p: any) => (
                  <tr key={p.user_id} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-3">
                      {editingUserId === p.user_id ? (
                        <Input value={userNameInput} onChange={(e) => setUserNameInput(e.target.value)} className="h-7 text-sm w-48" />
                      ) : (
                        <span className="font-medium">{p.full_name || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.email || "—"}</td>
                    <td className="px-4 py-3">
                      {editingUserId === p.user_id ? (
                        <Select value={userTeamInput || "none"} onValueChange={(v) => setUserTeamInput(v === "none" ? null : v)}>
                          <SelectTrigger className="h-7 text-sm w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No team</SelectItem>
                            {teams?.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground">{p.teams?.name || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {editingUserId === p.user_id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveUser}><Check className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingUserId(null)}><X className="w-3 h-3" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditUser(p.user_id, p.full_name, p.team_uuid)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          {p.user_id !== user?.id && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProfile.mutate(p.user_id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Admin;
