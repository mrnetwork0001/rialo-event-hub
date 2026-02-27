import { cn } from "@/lib/utils";
import type { EventStatus } from "@/lib/events-data";

interface StatusBadgeProps {
  status: EventStatus;
  className?: string;
}

const statusConfig: Record<EventStatus, { label: string; classes: string; dot?: boolean }> = {
  live: {
    label: "LIVE",
    classes: "bg-red-600 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]",
    dot: true,
  },
  upcoming: {
    label: "UPCOMING",
    classes: "bg-upcoming/15 text-upcoming border-upcoming/30",
  },
  past: {
    label: "PAST EVENT",
    classes: "bg-past/20 text-past-foreground border-past/30",
  },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
        config.classes,
        className
      )}
    >
      {config.dot && (
        <span className="h-2 w-2 rounded-full bg-white animate-pulse-live" />
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
