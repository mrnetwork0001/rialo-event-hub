import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, Trophy, Users, Flame, Crown, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HostStat {
  host: string;
  event_count: number;
  total_rsvp: number;
}

interface TopEvent {
  id: string;
  title: string;
  host: string;
  rsvp_count: number;
  category: string;
  event_date: string;
  status: string;
}

const RANK_STYLES = [
  { bg: "bg-yellow-500/10 border-yellow-500/30", icon: Crown, iconColor: "text-yellow-500" },
  { bg: "bg-gray-300/10 border-gray-400/30", icon: Medal, iconColor: "text-gray-400" },
  { bg: "bg-amber-700/10 border-amber-700/30", icon: Medal, iconColor: "text-amber-700" },
];

const Leaderboard = () => {
  const navigate = useNavigate();
  const [hostStats, setHostStats] = useState<HostStat[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all approved events
      const { data: events, error } = await supabase
        .from("events")
        .select("id, title, host, rsvp_count, category, event_date, status")
        .eq("approval_status", "approved");

      if (error) throw error;

      // Aggregate host stats
      const hostMap = new Map<string, { event_count: number; total_rsvp: number }>();
      for (const event of events ?? []) {
        // Split hosts (some events have multiple hosts separated by commas or &)
        const hosts = event.host.split(/[,&]/).map((h: string) => h.trim()).filter(Boolean);
        for (const host of hosts) {
          const existing = hostMap.get(host) || { event_count: 0, total_rsvp: 0 };
          existing.event_count++;
          existing.total_rsvp += event.rsvp_count || 0;
          hostMap.set(host, existing);
        }
      }

      const sortedHosts = Array.from(hostMap.entries())
        .map(([host, stats]) => ({ host, ...stats }))
        .sort((a, b) => b.event_count - a.event_count)
        .slice(0, 10);

      // Top events by RSVP
      const sortedEvents = [...(events ?? [])]
        .sort((a, b) => (b.rsvp_count || 0) - (a.rsvp_count || 0))
        .slice(0, 10);

      setHostStats(sortedHosts);
      setTopEvents(sortedEvents);
    } catch (err) {
      console.error("Failed to load leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-56">
        <div className="mx-auto max-w-5xl px-6 py-8 pt-16 lg:pt-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground">Top hosts and most popular events in the Rialo community</p>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading leaderboard...</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Most Active Hosts */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Flame className="h-5 w-5 text-primary" />
                    Most Active Hosts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {hostStats.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                  ) : (
                    hostStats.map((host, i) => {
                      const rankStyle = RANK_STYLES[i] || { bg: "bg-secondary/50 border-border/50", icon: null, iconColor: "" };
                      return (
                        <div
                          key={host.host}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                            rankStyle.bg
                          )}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                            {rankStyle.icon ? (
                              <rankStyle.icon className={cn("h-4 w-4", rankStyle.iconColor)} />
                            ) : (
                              <span>{i + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{host.host}</p>
                            <p className="text-xs text-muted-foreground">
                              {host.event_count} event{host.event_count !== 1 ? "s" : ""} · {host.total_rsvp} RSVPs
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Most Attended Events */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Most Attended Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                  ) : (
                    topEvents.map((event, i) => {
                      const rankStyle = RANK_STYLES[i] || { bg: "bg-secondary/50 border-border/50", icon: null, iconColor: "" };
                      return (
                        <div
                          key={event.id}
                          onClick={() => navigate(`/event/${event.id}`)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors",
                            rankStyle.bg
                          )}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                            {rankStyle.icon ? (
                              <rankStyle.icon className={cn("h-4 w-4", rankStyle.iconColor)} />
                            ) : (
                              <span>{i + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.host} · {event.rsvp_count} RSVPs
                            </p>
                          </div>
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground shrink-0">
                            {event.category}
                          </span>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
