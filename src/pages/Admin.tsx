import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchEvents, createEvent, updateEvent, deleteEvent, CATEGORIES, type DbEvent, type EventCategory, type EventStatus } from "@/lib/supabase-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, LogOut, ArrowLeft } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const STATUSES: EventStatus[] = ["upcoming", "live", "past"];

const emptyForm = {
  title: "",
  description: "",
  category: "AMA" as EventCategory,
  status: "upcoming" as EventStatus,
  event_date: "",
  host: "",
  platform: "",
  join_link: "",
  share_link: "",
  recap_summary: "",
  recording_link: "",
  rsvp_count: 0,
};

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) loadEvents();
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: DbEvent) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      status: event.status,
      event_date: event.event_date.slice(0, 16),
      host: event.host,
      platform: event.platform,
      join_link: event.join_link || "",
      share_link: event.share_link || "",
      recap_summary: event.recap_summary || "",
      recording_link: event.recording_link || "",
      rsvp_count: event.rsvp_count,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEvent(id);
      toast.success("Event deleted");
      loadEvents();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        event_date: new Date(form.event_date).toISOString(),
        join_link: form.join_link || null,
        share_link: form.share_link || null,
        recap_summary: form.recap_summary || null,
        recording_link: form.recording_link || null,
      };

      if (editingId) {
        await updateEvent(editingId, payload);
        toast.success("Event updated");
      } else {
        await createEvent(payload);
        toast.success("Event created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to save event");
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin && !authLoading && user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">You don't have admin access.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-xl font-bold text-gradient-gold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Events ({events.length})</h2>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
            <Plus className="h-4 w-4 mr-2" /> New Event
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                {editingId ? "Edit Event" : "Create Event"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>RSVP Count</Label>
                  <Input type="number" value={form.rsvp_count} onChange={(e) => setForm({ ...form, rsvp_count: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Join Link</Label>
                  <Input value={form.join_link} onChange={(e) => setForm({ ...form, join_link: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <Input value={form.share_link} onChange={(e) => setForm({ ...form, share_link: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Recording Link</Label>
                  <Input value={form.recording_link} onChange={(e) => setForm({ ...form, recording_link: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Recap Summary</Label>
                  <Textarea value={form.recap_summary} onChange={(e) => setForm({ ...form, recap_summary: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <Button type="submit">
                    {editingId ? "Update Event" : "Create Event"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Events Table */}
        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading events...</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <span className="rounded-md bg-secondary px-2 py-1 text-xs">{event.category}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={event.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(event.event_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{event.host}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
