import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTeams, useCreateTeam } from "@/hooks/useTeams";
import { CalendarClock, Users, Plus } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [teamUuid, setTeamUuid] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: teams } = useTeams();
  const createTeam = useCreateTeam();

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      // We need to be authenticated to create a team, so we'll handle this differently
      // For signup, we'll create the team inline
      setCreatingTeam(false);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      let finalTeamUuid = teamUuid;

      // If creating a new team, we need to create it after signup
      if (creatingTeam && newTeamName.trim()) {
        // Sign up first, then we'll create the team via trigger
        // We'll store team name in metadata and handle via a different approach
        // For now, create team with service role not possible from client
        // Instead: sign up without team, then create team and update profile
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName, team_uuid: creatingTeam ? null : finalTeamUuid || null },
        },
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (signUpData.user && creatingTeam && newTeamName.trim()) {
        // Create team and update profile
        const { data: team, error: teamErr } = await supabase
          .from("teams")
          .insert({ name: newTeamName.trim(), created_by: signUpData.user.id })
          .select()
          .single();

        if (!teamErr && team) {
          await supabase
            .from("profiles")
            .update({ team_uuid: team.id })
            .eq("user_id", signUpData.user.id);
        }
        toast({ title: "Account created!", description: "Welcome to CactuSync." });
      } else {
        toast({ title: "Account created!", description: "Welcome to CactuSync." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <CalendarClock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">🌵 CactuSync</h1>
          <p className="text-muted-foreground">Find the perfect meeting time for your team</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{isSignUp ? "Create account" : "Welcome back"}</CardTitle>
            <CardDescription>
              {isSignUp ? "Enter your details to get started" : "Sign in to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Johnson" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Team</Label>
                    {!creatingTeam ? (
                      <div className="space-y-2">
                        <Select value={teamUuid} onValueChange={setTeamUuid}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams?.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                <span className="flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5" /> {t.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setCreatingTeam(true)}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Create new team
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="Enter team name"
                          required
                        />
                        <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => { setCreatingTeam(false); setNewTeamName(""); }}>
                          Choose existing team instead
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
