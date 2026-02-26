import type { DbEvent } from "@/lib/supabase-events";
import StatusBadge from "./StatusBadge";
import { Calendar, MapPin, Users, ExternalLink, Star } from "lucide-react";

interface FeaturedEventProps {
  event: DbEvent;
  onSelect: (event: DbEvent) => void;
}

const FeaturedEvent = ({ event, onSelect }: FeaturedEventProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-4 w-4 text-primary fill-primary" />
        <span className="text-sm font-semibold text-primary tracking-wide">Featured Event</span>
      </div>

      <div
        onClick={() => onSelect(event)}
        className="group relative cursor-pointer rounded-xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_40px_-10px_hsl(38,92%,50%,0.25)]"
      >
        <div className="flex flex-col sm:flex-row gap-5 p-5">
          {/* Image */}
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-secondary self-center sm:self-start">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <span className="text-2xl font-display font-bold text-primary/30">
                  {event.category.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5">
              <StatusBadge status={event.status} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary/70" />
                    {event.host}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary/70" />
                    {event.platform}
                  </span>
                </div>
              </div>

              {event.status === "live" && event.join_link && (
                <a
                  href={event.join_link}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-lg border border-live/40 bg-live/10 px-3 py-1.5 text-sm font-semibold text-live hover:bg-live/20 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Join Live
                </a>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {event.description}
            </p>

            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-md bg-secondary px-2 py-0.5 font-medium">
                {event.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary/70" />
                {new Date(event.event_date).toLocaleString(undefined, {
                  month: "short", day: "numeric", year: "numeric",
                  hour: "numeric", minute: "2-digit", timeZoneName: "short",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedEvent;
