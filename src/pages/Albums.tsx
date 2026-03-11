import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Camera, ImagePlus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface Album {
  id: string;
  title: string;
  event_date: string;
  cover_url: string | null;
  photo_count: number;
  preview_photos: string[];
}

const Albums = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      const { data: albumsData } = await supabase
        .from("albums")
        .select("id, title, event_date, cover_url")
        .order("event_date", { ascending: false });

      if (!albumsData) {
        setLoading(false);
        return;
      }

      const enriched = await Promise.all(
        albumsData.map(async (album) => {
          const { data: photos, count } = await supabase
            .from("album_photos")
            .select("image_url", { count: "exact" })
            .eq("album_id", album.id)
            .limit(4);

          return {
            ...album,
            photo_count: count ?? 0,
            preview_photos: photos?.map((p) => p.image_url) ?? [],
          };
        })
      );

      setAlbums(enriched);
      setLoading(false);
    };

    fetchAlbums();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-56 px-4 py-8 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Camera className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Albums</h1>
            </div>
            <Button
              onClick={() => navigate("/albums/submit")}
              className="gap-2"
            >
              <ImagePlus className="h-4 w-4" />
              Submit Photos
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-card h-72" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Camera className="h-16 w-16 mb-4 opacity-40" />
              <p className="text-lg font-medium">No albums yet</p>
              <p className="text-sm">Be the first to submit event photos!</p>
              <Button
                onClick={() => navigate("/albums/submit")}
                className="mt-4 gap-2"
                variant="outline"
              >
                <ImagePlus className="h-4 w-4" />
                Submit Photos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => navigate(`/albums/${album.id}`)}
                  className="group text-left rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Photo grid preview */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    {album.preview_photos.length > 0 ? (
                      <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5">
                        {album.preview_photos.slice(0, 4).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className={`w-full h-full object-cover ${
                              album.preview_photos.length === 1
                                ? "col-span-2 row-span-2"
                                : album.preview_photos.length === 2
                                ? "row-span-2"
                                : album.preview_photos.length === 3 && i === 0
                                ? "row-span-2"
                                : ""
                            }`}
                          />
                        ))}
                      </div>
                    ) : album.cover_url ? (
                      <img
                        src={album.cover_url}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {album.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {album.photo_count} photo{album.photo_count !== 1 ? "s" : ""} · {format(new Date(album.event_date), "MMMM d, yyyy")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Albums;
