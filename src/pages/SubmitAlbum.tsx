import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, ImagePlus, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SubmitAlbum = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const validFiles: File[] = [];
    for (const file of Array.from(selected)) {
      if (file.type === "image/jpeg" || file.type === "image/png") {
        validFiles.push(file);
      }
    }

    if (validFiles.length < Array.from(selected).length) {
      toast({
        title: "Some files skipped",
        description: "Only JPG and PNG files are accepted.",
        variant: "destructive",
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [
      ...prev,
      ...validFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !eventDate || files.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields and add at least one photo.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create album with pending status
      const { data: album, error: albumError } = await supabase
        .from("albums")
        .insert({
          title: title.trim(),
          event_date: eventDate,
          status: "pending",
        })
        .select("id")
        .single();

      if (albumError) throw albumError;

      // Upload all photos
      const uploadPromises = files.map(async (file) => {
        const ext = file.name.split(".").pop();
        const fileName = `${album.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("album-photos")
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("album-photos")
          .getPublicUrl(fileName);

        return data.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);

      // Insert photo records
      const photoInserts = urls.map((url) => ({
        album_id: album.id,
        image_url: url,
      }));

      const { error: photosError } = await supabase
        .from("album_photos")
        .insert(photoInserts);

      if (photosError) throw photosError;

      // Set first photo as cover
      await supabase
        .from("albums")
        .update({ cover_url: urls[0] })
        .eq("id", album.id);

      toast({
        title: "Album submitted!",
        description:
          "Your photos have been submitted for review. They'll appear once approved by an admin.",
      });

      navigate("/albums");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Submission failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-56 px-4 py-8 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/albums")}
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Albums
          </Button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              Submit Event Photos
            </h1>
            <p className="text-muted-foreground mt-1">
              Attended or hosted an event and want your photos featured here?
              Fill in the details below!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Name</Label>
              <Input
                id="title"
                placeholder="e.g. Arc Side Quest at ETHDenver"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Event Date</Label>
              <Input
                id="date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Photos (JPG or PNG only)</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Click to upload photos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No limit on number of photos · JPG & PNG only
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleFilesChange}
                className="hidden"
              />
            </div>

            {previews.length > 0 && (
              <div className="space-y-2">
                <Label>{files.length} photo{files.length !== 1 ? "s" : ""} selected</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {previews.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img
                        src={url}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || files.length === 0}
              className="w-full gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {files.length} photo{files.length !== 1 ? "s" : ""}...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Submit Album
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SubmitAlbum;
