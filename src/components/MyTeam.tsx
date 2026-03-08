import { useProfile } from "@/hooks/useAvailabilities";
import { useTeamMembers, useLeaveTeam } from "@/hooks/useTeamMembers";
import { useTeams } from "@/hooks/useTeams";
import { useMyJoinRequests, useCreateJoinRequest } from "@/hooks/useJoinRequests";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, LogOut, Calendar, Mail, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export function MyTeam() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const teamUuid = profile?.team_uuid;
  const teamName = (profile as any)?.teams?.name || "No team";
  const { data: members, isLoading } = useTeamMembers(teamUuid ?? undefined);
  const leaveTeam = useLeaveTeam();

  if (!teamUuid) {
    return <JoinTeamView />;
  }

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Team header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{teamName}</h3>
            <p className="text-xs text-muted-foreground">
              {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Leave
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave team?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll lose access to the team's shared calendar and availability data. You can request to rejoin later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => leaveTeam.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Leave team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Members</h4>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-1">
            {members?.map((m) => {
              const isYou = m.user_id === user?.id;
              return (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {initials(m.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {m.full_name || "Unnamed"}
                      </span>
                      {isYou && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{m.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(m.created_at), "MMM d")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-semibold text-foreground">{members?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total Members</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-semibold text-foreground">
            {members?.length ? format(new Date(Math.min(...members.map((m) => new Date(m.created_at).getTime()))), "MMM yyyy") : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Team Since</p>
        </div>
      </div>
    </div>
  );
}

function JoinTeamView() {
  const { data: teams, isLoading: loadingTeams } = useTeams();
  const { data: myRequests } = useMyJoinRequests();
  const createRequest = useCreateJoinRequest();

  const pendingTeamIds = new Set(
    myRequests?.filter((r: any) => r.status === "pending").map((r: any) => r.team_id) ?? []
  );

  const statusIcon = (status: string) => {
    if (status === "pending") return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
    if (status === "approved") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    return <XCircle className="w-3.5 h-3.5 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-2 pb-2">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Users className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Join a Team</h3>
        <p className="text-muted-foreground text-xs max-w-[260px]">
          You're not part of any team yet. Request to join one below — an admin will review your request.
        </p>
      </div>

      {/* Available teams */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available Teams</h4>
        {loadingTeams ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !teams?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No teams available yet.</p>
        ) : (
          <div className="space-y-1.5">
            {teams.map((t) => {
              const isPending = pendingTeamIds.has(t.id);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{t.name}</span>
                  </div>
                  {isPending ? (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="w-3 h-3" /> Pending
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => createRequest.mutate(t.id)}
                      disabled={createRequest.isPending}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Ask to Join
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My requests history */}
      {myRequests && myRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">My Requests</h4>
          <div className="space-y-1">
            {myRequests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {statusIcon(r.status)}
                  <span className="text-sm text-foreground">{r.teams?.name ?? "Unknown"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}
                    className="text-[10px] capitalize"
                  >
                    {r.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "MMM d")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
