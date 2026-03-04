import { useEffect, useRef, useState, useCallback } from "react";

interface DrawingCanvasProps {
  sketchUrl: string;
  durationMs?: number;
  onComplete?: () => void;
}

const PHASES = [
  { name: "Detecting outlines…", end: 0.15 },
  { name: "Drawing contours…", end: 0.35 },
  { name: "Adding shading…", end: 0.65 },
  { name: "Cross-hatching details…", end: 0.85 },
  { name: "Final touches…", end: 1.0 },
];

/**
 * Progressively reveals a sketch image on canvas,
 * simulating a pencil drawing animation.
 *
 * Strategy: sort pixels by luminance (edges first, then mid-tones, then lights)
 * and reveal them in that order with slight randomness to mimic pencil strokes.
 */
const DrawingCanvas = ({
  sketchUrl,
  durationMs = 90_000,
  onComplete,
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(PHASES[0].name);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const animate = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      imageData: ImageData,
      sortedIndices: Uint32Array,
      blankData: Uint8ClampedArray,
      w: number,
      h: number
    ) => {
      const total = sortedIndices.length;
      const batchSize = Math.ceil(total / (durationMs / 16)); // pixels per frame (~60fps)

      const step = (timestamp: number) => {
        if (!startRef.current) startRef.current = timestamp;
        const elapsed = timestamp - startRef.current;
        const t = Math.min(elapsed / durationMs, 1);

        // Determine how many pixels to reveal
        const revealCount = Math.min(Math.floor(t * total), total);

        // Copy pixels from source to blank canvas data
        const src = imageData.data;
        for (
          let i = Math.max(0, revealCount - batchSize * 2);
          i < revealCount;
          i++
        ) {
          const idx = sortedIndices[i];
          const p = idx * 4;
          blankData[p] = src[p];
          blankData[p + 1] = src[p + 1];
          blankData[p + 2] = src[p + 2];
          blankData[p + 3] = src[p + 3];
        }

        const out = new ImageData(new Uint8ClampedArray(blankData), w, h);
        ctx.putImageData(out, 0, 0);

        setProgress(Math.round(t * 100));

        // Update phase
        for (const p of PHASES) {
          if (t <= p.end) {
            setPhase(p.name);
            break;
          }
        }

        if (t < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          onComplete?.();
        }
      };

      animRef.current = requestAnimationFrame(step);
    },
    [durationMs, onComplete]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;

      // Draw image to extract pixel data
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Create luminance array and sort indices (darkest first = edges)
      const pixelCount = w * h;
      const luminances = new Float32Array(pixelCount);
      for (let i = 0; i < pixelCount; i++) {
        const p = i * 4;
        // Standard luminance with slight noise for natural feel
        luminances[i] =
          0.299 * data[p] +
          0.587 * data[p + 1] +
          0.114 * data[p + 2] +
          Math.random() * 30;
      }

      // Sort by luminance (dark pixels first → edges drawn first)
      const sortedIndices = new Uint32Array(pixelCount);
      for (let i = 0; i < pixelCount; i++) sortedIndices[i] = i;
      sortedIndices.sort((a, b) => luminances[a] - luminances[b]);

      // Start with white canvas
      const blankData = new Uint8ClampedArray(data.length);
      for (let i = 0; i < pixelCount; i++) {
        const p = i * 4;
        blankData[p] = 255;
        blankData[p + 1] = 255;
        blankData[p + 2] = 255;
        blankData[p + 3] = 255;
      }

      // Clear canvas to white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      animate(ctx, imageData, sortedIndices, blankData, w, h);
    };
    img.src = sketchUrl;

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [sketchUrl, animate]);

  const remaining = Math.max(0, Math.ceil(((100 - progress) / 100) * (durationMs / 1000)));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Canvas */}
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-border glow-gold bg-card">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ display: "block" }}
        />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-foreground font-medium">{phase}</span>
          <span className="text-primary font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-muted-foreground text-xs text-center">
          {remaining > 0
            ? `~${mins > 0 ? `${mins}m ` : ""}${secs}s remaining`
            : "Complete!"}
        </p>
      </div>
    </div>
  );
};

export default DrawingCanvas;
