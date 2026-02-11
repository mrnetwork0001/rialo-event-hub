import type { RialoEvent } from "@/lib/events-data";
import StatusBadge from "./StatusBadge";
import CountdownTimer from "./CountdownTimer";
import { Calendar, MapPin, Users, ExternalLink, Play } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: RialoEvent;
  onSelect: (event: RialoEvent) => void;
}

const EventCard = ({ event, onSelect }: EventCardProps) => {
  return (
    <div
      onClick={() => onSelect(event)}
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 card-hover"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {event.category}
        </span>
        <StatusBadge status={event.status} />
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
          <span>{format(new Date(event.date), "MMM d, yyyy · h:mm a 'UTC'")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary/70" />
          <span>{event.platform}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-primary/70" />
          <span>{event.rsvpCount} RSVPs · Hosted by {event.host}</span>
        </div>
      </div>

      {event.status === "upcoming" && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Starts in</span>
          <CountdownTimer targetDate={event.date} />
        </div>
      )}

      {event.status === "live" && event.joinLink && (
        <a
          href={event.joinLink}
          onClick={(e) => e.stopPropagation()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-live/20 border border-live/40 py-2.5 text-sm font-semibold text-live hover:bg-live/30 transition-colors"
        >
          <ExternalLink className="h-4 w-4" /> Join Live Now
        </a>
      )}

      {event.status === "past" && event.recordingLink && (
        <a
          href={event.recordingLink}
          onClick={(e) => e.stopPropagation()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary border border-border py-2.5 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
        >
          <Play className="h-4 w-4" /> Watch Recording
        </a>
      )}
    </div>
  );
};

export default EventCard;
