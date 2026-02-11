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

const Index = () => {
  const [category, setCategory] = useState<EventCategory | "All">("All");
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);
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
    return list;
  }, [events, category]);

  const upcomingEvents = useMemo(() => {
    const list = filtered.filter((e) => e.status === "upcoming" || e.status === "live");
    // Pinned first, then by date ascending (soonest first)
    list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });
    return list;
  }, [filtered]);

  const pastEvents = useMemo(() => {
    const list = filtered.filter((e) => e.status === "past");
    // Pinned first, then by date descending (most recent first)
    list.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });
    return list;
  }, [filtered]);

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

        <div className="mb-8">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : (
          <>
            {/* Upcoming & Live Events */}
            <section className="mb-12">
              <h2 className="mb-6 font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-upcoming" />
                Upcoming Events
                <span className="text-sm font-normal text-muted-foreground ml-2">({upcomingEvents.length})</span>
              </h2>
              {upcomingEvents.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card/50 py-12 text-center">
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </section>

            {/* Past Events */}
            <section>
              <h2 className="mb-6 font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-past" />
                Past Events
                <span className="text-sm font-normal text-muted-foreground ml-2">({pastEvents.length})</span>
              </h2>
              {pastEvents.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card/50 py-12 text-center">
                  <p className="text-muted-foreground">No past events yet</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

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
