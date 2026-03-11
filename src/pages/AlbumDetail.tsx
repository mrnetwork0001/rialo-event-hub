import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, Camera, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AlbumData {
  id: string;
  title: string;
  event_date: string;
}

const AlbumDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetch = async () => {
      const [albumRes, photosRes] = await Promise.all([
        supabase.from("albums").select("id, title, event_date").eq("id", id).single(),
        supabase.from("album_photos").select("image_url").eq("album_id", id).order("created_at"),
      ]);

      if (albumRes.data) setAlbum(albumRes.data);
      if (photosRes.data) setPhotos(photosRes.data.map((p) => p.image_url));
      setLoading(false);
    };

    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-56 px-4 py-8 lg:px-8">
          <div className="animate-pulse space-y-4 max-w-7xl mx-auto">
            <div className="h-8 w-64 bg-card rounded" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-card rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-56 px-4 py-8 lg:px-8 flex items-center justify-center">
          <p className="text-muted-foreground">Album not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-56 px-4 py-8 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/albums")}
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Albums
          </Button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{album.title}</h1>
            <p className="text-muted-foreground mt-1">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} · {format(new Date(album.event_date), "MMMM d, yyyy")}
            </p>
          </div>

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Camera className="h-16 w-16 mb-4 opacity-40" />
              <p>No photos in this album yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxUrl(url)}
                  className="aspect-square rounded-lg overflow-hidden group relative"
                >
                  <img
                    src={url}
                    alt={`${album.title} photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-none">
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt="Full size"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlbumDetail;
