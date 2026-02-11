import { useState, useMemo } from "react";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import EventCard from "@/components/EventCard";
import EventDetailModal from "@/components/EventDetailModal";
import { mockEvents, type RialoEvent, type EventCategory, type EventStatus } from "@/lib/events-data";

const STATUS_ORDER: EventStatus[] = ["live", "upcoming", "past"];

const Index = () => {
  const [category, setCategory] = useState<EventCategory | "All">("All");
  const [selectedEvent, setSelectedEvent] = useState<RialoEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");

  const filtered = useMemo(() => {
    let events = [...mockEvents];
    if (category !== "All") events = events.filter((e) => e.category === category);
    if (statusFilter !== "all") events = events.filter((e) => e.status === statusFilter);
    events.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
    return events;
  }, [category, statusFilter]);

  const counts = useMemo(() => {
    const base = category === "All" ? mockEvents : mockEvents.filter((e) => e.category === category);
    return {
      all: base.length,
      live: base.filter((e) => e.status === "live").length,
      upcoming: base.filter((e) => e.status === "upcoming").length,
      past: base.filter((e) => e.status === "past").length,
    };
  }, [category]);

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
        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {/* Status Tabs */}
        <div className="mb-8 flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
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

        {/* Event Grid */}
        {filtered.length > 0 ? (
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

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Rialo Community Event Hub · No more scattered links. No more missed events.
        </p>
      </footer>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

export default Index;
