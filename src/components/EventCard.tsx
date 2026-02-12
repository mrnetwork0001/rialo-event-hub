import type { DbEvent } from "@/lib/supabase-events";
import StatusBadge from "./StatusBadge";
import CountdownTimer from "./CountdownTimer";
import { Calendar, MapPin, Users, ExternalLink, Play, Pin } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: DbEvent;
  onSelect: (event: DbEvent) => void;
}

const EventCard = ({ event, onSelect }: EventCardProps) => {
  return (
    <div
      onClick={() => onSelect(event)}
      className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden card-hover"
    >
      {/* Event Image */}
      <div className="relative h-40 w-full overflow-hidden bg-secondary">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-3xl font-display font-bold text-primary/20">
              {event.category.charAt(0)}
            </span>
          </div>
        )}
        {event.is_pinned && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-xs font-semibold text-primary-foreground">
            <Pin className="h-3 w-3" /> Pinned
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusBadge status={event.status} />
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2">
          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {event.category}
          </span>
        </div>

        <h3 className="mb-2 font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {event.description}
        </p>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary/70" />
            <span>{format(new Date(event.event_date), "MMM d, yyyy · h:mm a 'UTC'")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary/70" />
            <span>{event.platform}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary/70" />
            <span>Hosted by {event.host}</span>
          </div>
        </div>

        {(event.status === "upcoming" || event.status === "live") && event.status === "upcoming" && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Starts in</span>
            <CountdownTimer targetDate={event.event_date} />
          </div>
        )}

        {event.status === "live" && event.join_link && (
          <a
            href={event.join_link}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-live/20 border border-live/40 py-2.5 text-sm font-semibold text-live hover:bg-live/30 transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Join Live Now
          </a>
        )}

        {event.status === "past" && event.recording_link && (
          <a
            href={event.recording_link}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary border border-border py-2.5 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
          >
            <Play className="h-4 w-4" /> View Recap
          </a>
        )}
      </div>
    </div>
  );
};

export default EventCard;
