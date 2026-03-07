import { useProfile } from "@/hooks/useAvailabilities";
import { useTeamMembers, useLeaveTeam } from "@/hooks/useTeamMembers";
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
import { Users, LogOut, Crown, Calendar, Mail } from "lucide-react";
import { format } from "date-fns";

export function MyTeam() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const teamUuid = profile?.team_uuid;
  const teamName = (profile as any)?.teams?.name || "No team";
  const { data: members, isLoading } = useTeamMembers(teamUuid ?? undefined);
  const leaveTeam = useLeaveTeam();

  if (!teamUuid) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Users className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">You're not part of any team yet.</p>
        <p className="text-muted-foreground text-xs">Join or create a team to collaborate with others.</p>
      </div>
    );
  }

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const isCreator = (profile as any)?.teams?.created_by === user?.id;

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
                You'll lose access to the team's shared calendar and availability data. You can rejoin later.
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
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(m.created_at), "MMM d, yyyy")}</span>
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
            {members ? format(new Date(Math.min(...members.map((m) => new Date(m.created_at).getTime()))), "MMM yyyy") : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Team Since</p>
        </div>
      </div>
    </div>
  );
}
