import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon } from "lucide-react";

interface UploadZoneProps {
  onImageSelected: (base64: string) => void;
  disabled?: boolean;
}

const UploadZone = ({ onImageSelected, disabled }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("Image must be under 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onImageSelected(reader.result);
        }
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[280px] rounded-2xl border-2 border-dashed
          cursor-pointer transition-all duration-300
          ${disabled ? "opacity-50 pointer-events-none" : ""}
          ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-surface-hover"
          }
        `}
        tabIndex={0}
        role="button"
        aria-label="Upload an image"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            (e.currentTarget.querySelector("input") as HTMLInputElement)?.click();
          }
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={isDragging ? "drag" : "idle"}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-4 p-8"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isDragging ? (
                <ImageIcon className="w-7 h-7 text-primary" />
              ) : (
                <Upload className="w-7 h-7 text-primary" />
              )}
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium text-lg">
                {isDragging ? "Drop your image" : "Drag & drop your photo"}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                or click to browse · JPG, PNG, WebP · Max 10MB
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </label>
    </motion.div>
  );
};

export default UploadZone;
