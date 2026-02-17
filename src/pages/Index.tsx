import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import EventCard from "@/components/EventCard";
import EventDetailModal from "@/components/EventDetailModal";
import { fetchEvents, autoUpdateEventStatus, getSiteSetting, CATEGORIES, type DbEvent, type EventCategory, type EventStatus } from "@/lib/supabase-events";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

const STATUS_ORDER: EventStatus[] = ["live", "upcoming", "past"];
const EVENTS_PER_PAGE = 12;

const Index = () => {
  const [category, setCategory] = useState<EventCategory | "All">("All");
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitEventUrl, setSubmitEventUrl] = useState<string>("");
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-update event statuses then fetch
    autoUpdateEventStatus()
      .catch(() => {})
      .then(() => fetchEvents())
      .then((data) => data && setEvents(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    
    getSiteSetting("submit_event_url").then(setSubmitEventUrl).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = [...events];
    if (category !== "All") list = list.filter((e) => e.category === category);
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    // Pinned first, then by status order
    list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (statusDiff !== 0) return statusDiff;
      // Within same status: upcoming/live ascending (soonest first), past descending (most recent first)
      if (a.status === "past") {
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      }
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });
    return list;
  }, [events, category, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, statusFilter]);

  const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const paginatedEvents = filtered.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  const counts = useMemo(() => {
    const base = category === "All" ? events : events.filter((e) => e.category === category);
    return {
      all: base.length,
      live: base.filter((e) => e.status === "live").length,
      upcoming: base.filter((e) => e.status === "upcoming").length,
      past: base.filter((e) => e.status === "past").length,
    };
  }, [events, category]);

  const statusTabs: { key: EventStatus | "all"; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "live", label: `Live (${counts.live})` },
    { key: "upcoming", label: `Upcoming (${counts.upcoming})` },
    { key: "past", label: `Past (${counts.past})` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* Submit Event button */}
        <div className="mb-4">
          {submitEventUrl && (
            <Button size="sm" onClick={() => window.open(submitEventUrl, "_blank")}>
              <Send className="h-4 w-4 mr-2" /> Submit Your Event
            </Button>
          )}
        </div>

        <div className="sticky top-0 z-30 -mx-6 px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="mb-4">
            <CategoryFilter selected={category} onSelect={setCategory} />
          </div>

          <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  statusFilter === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6" />

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : paginatedEvents.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedEvents.map((event) => (
                <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">No events found</p>
            <p className="text-sm text-muted-foreground/70">Try adjusting your filters</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Rialo Community Event Hub · No more scattered links. No more missed events.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Built by{" "}
          <a href="https://x.com/encrypt_wizard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            MrNetwork
          </a>
        </p>
      </footer>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <ChatWidget />
    </div>
  );
};

export default Index;
