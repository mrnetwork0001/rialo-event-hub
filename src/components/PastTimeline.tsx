import { useState } from "react";
import type { DbEvent } from "@/lib/supabase-events";
import { Calendar, MapPin, Users, Play, ChevronLeft, ChevronRight } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

interface PastTimelineProps {
  events: DbEvent[];
  onSelect: (event: DbEvent) => void;
}

const PAST_PER_PAGE = 8;

const PastTimeline = ({ events, onSelect }: PastTimelineProps) => {
  const [page, setPage] = useState(1);
  if (events.length === 0) return null;

  const totalPages = Math.ceil(events.length / PAST_PER_PAGE);
  const paged = events.slice((page - 1) * PAST_PER_PAGE, page * PAST_PER_PAGE);

  return (
    <div className="relative mt-8">
      {/* Glowing center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent timeline-glow-line">
        {/* Traveling orb */}
        <div className="timeline-orb absolute left-1/2 -translate-x-1/2 h-4 w-4 -ml-px">
          <span className="absolute inset-0 rounded-full bg-primary/40 blur-md" />
          <span className="absolute inset-1 rounded-full bg-primary shadow-[0_0_12px_hsl(38,92%,50%,0.7)]" />
        </div>
      </div>

      <div className="space-y-0">
        {paged.map((event, index) => {
          const isLeft = index % 2 === 0;

          return (
            <div
              key={event.id}
              className="relative flex items-start animate-fade-in"
              style={{
                animationDelay: `${index * 120}ms`,
                animationFillMode: "both",
              }}
            >
              {/* Left content */}
              <div className={`w-1/2 pr-8 ${isLeft ? "" : "invisible"}`}>
                {isLeft && (
                  <TimelineCard event={event} onSelect={onSelect} align="right" />
                )}
              </div>

              {/* Center node */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                <HoverCard openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={() => onSelect(event)}
                      className="group relative flex h-5 w-5 items-center justify-center"
                    >
                      <span className="absolute h-5 w-5 rounded-full bg-primary/20 group-hover:bg-primary/40 group-hover:scale-[2] transition-all duration-300" />
                      <span className="relative h-3 w-3 rounded-full bg-primary border-2 border-background group-hover:bg-primary group-hover:shadow-[0_0_12px_hsl(38,92%,50%,0.6)] transition-all duration-300" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side={isLeft ? "right" : "left"}
                    className="w-72 border-primary/20 bg-card/95 backdrop-blur-md"
                  >
                    <div className="space-y-2">
                      <h4 className="font-display text-sm font-semibold text-foreground">
                        {event.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {event.recap_summary || event.description}
                      </p>
                      {event.recording_link && (
                        <a
                          href={event.recording_link}
                          target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Play className="h-3 w-3" /> View Recap
                        </a>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              {/* Right content */}
              <div className={`w-1/2 pl-8 ${isLeft ? "invisible" : ""}`}>
                {!isLeft && (
                  <TimelineCard event={event} onSelect={onSelect} align="left" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                page === p
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

function TimelineCard({
  event,
  onSelect,
  align,
}: {
  event: DbEvent;
  onSelect: (e: DbEvent) => void;
  align: "left" | "right";
}) {
  return (
    <div
      onClick={() => onSelect(event)}
      className={`group cursor-pointer rounded-xl border border-border bg-card p-4 card-hover ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {/* Image */}
      <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg bg-secondary">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-2xl font-display font-bold text-primary/20">
              {event.category.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <span className="mb-1 inline-block rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {event.category}
      </span>

      <h3 className="mb-1 font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
        {event.title}
      </h3>

      <div className={`space-y-1 ${align === "right" ? "flex flex-col items-end" : ""}`}>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 text-primary/70" />
          <span>
            {new Date(event.event_date).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3 text-primary/70" />
          <span>{event.host}</span>
        </div>
      </div>

      {event.recording_link && (
        <a
          href={event.recording_link}
          onClick={(e) => e.stopPropagation()}
          className={`mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/30 transition-colors`}
        >
          <Play className="h-3 w-3" /> View Recap
        </a>
      )}
    </div>
  );
}

export default PastTimeline;
