import type { DbEvent } from "@/lib/supabase-events";
import StatusBadge from "./StatusBadge";
import CountdownTimer from "./CountdownTimer";
import { Calendar, MapPin, Users, ExternalLink, Play, Share2, X } from "lucide-react";
import { format } from "date-fns";

interface EventDetailModalProps {
  event: DbEvent | null;
  onClose: () => void;
}

const EventDetailModal = ({ event, onClose }: EventDetailModalProps) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {event.category}
          </span>
          <StatusBadge status={event.status} />
        </div>

        <h2 className="mb-2 font-display text-2xl font-bold text-foreground">{event.title}</h2>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary/70" />
            <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy 'at' h:mm a 'UTC'")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary/70" />
            <span>{event.platform}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary/70" />
            <span>{event.rsvp_count} RSVPs · Hosted by {event.host}</span>
          </div>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-secondary-foreground">{event.description}</p>

        {event.status === "upcoming" && (
          <div className="mb-5 rounded-lg border border-border bg-secondary/50 p-4">
            <span className="mb-2 block text-xs text-muted-foreground uppercase tracking-wider">Countdown</span>
            <CountdownTimer targetDate={event.event_date} />
          </div>
        )}

        {event.recap_summary && (
          <div className="mb-5 rounded-lg border border-border bg-secondary/50 p-4">
            <span className="mb-2 block text-xs text-primary uppercase tracking-wider font-semibold">Recap</span>
            <p className="text-sm text-secondary-foreground leading-relaxed">{event.recap_summary}</p>
          </div>
        )}

        <div className="flex gap-3">
          {event.status === "live" && event.join_link && (
            <a
              href={event.join_link}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-live text-live-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="h-4 w-4" /> Join Live
            </a>
          )}
          {event.status === "upcoming" && event.join_link && (
            <a
              href={event.join_link}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="h-4 w-4" /> RSVP / Join
            </a>
          )}
          {event.status === "past" && event.recording_link && (
            <a
              href={event.recording_link}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Play className="h-4 w-4" /> Watch Recording
            </a>
          )}
          {event.share_link && (
            <a
              href={event.share_link}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
