import { useMemo, useState, useEffect } from "react";
import { Calendar, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DbEvent } from "@/lib/supabase-events";

interface StatsBarProps {
  events: DbEvent[];
}

function getNextEventDate(events: DbEvent[]): number | null {
  const now = Date.now();
  const upcoming = events
    .filter((e) => e.status === "upcoming" || e.status === "live")
    .map((e) => new Date(e.event_date).getTime())
    .filter((t) => t > now)
    .sort((a, b) => a - b);
  return upcoming.length > 0 ? upcoming[0] : null;
}

function formatCountdown(target: number | null): string {
  if (!target) return "TBD";
  const diff = target - Date.now();
  if (diff <= 0) return "Now!";
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

/** Simple hash of a string for anonymous visitor tracking */
async function getVisitorHash(): Promise<string> {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const StatsBar = ({ events }: StatsBarProps) => {
  const nextDate = useMemo(() => getNextEventDate(events), [events]);
  const [countdown, setCountdown] = useState(() => formatCountdown(nextDate));
  const [visitorCount, setVisitorCount] = useState<string>("...");

  // Track visit & fetch count
  useEffect(() => {
    (async () => {
      try {
        const hash = await getVisitorHash();
        // Record visit (ignore errors for duplicates etc.)
        await supabase.from("site_visits").insert({ visitor_hash: hash });
      } catch {
        // silent
      }
      try {
        const { data } = await supabase.rpc("get_visitor_count");
        if (data != null) {
          const count = Number(data);
          setVisitorCount(count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k+` : String(count));
        }
      } catch {
        setVisitorCount("—");
      }
    })();
  }, []);

  useEffect(() => {
    if (!nextDate) return;
    setCountdown(formatCountdown(nextDate));
    const interval = setInterval(() => setCountdown(formatCountdown(nextDate)), 1000);
    return () => clearInterval(interval);
  }, [nextDate]);

  const stats = [
    { icon: Calendar, label: "Total Events", value: events.length.toLocaleString() },
    { icon: Users, label: "Community Members", value: visitorCount },
    { icon: Clock, label: "Next Event in", value: countdown },
  ];

  const StatContent = () => (
    <div className="flex items-center justify-center gap-8 px-4 min-w-full shrink-0">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-4">
          {i > 0 && <div className="h-4 w-px bg-border/60" />}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <stat.icon className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-xs text-muted-foreground">{stat.label}:</span>
            <span className="text-xs font-semibold text-foreground">{stat.value}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mb-6 rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm py-2.5 overflow-hidden group">
      <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
        <StatContent />
        <StatContent />
      </div>
    </div>
  );
};

export default StatsBar;
