import { CalendarOff, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onClearFilters: () => void;
}

const EmptyState = ({ onClearFilters }: EmptyStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Themed illustration */}
      <div className="relative mb-6">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20">
          <CalendarOff className="h-12 w-12 text-primary/50" />
        </div>
        {/* Decorative rings */}
        <div className="absolute inset-0 -m-3 rounded-full border border-primary/10 animate-pulse-live" />
        <div className="absolute inset-0 -m-6 rounded-full border border-primary/5" />
      </div>

      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        No events match your filters
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground leading-relaxed mb-6">
        We couldn't find any events for this combination. Try broadening your search or submit your own event to the hub.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear Filters
        </Button>
        <Button size="sm" onClick={() => navigate("/submit-event")}>
          <Send className="h-4 w-4 mr-2" /> Submit an Event
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
