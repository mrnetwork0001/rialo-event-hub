import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { DbEvent } from "@/lib/supabase-events";
import Sidebar from "@/components/Sidebar";
import CountdownTimer from "@/components/CountdownTimer";
import StatusBadge from "@/components/StatusBadge";
import { ArrowLeft, Calendar, MapPin, Users, ExternalLink, Play, Share2, Bell, CalendarPlus, Linkedin, Twitter, Mail } from "lucide-react";
import RemindMeDialog from "@/components/RemindMeDialog";
import EventComments from "@/components/EventComments";

const categoryEmojis: Record<string, string> = {
  AMA: "🎤",
  "Quiz & Games": "🎮",
  "X Space": "🐦",
  Workshop: "🛠️",
  Meetup: "🤝",
  "Builders Showcase": "🏗️",
  Educational: "📚",
};

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

function generateCalendarUrl(event: DbEvent): string {
  const start = new Date(event.event_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.platform)}`;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [remindOpen, setRemindOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setEvent(data as unknown as DbEvent);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-56 flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-56 flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">Event not found.</p>
          <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">← Back to events</button>
        </div>
      </div>
    );
  }

  const dateFormatted = new Date(event.event_date).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const timeRange = new Date(event.event_date).toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const shortDate = new Date(event.event_date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const countdownLabel = event.status === "upcoming" ? getCountdownLabel(event.event_date) : event.status === "live" ? "LIVE NOW" : null;

  const shareUrl = event.share_link || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = `Check out: ${event.title}`;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-56">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </button>

          {/* Hero section - image left, details right */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left - Event Image */}
              <div className="relative h-64 md:h-auto md:min-h-[320px] bg-gradient-to-br from-[hsl(220,60%,20%)] via-[hsl(210,50%,25%)] to-[hsl(200,45%,30%)]">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-7xl opacity-60">{categoryEmojis[event.category] || "📅"}</span>
                  </div>
                )}
                {/* Status overlay */}
                <div className="absolute top-4 left-4">
                  <StatusBadge status={event.status} />
                </div>
              </div>

              {/* Right - Event info */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {event.status === "live" ? "🔴 LIVE" : event.status === "upcoming" ? "📡 LIVESTREAM" : "📁 PAST"}
                  </span>
                </div>

                <p className="text-sm text-primary font-medium mb-1">
                  {timeRange}, {shortDate}
                </p>

                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {event.title}
                </h1>

                {/* Action + Countdown row */}
                <div className="flex flex-wrap items-center gap-4">
                  {event.status === "live" && event.join_link && (
                    <a
                      href={event.join_link}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                    >
                      <ExternalLink className="h-4 w-4" /> Join Live
                    </a>
                  )}
                  {event.status === "upcoming" && event.join_link && (
                    <a
                      href={event.join_link}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      Join
                    </a>
                  )}
                  {event.status === "past" && event.recording_link && (
                    <a
                      href={event.recording_link}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <Play className="h-4 w-4" /> View Recording
                    </a>
                  )}

                  {event.status === "upcoming" && (
                    <CountdownTimer targetDate={event.event_date} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content section - description left, sidebar right */}
          <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8">
            {/* Left - Description & tags */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {/* Category tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  # {event.category.toUpperCase()}
                </span>
                <span className="rounded-full border border-green-500/20 bg-green-500/5 px-3 py-1 text-xs font-medium text-green-400">
                  # {event.platform.toUpperCase()}
                </span>
                <span className="rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1 text-xs font-medium text-rose-400">
                  # COMMUNITY
                </span>
              </div>

              {/* Description */}
              <p className="text-sm md:text-base leading-relaxed text-secondary-foreground whitespace-pre-wrap">
                {event.description}
              </p>

              {/* Recap section for past events */}
              {event.status === "past" && event.recap_summary && (
                <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
                    <Play className="h-5 w-5 text-primary" />
                    Event Recap
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-secondary-foreground whitespace-pre-wrap">
                    {event.recap_summary}
                  </p>
                  {event.recording_link && (
                    <a
                      href={event.recording_link}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      <Play className="h-4 w-4" /> Watch the full recording →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Comments section */}
            <EventComments eventId={event.id} />

            {/* Right - Sidebar info */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-6">
                {/* Countdown or date info */}
                <div className="flex items-start gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {countdownLabel || "Event ended"}
                    </p>
                    <p className="text-sm text-muted-foreground">{dateFormatted}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{event.platform}</span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">Hosted by {event.host}</span>
                </div>

                {/* Primary action */}
                {event.status === "live" && event.join_link && (
                  <a
                    href={event.join_link}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> Join Live
                  </a>
                )}
                {event.status === "upcoming" && event.join_link && (
                  <a
                    href={event.join_link}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Register
                  </a>
                )}
                {event.status === "upcoming" && !event.join_link && (
                  <button
                    onClick={() => setRemindOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Bell className="h-4 w-4" /> Remind Me
                  </button>
                )}
                {event.status === "past" && event.recording_link && (
                  <a
                    href={event.recording_link}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Play className="h-4 w-4" /> View Recording
                  </a>
                )}

                {/* Add to calendar */}
                {event.status === "upcoming" && (
                  <a
                    href={generateCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <CalendarPlus className="h-4 w-4" /> Add to calendar
                  </a>
                )}

                {/* Remind me for upcoming */}
                {event.status === "upcoming" && event.join_link && (
                  <button
                    onClick={() => setRemindOpen(true)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Bell className="h-4 w-4" /> Remind Me
                  </button>
                )}

                {/* Share */}
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">Share</p>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                    <a
                      href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(shareText + "\n" + shareUrl)}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <RemindMeDialog event={event} open={remindOpen} onOpenChange={setRemindOpen} />
    </div>
  );
};

export default EventDetail;
