import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { uploadEventImage } from "@/lib/upload-image";
import { CATEGORIES, type EventCategory, type EventStatus } from "@/lib/supabase-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";

const STATUSES: EventStatus[] = ["upcoming", "live", "past"];
const PLATFORMS = ["Discord", "X (Twitter)", "Telegram", "Google Meet", "Zoom", "YouTube", "Other"];

const SubmitEvent = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "AMA" as EventCategory,
    status: "upcoming" as EventStatus,
    event_date: "",
    host: "",
    platform: "",
    join_link: "",
    recap_summary: "",
    recording_link: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.event_date || !form.host || !form.platform || !form.join_link) {
      toast.error("Please fill in all mandatory fields");
      return;
    }

    // Validate host count (max 2)
    const hosts = form.host.split(",").map((h) => h.trim()).filter(Boolean);
    if (hosts.length > 2) {
      toast.error("Maximum 2 hosts allowed");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile);
      }

      const { error } = await supabase.from("events").insert({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        status: form.status,
        event_date: new Date(form.event_date).toISOString(),
        host: hosts.join(", "),
        platform: form.platform,
        join_link: form.join_link || null,
        image_url: imageUrl,
        recap_summary: form.status === "past" ? (form.recap_summary || null) : null,
        recording_link: form.status === "past" ? (form.recording_link || null) : null,
        approval_status: "pending",
      } as any);

      if (error) throw error;

      // Notify admins via Telegram
      try {
        await supabase.functions.invoke("notify-telegram", {
          body: {
            type: "new_submission",
            event: {
              title: form.title.trim(),
              category: form.category,
              host: hosts.join(", "),
              event_date: new Date(form.event_date).toISOString(),
            },
          },
        });
      } catch {
        // non-blocking
      }

      toast.success("Event submitted! It will appear once approved by an admin.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold text-gradient-gold">Submit Your Event</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="font-display text-lg">Event Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill in the details below. Your event will be reviewed by an admin before being published.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              {/* Title */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Event title"
                  required
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Description <span className="text-destructive">*</span></Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your event..."
                  required
                  maxLength={2000}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category <span className="text-destructive">*</span></Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status <span className="text-destructive">*</span></Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label>Date & Time (UTC) <span className="text-destructive">*</span></Label>
                <Input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  required
                />
              </div>

              {/* Host */}
              <div className="space-y-2">
                <Label>Host(s) <span className="text-destructive">*</span></Label>
                <Input
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  placeholder="Host name (comma-separated, max 2)"
                  required
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">Separate multiple hosts with a comma (max 2)</p>
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label>Platform <span className="text-destructive">*</span></Label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select platform</option>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Join Link */}
              <div className="space-y-2">
                <Label>Join Link <span className="text-destructive">*</span></Label>
                <Input
                  value={form.join_link}
                  onChange={(e) => setForm({ ...form, join_link: e.target.value })}
                  placeholder="https://..."
                  required
                  type="url"
                />
              </div>

              {/* Event Image */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Event Image</Label>
                <Input type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-md object-cover" />
                  </div>
                )}
              </div>

              {/* Recap fields - only show for past events */}
              {form.status === "past" && (
                <>
                  <div className="space-y-2">
                    <Label>Recap Link</Label>
                    <Input
                      value={form.recording_link}
                      onChange={(e) => setForm({ ...form, recording_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Recap Summary</Label>
                    <Textarea
                      value={form.recap_summary}
                      onChange={(e) => setForm({ ...form, recap_summary: e.target.value })}
                      placeholder="Brief summary of what happened..."
                      maxLength={2000}
                    />
                  </div>
                </>
              )}

              {/* Submit */}
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <Button type="submit" disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Event"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubmitEvent;
