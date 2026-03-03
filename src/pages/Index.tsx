import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import SketchProgress from "@/components/SketchProgress";
import { generateSketch } from "@/lib/api";

type AppState = "idle" | "preview" | "generating" | "done";

const Index = () => {
  const [state, setState] = useState<AppState>("idle");
  const [original, setOriginal] = useState<string>("");
  const [sketch, setSketch] = useState<string>("");

  const handleImageSelected = useCallback((base64: string) => {
    setOriginal(base64);
    setSketch("");
    setState("preview");
  }, []);

  const handleGenerate = useCallback(async () => {
    setState("generating");
    try {
      const result = await generateSketch(original);
      setSketch(result.sketch);
      setState("done");
      toast.success("Your graphite sketch is ready!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
      setState("preview");
    }
  }, [original]);

  const handleReset = useCallback(() => {
    setOriginal("");
    setSketch("");
    setState("idle");
  }, []);

  const handleDownload = useCallback(() => {
    if (!sketch) return;
    const link = document.createElement("a");
    link.href = sketch;
    link.download = "graphite-sketch.png";
    link.click();
  }, [sketch]);

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
          {state !== "idle" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New
            </Button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
                    Photo to <span className="text-gold-gradient">Pencil Sketch</span>
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Transform any portrait into an ultra-realistic graphite pencil drawing powered by AI.
                  </p>
                </div>
                <UploadZone onImageSelected={handleImageSelected} />
              </motion.div>
            )}

            {state === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-full aspect-square max-w-sm rounded-2xl overflow-hidden border border-border">
                  <img
                    src={original}
                    alt="Your uploaded photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-gold-dark px-8 font-medium"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Sketch
                </Button>
              </motion.div>
            )}

            {state === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SketchProgress />
              </motion.div>
            )}

            {state === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6"
              >
                <BeforeAfterSlider before={original} after={sketch} />
                <div className="flex gap-3">
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-gold-dark px-6"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="border-border text-foreground hover:bg-surface-hover"
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

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center">
        <p className="text-muted-foreground text-xs">
          Powered by AI · No images are stored
        </p>
      </footer>
    </div>
  );
};

export default Index;
