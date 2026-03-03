import { motion } from "framer-motion";
import { Pencil, Palette } from "lucide-react";
import type { SketchMode } from "@/lib/api";

const graphiteTips = [
  "Analyzing composition…",
  "Mapping tonal gradients…",
  "Rendering graphite strokes…",
  "Refining fine details…",
  "Applying contrast and shading…",
];

const coloredTips = [
  "Analyzing color palette…",
  "Layering base pencil tones…",
  "Blending colored strokes…",
  "Adding cross-hatch texture…",
  "Refining vibrancy and detail…",
];

const SketchProgress = ({ mode = "graphite" }: { mode?: SketchMode }) => {
  const tips = mode === "colored" ? coloredTips : graphiteTips;
  const Icon = mode === "colored" ? Palette : Pencil;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-16"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary flex items-center justify-center"
      >
        <Icon className="w-6 h-6 text-primary" />
      </motion.div>

      <div className="text-center">
        <h3 className="font-serif text-xl text-foreground mb-2">
          {mode === "colored" ? "Creating Colored Sketch" : "Creating Your Sketch"}
        </h3>
        <div className="h-6 overflow-hidden">
          <motion.div
            animate={{ y: [0, -24, -48, -72, -96, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="flex flex-col"
          >
            {tips.map((tip) => (
              <p key={tip} className="text-muted-foreground text-sm h-6 flex items-center justify-center">
                {tip}
              </p>
            ))}
            <p className="text-muted-foreground text-sm h-6 flex items-center justify-center">
              {tips[0]}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 25, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
};

export default SketchProgress;
