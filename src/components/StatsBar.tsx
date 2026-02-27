import { useMemo } from "react";
import { Calendar, Users, Clock } from "lucide-react";
import type { DbEvent } from "@/lib/supabase-events";

interface StatsBarProps {
  events: DbEvent[];
}

function getNextEventCountdown(events: DbEvent[]): string {
  const now = Date.now();
  const upcoming = events
    .filter((e) => e.status === "upcoming" || e.status === "live")
    .map((e) => new Date(e.event_date).getTime())
    .filter((t) => t > now)
    .sort((a, b) => a - b);

  if (upcoming.length === 0) return "TBD";

  const diff = upcoming[0] - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h`;
}

const StatsBar = ({ events }: StatsBarProps) => {
  const countdown = useMemo(() => getNextEventCountdown(events), [events]);

  const stats = [
    { icon: Calendar, label: "Total Events", value: events.length.toLocaleString() },
    { icon: Users, label: "Community Members", value: "5k+" },
    { icon: Clock, label: "Next Event in", value: countdown },
  ];

  return (
    <div className="mb-6 rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-4">
          {i > 0 && (
            <div className="hidden sm:block h-4 w-px bg-border/60" />
          )}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <stat.icon className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-xs text-muted-foreground">{stat.label}:</span>
            <span className="text-xs font-semibold text-foreground">{stat.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
