import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { fetchEvents, type DbEvent, type EventCategory, CATEGORIES } from "@/lib/supabase-events";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  live: "bg-red-500",
  upcoming: "bg-primary",
  past: "bg-muted-foreground/50",
};

const CalendarView = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<EventCategory | "All">("All");

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (category === "All") return events;
    return events.filter((e) => e.category === category);
  }, [events, category]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Map events to dates
  const eventsByDate = useMemo(() => {
    const map = new Map<string, DbEvent[]>();
    filtered.forEach((event) => {
      const key = format(new Date(event.event_date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [filtered]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return eventsByDate.get(key) || [];
  }, [selectedDate, eventsByDate]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="lg:pl-56">
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 pt-16 lg:pt-6">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                Community Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse all events at a glance
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="min-w-[160px] text-center text-lg font-semibold text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
                className="ml-2 text-xs"
              >
                Today
              </Button>
            </div>

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
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Grid */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Week day headers */}
                  <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
                    {weekDays.map((d) => (
                      <div
                        key={d}
                        className="py-2 text-center text-xs font-medium text-muted-foreground"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day) => {
                      const key = format(day, "yyyy-MM-dd");
                      const dayEvents = eventsByDate.get(key) || [];
                      const inMonth = isSameMonth(day, currentMonth);
                      const today = isToday(day);
                      const selected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "relative flex flex-col items-center min-h-[72px] sm:min-h-[80px] border-b border-r border-border/40 p-1.5 transition-colors hover:bg-secondary/50",
                            !inMonth && "opacity-30",
                            selected && "bg-primary/10 ring-1 ring-primary/30",
                            today && !selected && "bg-accent/30"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                              today && "bg-primary text-primary-foreground",
                              !today && "text-foreground"
                            )}
                          >
                            {format(day, "d")}
                          </span>

                          {/* Event dots */}
                          {dayEvents.length > 0 && (
                            <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                              {dayEvents.slice(0, 3).map((ev) => (
                                <div
                                  key={ev.id}
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    STATUS_COLORS[ev.status]
                                  )}
                                  title={ev.title}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <span className="text-[9px] text-muted-foreground">
                                  +{dayEvents.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Mini event labels on larger screens */}
                          <div className="hidden sm:flex flex-col w-full mt-0.5 gap-0.5">
                            {dayEvents.slice(0, 2).map((ev) => (
                              <div
                                key={ev.id}
                                className={cn(
                                  "truncate rounded px-1 text-[9px] font-medium leading-tight",
                                  ev.status === "live"
                                    ? "bg-red-500/20 text-red-400"
                                    : ev.status === "upcoming"
                                    ? "bg-primary/15 text-primary"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {ev.title}
                              </div>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Live
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Upcoming
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                    Past
                  </div>
                </div>
              </div>

              {/* Selected Day Panel */}
              <div className="lg:col-span-1">
                <div className="rounded-xl border border-border bg-card p-4 sticky top-20">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    {selectedDate
                      ? format(selectedDate, "EEEE, MMMM d, yyyy")
                      : "Select a date"}
                  </h3>

                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground">
                      Click on a date to see its events
                    </p>
                  ) : selectedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No events on this day
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {selectedEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => navigate(`/event/${event.id}`)}
                          className="w-full text-left rounded-lg border border-border/60 p-3 hover:bg-secondary/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {event.title}
                            </h4>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                event.status === "live"
                                  ? "bg-red-500/20 text-red-400"
                                  : event.status === "upcoming"
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {event.status}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.event_date), "h:mm a")}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.platform} · {event.host}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CalendarView;
