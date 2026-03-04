import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RotateCcw, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DrawingCanvas from "@/components/DrawingCanvas";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import SketchProgress from "@/components/SketchProgress";
import { generateSketch, type SketchMode } from "@/lib/api";

type PageState = "generating" | "drawing" | "done";

const DrawingPage = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>("generating");
  const [original, setOriginal] = useState("");
  const [sketch, setSketch] = useState("");
  const [mode, setMode] = useState<SketchMode>("graphite");
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    const img = sessionStorage.getItem("graphiteai_image");
    const m = sessionStorage.getItem("graphiteai_mode") as SketchMode | null;
    if (!img) {
      navigate("/");
      return;
    }
    setOriginal(img);
    if (m) setMode(m);

    // Start generation
    (async () => {
      try {
        const result = await generateSketch(img, m || "graphite");
        setSketch(result.sketch);
        setState("drawing");
      } catch (err: any) {
        toast.error(err.message || "Failed to generate sketch");
        navigate("/");
      }
    })();
    // Cleanup session
    return () => {
      sessionStorage.removeItem("graphiteai_image");
      sessionStorage.removeItem("graphiteai_mode");
    };
  }, [navigate]);

  const handleDrawingComplete = useCallback(() => {
    setState("done");
    toast.success(
      mode === "colored"
        ? "Your colored pencil sketch is ready!"
        : "Your graphite sketch is ready!"
    );
  }, [mode]);

  const handleDownload = useCallback(() => {
    if (!sketch) return;
    const link = document.createElement("a");
    link.href = sketch;
    link.download = `${mode}-sketch.png`;
    link.click();
  }, [sketch, mode]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-serif text-2xl tracking-tight">
              <span className="text-gold-gradient">Graphite</span>
              <span className="text-foreground">AI</span>
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Photo
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {state === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SketchProgress mode={mode} />
              </motion.div>
            )}

            {state === "drawing" && (
              <motion.div
                key="drawing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <h2 className="font-serif text-xl text-foreground">
                  ✏️ Drawing your sketch…
                </h2>
                <DrawingCanvas
                  sketchUrl={sketch}
                  durationMs={90_000}
                  onComplete={handleDrawingComplete}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setState("done");
                  }}
                  className="text-muted-foreground text-xs mt-2"
                >
                  Skip animation
                </Button>
              </motion.div>
            )}

            {state === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6"
              >
                {showSlider ? (
                  <>
                    <BeforeAfterSlider before={original} after={sketch} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSlider(false)}
                      className="text-muted-foreground"
                    >
                      Show sketch only
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-border glow-gold">
                      <img
                        src={sketch}
                        alt="Final sketch"
                        className="w-full h-auto object-contain bg-card"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSlider(true)}
                      className="text-muted-foreground"
                    >
                      Compare with original
                    </Button>
                  </>
                )}

                <div className="flex gap-3 flex-wrap justify-center">
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/80 px-6"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    size="lg"
                    className="border-border text-foreground"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Photo
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

export default DrawingPage;
