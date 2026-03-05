import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import HeroBanner from "@/components/HeroBanner";
import LiveBanner from "@/components/LiveBanner";
import EventCardNew from "@/components/EventCardNew";
import EventDetailModal from "@/components/EventDetailModal";
import EmptyState from "@/components/EmptyState";
import StatsBar from "@/components/StatsBar";
import { fetchEvents, autoUpdateEventStatus, CATEGORIES, type DbEvent, type EventCategory, type EventStatus } from "@/lib/supabase-events";
import { LayoutGrid, List, Send, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_ORDER: EventStatus[] = ["live", "upcoming", "past"];
const EVENTS_PER_PAGE = 12;

const Index = () => {
  const [category, setCategory] = useState<EventCategory | "All">("All");
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    autoUpdateEventStatus()
      .catch(() => {})
      .then(() => fetchEvents())
      .then((data) => data && setEvents(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...events];
    if (category !== "All") list = list.filter((e) => e.category === category);
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (statusDiff !== 0) return statusDiff;
      if (a.status === "past") {
        return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      }
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });
    return list;
  }, [events, category, statusFilter]);

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

  const liveEvent = useMemo(() => events.find((e) => e.status === "live"), [events]);

  const statusTabs: { key: EventStatus | "all"; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "upcoming", label: "Upcoming", count: counts.upcoming },
    { key: "live", label: "Now", count: counts.live },
    { key: "past", label: "Past", count: counts.past },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content area */}
      <div className="lg:pl-56">
        {liveEvent && <LiveBanner event={liveEvent} onSelect={setSelectedEvent} />}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <HeroBanner />

          <div className="mt-6">
            <StatsBar events={events} />
          </div>

          {/* Submit event button */}
          <div className="mb-6">
            <Button size="sm" onClick={() => navigate("/submit-event")}>
              <Send className="h-4 w-4 mr-2" /> Submit Your Event
            </Button>
          </div>

          {/* Filters bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Status tabs */}
            <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium transition-all",
                    statusFilter === tab.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Category dropdown */}
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as EventCategory | "All")}
              >
                <SelectTrigger className="w-44 bg-card border-border">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div className="flex rounded-lg border border-border bg-card">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-l-lg transition-colors",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-r-lg transition-colors",
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Events grid/list */}
          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading events...</p>
                </div>
              </div>
            ) : paginatedEvents.length > 0 ? (
              <>
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "flex flex-col gap-3"
                  )}
                >
                  {paginatedEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                    >
                      <EventCardNew
                        event={event}
                        onSelect={setSelectedEvent}
                        view={viewMode}
                      />
                    </div>
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
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
                          currentPage === page
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:bg-secondary"
                        )}
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
              <EmptyState onClearFilters={() => { setCategory("All"); setStatusFilter("all"); }} />
            )}
          </div>
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
      </div>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

export default Index;
