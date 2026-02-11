import { cn } from "@/lib/utils";
import type { EventCategory } from "@/lib/events-data";
import { CATEGORIES } from "@/lib/events-data";

interface CategoryFilterProps {
  selected: EventCategory | "All";
  onSelect: (cat: EventCategory | "All") => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  const all: (EventCategory | "All")[] = ["All", ...CATEGORIES];

  return (
    <div className="flex flex-wrap gap-2">
      {all.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
            selected === cat
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
