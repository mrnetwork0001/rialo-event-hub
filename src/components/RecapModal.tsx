import { useState } from "react";
import { X, ExternalLink } from "lucide-react";

interface RecapModalProps {
  url: string;
  onClose: () => void;
}

function getEmbed(url: string): { type: "youtube" | "x" | "other"; embedUrl?: string } {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (ytMatch) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };
  }
  // X Space
  if (/x\.com\/i\/spaces\//i.test(url) || /twitter\.com\/i\/spaces\//i.test(url)) {
    return { type: "x" };
  }
  return { type: "other" };
}

const RecapModal = ({ url, onClose }: RecapModalProps) => {
  const embed = getEmbed(url);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <span className="text-sm font-semibold text-foreground font-display">Event Recap</span>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {embed.type === "youtube" && embed.embedUrl ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-secondary">
              <iframe
                src={embed.embedUrl}
                title="Recap video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : embed.type === "x" ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary border border-border">
                <span className="text-2xl font-bold text-foreground">𝕏</span>
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                X Spaces cannot be embedded directly. Click below to listen on X.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="h-4 w-4" /> Open on X
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-10">
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                This recap link can't be embedded. Click below to view it externally.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="h-4 w-4" /> Open Link
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecapModal;
