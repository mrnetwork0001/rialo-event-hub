import type { DbEvent } from "@/lib/supabase-events";
import { ExternalLink, Radio } from "lucide-react";

interface LiveBannerProps {
  event: DbEvent;
  onSelect: (event: DbEvent) => void;
}

const LiveBanner = ({ event, onSelect }: LiveBannerProps) => {
  return (
    <div className="relative overflow-hidden bg-destructive/10 border-b border-destructive/20">
      <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 via-destructive/10 to-destructive/5 animate-pulse" />
      <div
        onClick={() => onSelect(event)}
        className="relative mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4 cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-destructive-foreground">
            <Radio className="h-3 w-3 animate-pulse" />
            Happening Now
          </span>
          <span className="truncate font-display font-semibold text-foreground group-hover:text-primary transition-colors">
            {event.title}
          </span>
          <span className="hidden sm:inline text-sm text-muted-foreground">
            · {event.host} on {event.platform}
          </span>
        </div>

        {event.join_link && (
          <a
            href={event.join_link}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/25 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Join
          </a>
        )}
      </div>
    </div>
  );
};

export default LiveBanner;
