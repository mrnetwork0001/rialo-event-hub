import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import EventCard from "@/components/EventCard";
import EventDetailModal from "@/components/EventDetailModal";
import { fetchEvents, CATEGORIES, type DbEvent, type EventCategory, type EventStatus } from "@/lib/supabase-events";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const STATUS_ORDER: EventStatus[] = ["live", "upcoming", "past"];

const Index = () => {
  const [category, setCategory] = useState<EventCategory | "All">("All");
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...events];
    if (category !== "All") list = list.filter((e) => e.category === category);
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    // Pinned first, then by status order
    list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    });
    return list;
  }, [events, category, statusFilter]);

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
        {/* Admin link */}
        {isAdmin && (
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <Settings className="h-4 w-4 mr-2" /> Admin Panel
            </Button>
          </div>
        )}

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
        ) : filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />
            ))}
          </div>
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
    </div>
  );
};

export default Index;
