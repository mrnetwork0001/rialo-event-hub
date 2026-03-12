import { useState, useMemo } from "react";
import type { DbEvent } from "@/lib/supabase-events";
import RemindMeDialog from "./RemindMeDialog";
import { Clock, MapPin, ExternalLink, Play, Bell } from "lucide-react";

interface EventCardNewProps {
  event: DbEvent;
  onSelect: (event: DbEvent) => void;
  view?: "grid" | "list";
}

function getCountdownLabel(dateStr: string): string | null {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `Live in ${days} day${days > 1 ? "s" : ""}`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `Live in ${hours}h`;
  const mins = Math.floor(diff / (1000 * 60));
  return `Live in ${mins}m`;
}

const categoryEmojis: Record<string, string> = {
  AMA: "🎤",
  "Quiz & Games": "🎮",
  "X Space": "🐦",
  Workshop: "🛠️",
  Meetup: "🤝",
  "Builders Showcase": "🏗️",
  Educational: "📚",
};

const EventCardNew = ({ event, onSelect, view = "grid" }: EventCardNewProps) => {
  const [remindOpen, setRemindOpen] = useState(false);

  const countdownLabel = useMemo(() => {
    if (event.status === "upcoming") return getCountdownLabel(event.event_date);
    if (event.status === "live") return "LIVE NOW";
    return null;
  }, [event.status, event.event_date]);

  const dateFormatted = new Date(event.event_date).toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    timeZoneName: "short",
  });

  if (view === "list") {
    return (
      <>
        <div
          onClick={() => onSelect(event)}
          className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-md"
        >
          {/* Thumbnail */}
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-secondary">
            {event.image_url ? (
              <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <span className="text-2xl">{categoryEmojis[event.category] || "📅"}</span>
              </div>
            )}
            {countdownLabel && (
              <span className={`absolute top-1.5 left-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${
                event.status === "live" ? "bg-red-600 animate-pulse" : "bg-green-600"
              }`}>
                {countdownLabel}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-primary">
              {categoryEmojis[event.category] || "📅"} {event.category}
            </span>
            <h3 className="font-display text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dateFormatted}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.platform}</span>
            </div>
          </div>

          <ActionButton event={event} onRemind={() => setRemindOpen(true)} />
        </div>
        <RemindMeDialog event={event} open={remindOpen} onOpenChange={setRemindOpen} />
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => onSelect(event)}
        className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
      >
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden bg-secondary">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[hsl(220,60%,25%)] via-[hsl(210,50%,30%)] to-[hsl(200,45%,35%)]">
              <span className="text-5xl opacity-80">{categoryEmojis[event.category] || "📅"}</span>
            </div>
          )}

          {/* Countdown badge */}
          {countdownLabel && (
            <span className={`absolute top-3 left-3 rounded-md px-2.5 py-1 text-xs font-bold text-white shadow-md ${
              event.status === "live"
                ? "bg-red-600 shadow-red-600/30 animate-pulse"
                : "bg-green-600 shadow-green-600/30"
            }`}>
              {countdownLabel}
            </span>
          )}

          {event.status === "past" && (
            <span className="absolute top-3 left-3 rounded-md bg-muted/80 px-2.5 py-1 text-xs font-bold text-muted-foreground backdrop-blur-sm">
              Past Event
            </span>
          )}

          {/* Gradient overlay at bottom for text on image */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Title on image */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display text-base font-bold text-white drop-shadow-lg line-clamp-2">
              {event.title}
            </h3>
            <p className="mt-0.5 text-xs text-white/70">
              {dateFormatted}
            </p>
          </div>
        </div>

        {/* Details below image */}
        <div className="p-4">
          <span className="text-xs font-medium text-primary">
            {categoryEmojis[event.category] || "📅"} {event.category}
          </span>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground/70" />
              {dateFormatted}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 text-muted-foreground/70" />
            {event.platform} · {event.host}
          </div>

          {/* Action button */}
          <div className="mt-3">
            <ActionButton event={event} onRemind={() => setRemindOpen(true)} />
          </div>
        </div>
      </div>
      <RemindMeDialog event={event} open={remindOpen} onOpenChange={setRemindOpen} />
    </>
  );
};

function ActionButton({ event, onRemind }: { event: DbEvent; onRemind: () => void }) {
  if (event.status === "live" && event.join_link) {
    return (
      <a
        href={event.join_link}
        target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Join Live
      </a>
    );
  }
  if (event.status === "upcoming") {
    return (
      <div className="flex gap-2">
        {event.join_link ? (
          <a
            href={event.join_link}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Join
          </a>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onRemind(); }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Bell className="h-3.5 w-3.5" /> Remind Me
          </button>
        )}
      </div>
    );
  }
  if (event.status === "past" && event.recording_link) {
    return (
      <a
        href={event.recording_link}
        target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
      >
        <Play className="h-3.5 w-3.5" /> View Recap
      </a>
    );
  }
  return null;
}

export default EventCardNew;
