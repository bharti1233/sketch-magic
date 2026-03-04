import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, RotateCcw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveDrawingCanvasProps {
  sketchSrc: string;
  originalSrc: string;
  onComplete: () => void;
  onDownload: () => void;
  onReset: () => void;
  duration?: number; // total drawing seconds
}

/**
 * Progressive reveal phases:
 *  Phase 1 (0-15%):  Outline — only the darkest 15% of pixels
 *  Phase 2 (15-45%): Features — up to 45% darkest
 *  Phase 3 (45-80%): Shading & crosshatch — up to 80%
 *  Phase 4 (80-100%): Full detail — everything
 *
 * Pixels are sorted by brightness so dark strokes appear first,
 * simulating real pencil workflow.
 */

const TOTAL_DURATION_MS = 90_000; // 90 seconds default

const LiveDrawingCanvas = ({
  sketchSrc,
  originalSrc,
  onComplete,
  onDownload,
  onReset,
  duration,
}: LiveDrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("Outlining edges");
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number>(0);
  const totalMs = (duration ?? 90) * 1000;

  const getPhaseLabel = (p: number) => {
    if (p < 15) return "Outlining edges";
    if (p < 35) return "Drawing facial features & contours";
    if (p < 60) return "Adding shading & cross-hatching";
    if (p < 85) return "Refining tonal gradients";
    return "Completing final details";
  };

  const getRemainingTime = (p: number) => {
    if (p >= 100) return "Complete";
    const remaining = Math.ceil(((100 - p) / 100) * (totalMs / 1000));
    if (remaining > 60) {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      return `~${m}m ${s}s remaining`;
    }
    return `~${remaining}s remaining`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas to image dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw sketch onto an offscreen canvas to read pixels
      const offscreen = document.createElement("canvas");
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true })!;
      offCtx.drawImage(img, 0, 0);
      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const data = imageData.data;

      // Build brightness map (lower = darker = drawn first)
      const w = offscreen.width;
      const h = offscreen.height;
      const totalPixels = w * h;

      // Create array of indices sorted by brightness (dark first)
      const indices = new Uint32Array(totalPixels);
      const brightness = new Uint8Array(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        indices[i] = i;
        const off = i * 4;
        // luminance
        brightness[i] = Math.round(
          0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2]
        );
      }

      // Sort dark pixels first — use bucket sort for speed
      const buckets: number[][] = Array.from({ length: 256 }, () => []);
      for (let i = 0; i < totalPixels; i++) {
        buckets[brightness[i]].push(i);
      }
      const sortedIndices: number[] = [];
      for (let b = 0; b < 256; b++) {
        // Add some randomization within each bucket for natural feel
        const bucket = buckets[b];
        for (let j = bucket.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [bucket[j], bucket[k]] = [bucket[k], bucket[j]];
        }
        sortedIndices.push(...bucket);
      }

      // Start with white canvas
      ctx.fillStyle = "#FAFAF5"; // paper-like white
      ctx.fillRect(0, 0, w, h);

      // Create output imageData (white)
      const outData = ctx.getImageData(0, 0, w, h);
      const out = outData.data;
      for (let i = 0; i < out.length; i += 4) {
        out[i] = 250;
        out[i + 1] = 250;
        out[i + 2] = 245;
        out[i + 3] = 255;
      }

      startTimeRef.current = performance.now();
      let lastBatchEnd = 0;

      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const rawProgress = Math.min(elapsed / totalMs, 1);

        // Use easing for more natural feel — slow start, steady middle, slow end
        const eased = rawProgress < 0.1
          ? rawProgress * rawProgress * 50 // slow start
          : rawProgress > 0.9
            ? 1 - (1 - rawProgress) * (1 - rawProgress) * 50 + 0.95 // slow end
            : rawProgress; // linear middle

        const clampedProgress = Math.min(Math.max(eased, 0), 1);
        const pixelsToReveal = Math.floor(clampedProgress * totalPixels);

        // Reveal pixels in batches
        if (pixelsToReveal > lastBatchEnd) {
          for (let i = lastBatchEnd; i < pixelsToReveal; i++) {
            const idx = sortedIndices[i];
            const off = idx * 4;
            out[off] = data[off];
            out[off + 1] = data[off + 1];
            out[off + 2] = data[off + 2];
            out[off + 3] = data[off + 3];
          }
          lastBatchEnd = pixelsToReveal;
          ctx.putImageData(outData, 0, 0);
        }

        const pct = Math.round(rawProgress * 100);
        setProgress(pct);
        setPhase(getPhaseLabel(pct));

        if (rawProgress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Ensure all pixels shown
          ctx.drawImage(img, 0, 0);
          setProgress(100);
          setIsComplete(true);
          onComplete();
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    };
    img.src = sketchSrc;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [sketchSrc, totalMs, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 w-full"
    >
      {/* Canvas */}
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden border border-border bg-[#FAFAF5]">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ imageRendering: "auto" }}
        />
        {/* Live overlay */}
        {!isComplete && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Pencil className="w-3.5 h-3.5 text-primary" />
            </motion.div>
            <span className="text-xs font-medium text-foreground">Drawing…</span>
          </div>
        )}
      </div>

      {/* Progress info */}
      <div className="w-full max-w-lg space-y-3">
        {/* Progress bar */}
        <div className="relative w-full h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{phase}</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-foreground font-semibold">{progress}%</span>
            <span className="text-muted-foreground text-xs">
              {getRemainingTime(progress)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions (shown when complete) */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 flex-wrap justify-center"
        >
          <Button
            onClick={onDownload}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="border-border text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Photo
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LiveDrawingCanvas;
