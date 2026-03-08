import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, Lightbulb, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  status: string;
}

interface Vote {
  suggestion_id: string;
  user_id: string;
}

const SUGGESTION_CATEGORIES = ["General", "AMA", "Workshop", "Quiz & Games", "X Space", "Meetup", "Educational"];

const Suggestions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: sugData }, { data: voteData }] = await Promise.all([
        supabase
          .from("suggestions")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false }),
        supabase.from("suggestion_votes").select("suggestion_id, user_id"),
      ]);
      setSuggestions((sugData as Suggestion[]) ?? []);
      setVotes((voteData as Vote[]) ?? []);
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const getVoteCount = (suggestionId: string) =>
    votes.filter((v) => v.suggestion_id === suggestionId).length;

  const hasVoted = (suggestionId: string) =>
    user ? votes.some((v) => v.suggestion_id === suggestionId && v.user_id === user.id) : false;

  const handleVote = async (suggestionId: string) => {
    if (!user) {
      toast.error("Sign in to vote on suggestions");
      return;
    }

    const voted = hasVoted(suggestionId);
    try {
      if (voted) {
        await supabase
          .from("suggestion_votes")
          .delete()
          .eq("suggestion_id", suggestionId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("suggestion_votes")
          .insert({ suggestion_id: suggestionId, user_id: user.id });
      }
      await loadData();
    } catch {
      toast.error("Failed to update vote");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to submit a suggestion");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("suggestions").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
      });
      if (error) throw error;
      toast.success("Suggestion submitted!");
      setTitle("");
      setDescription("");
      setCategory("General");
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit suggestion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this suggestion?")) return;
    try {
      const { error } = await supabase.from("suggestions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Suggestion deleted");
      await loadData();
    } catch {
      toast.error("Failed to delete suggestion");
    }
  };

  // Sort by vote count descending
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => getVoteCount(b.id) - getVoteCount(a.id)
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-56">
        <div className="mx-auto max-w-3xl px-6 py-8 pt-16 lg:pt-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Event Suggestions
                </h1>
                <p className="text-sm text-muted-foreground">Suggest and vote on event topics</p>
              </div>
            </div>
            {user && (
              <Button onClick={() => setShowForm(!showForm)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Suggest
              </Button>
            )}
          </div>

          {/* Submit form */}
          {showForm && (
            <Card className="mb-6 border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">New Suggestion</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. AMA with the founding team"
                      maxLength={200}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What should this event cover?"
                      maxLength={1000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {SUGGESTION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {!user && (
            <div className="mb-6 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground text-center">
              Sign in to suggest event topics and vote on others.
            </div>
          )}

          {/* Suggestions list */}
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading suggestions...</p>
          ) : sortedSuggestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No suggestions yet. Be the first to suggest an event topic!</p>
          ) : (
            <div className="space-y-3">
              {sortedSuggestions.map((suggestion) => {
                const voteCount = getVoteCount(suggestion.id);
                const voted = hasVoted(suggestion.id);
                const isOwner = user?.id === suggestion.user_id;

                return (
                  <div
                    key={suggestion.id}
                    className="flex gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-border"
                  >
                    {/* Vote button */}
                    <button
                      onClick={() => handleVote(suggestion.id)}
                      disabled={!user}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0",
                        voted
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80",
                        !user && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <ChevronUp className={cn("h-4 w-4", voted && "text-primary")} />
                      <span>{voteCount}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">{suggestion.title}</h3>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(suggestion.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      {suggestion.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{suggestion.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-md bg-secondary px-2 py-0.5">{suggestion.category}</span>
                        <span>·</span>
                        <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Suggestions;
