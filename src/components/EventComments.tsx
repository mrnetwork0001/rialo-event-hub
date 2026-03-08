import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageCircle, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
}

interface EventCommentsProps {
  eventId: string;
}

const EventComments = ({ eventId }: EventCommentsProps) => {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [eventId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      // Fetch comments
      const { data: commentsData, error } = await supabase
        .from("event_comments")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for display names
      const userIds = [...new Set((commentsData ?? []).map((c: any) => c.user_id))];
      let profileMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        for (const p of profiles ?? []) {
          profileMap[(p as any).id] = (p as any).display_name || "Anonymous";
        }
      }

      const enriched = (commentsData ?? []).map((c: any) => ({
        ...c,
        display_name: profileMap[c.user_id] || "Anonymous",
      }));

      setComments(enriched);
    } catch {
      console.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("event_comments").insert({
        event_id: eventId,
        user_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
      setContent("");
      await loadComments();
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("event_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      await loadComments();
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-primary" />
        Discussion ({comments.length})
      </h3>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={2000}
            className="mb-3 min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
              <Send className="h-3.5 w-3.5 mr-1" />
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground text-center">
          Sign in to join the discussion.
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isOwner = user?.id === comment.user_id;
            const canDelete = isOwner || isAdmin;

            return (
              <div key={comment.id} className="group flex gap-3">
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary uppercase">
                  {comment.display_name?.[0] || "?"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{comment.display_name}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-secondary-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventComments;
