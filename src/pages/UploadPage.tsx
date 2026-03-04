import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Link as LinkIcon, Pencil, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import type { SketchMode } from "@/lib/api";

const UploadPage = () => {
  const navigate = useNavigate();
  const [original, setOriginal] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [mode, setMode] = useState<SketchMode>("graphite");

  const handleImageSelected = useCallback((base64: string) => {
    setOriginal(base64);
    setImageUrl("");
  }, []);

  const handleUrlLoad = useCallback(async () => {
    if (!imageUrl.trim()) return;
    setLoadingUrl(true);
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("Failed to fetch image");
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) throw new Error("URL is not an image");
      if (blob.size > 10 * 1024 * 1024) throw new Error("Image must be under 10MB");
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setOriginal(reader.result);
          setImageUrl("");
        }
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      toast.error(err.message || "Could not load image from URL");
    } finally {
      setLoadingUrl(false);
    }
  }, [imageUrl]);

  const handleGenerate = useCallback(() => {
    if (!original) {
      toast.error("Please upload or paste an image first");
      return;
    }
    // Store image in sessionStorage and navigate
    sessionStorage.setItem("graphiteai_image", original);
    sessionStorage.setItem("graphiteai_mode", mode);
    navigate("/drawing");
  }, [original, mode, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-serif text-2xl tracking-tight">
            <span className="text-gold-gradient">Graphite</span>
            <span className="text-foreground">AI</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
                Photo to <span className="text-gold-gradient">Pencil Sketch</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Transform any photo into an ultra-realistic pencil drawing — graphite or colored pencil — powered by AI.
              </p>
            </div>

            {/* Upload zone or preview */}
            {!original ? (
              <>
                <UploadZone onImageSelected={handleImageSelected} />

                {/* URL input */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                    <div className="flex-1 h-px bg-border" />
                    <span>or paste image URL</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUrlLoad();
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleUrlLoad}
                      disabled={!imageUrl.trim() || loadingUrl}
                      variant="outline"
                      className="border-border text-foreground shrink-0"
                    >
                      {loadingUrl ? "Loading…" : "Load"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6"
              >
                {/* Image preview */}
                <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-border glow-gold">
                  <img
                    src={original}
                    alt="Your uploaded photo"
                    className="w-full h-auto object-contain bg-card"
                  />
                </div>

                {/* Mode selector */}
                <div className="flex gap-2 p-1 rounded-xl bg-secondary">
                  <button
                    onClick={() => setMode("graphite")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      mode === "graphite"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Pencil className="w-4 h-4" />
                    Graphite
                  </button>
                  <button
                    onClick={() => setMode("colored")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      mode === "colored"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    Colored Pencil
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerate}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/80 px-8 font-medium"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Sketch
                  </Button>
                  <Button
                    onClick={() => setOriginal("")}
                    variant="outline"
                    size="lg"
                    className="border-border text-foreground"
                  >
                    Change
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center">
        <p className="text-muted-foreground text-xs">
          Powered by AI · No images are stored
        </p>
      </footer>
    </div>
  );
};

export default UploadPage;
