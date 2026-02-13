import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchEvents, createEvent, updateEvent, deleteEvent, getSiteSetting, updateSiteSetting, CATEGORIES, type DbEvent, type EventCategory, type EventStatus } from "@/lib/supabase-events";
import { uploadEventImage } from "@/lib/upload-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, LogOut, ArrowLeft, Pin, PinOff } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const STATUSES: EventStatus[] = ["upcoming", "live", "past"];

/** Convert a UTC ISO string to a local "YYYY-MM-DDTHH:mm" value for datetime-local inputs */
function toLocalDatetimeString(utcIso: string): string {
  const d = new Date(utcIso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  image_url: "",
  is_pinned: false,
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitEventUrl, setSubmitEventUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadEvents();
      getSiteSetting("submit_event_url").then(setSubmitEventUrl).catch(() => {});
    }
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
      event_date: toLocalDatetimeString(event.event_date),
      host: event.host,
      platform: event.platform,
      join_link: event.join_link || "",
      share_link: event.share_link || "",
      recap_summary: event.recap_summary || "",
      recording_link: event.recording_link || "",
      image_url: event.image_url || "",
      is_pinned: event.is_pinned,
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

  const handleTogglePin = async (event: DbEvent) => {
    try {
      await updateEvent(event.id, { is_pinned: !event.is_pinned });
      toast.success(event.is_pinned ? "Event unpinned" : "Event pinned");
      loadEvents();
    } catch {
      toast.error("Failed to update pin status");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      let imageUrl = form.image_url;

      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile);
      }

      const payload = {
        ...form,
        image_url: imageUrl || null,
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
      setImageFile(null);
      setImagePreview(null);
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to save event");
    } finally {
      setUploading(false);
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
        {/* Submit Event URL Setting */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label>Submit Event Form URL</Label>
                <Input
                  placeholder="https://forms.google.com/..."
                  value={submitEventUrl}
                  onChange={(e) => setSubmitEventUrl(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                disabled={savingUrl}
                onClick={async () => {
                  setSavingUrl(true);
                  try {
                    await updateSiteSetting("submit_event_url", submitEventUrl);
                    toast.success("Submit event URL saved");
                  } catch {
                    toast.error("Failed to save URL");
                  } finally {
                    setSavingUrl(false);
                  }
                }}
              >
                {savingUrl ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This link appears as a "Submit Your Event" button on the homepage. Leave empty to hide it.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Events ({events.length})</h2>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setImageFile(null); setImagePreview(null); }}>
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
                  <Label>Date & Time (your local time — stored as UTC)</Label>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label>Event Image</Label>
                  <Input type="file" accept="image/*" onChange={handleImageChange} />
                  {(imagePreview || form.image_url) && (
                    <div className="mt-2">
                      <img
                        src={imagePreview || form.image_url}
                        alt="Preview"
                        className="h-32 w-auto rounded-md object-cover"
                      />
                    </div>
                  )}
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
                  <Label>Recap Link</Label>
                  <Input value={form.recording_link} onChange={(e) => setForm({ ...form, recording_link: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_pinned"
                    checked={form.is_pinned}
                    onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <Label htmlFor="is_pinned" className="cursor-pointer">Pin this event</Label>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Recap Summary</Label>
                  <Textarea value={form.recap_summary} onChange={(e) => setForm({ ...form, recap_summary: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "Uploading..." : editingId ? "Update Event" : "Create Event"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); setImageFile(null); setImagePreview(null); }}>
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {event.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                        {event.title}
                      </div>
                    </TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePin(event)}
                          title={event.is_pinned ? "Unpin event" : "Pin event"}
                        >
                          {event.is_pinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
                        </Button>
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
