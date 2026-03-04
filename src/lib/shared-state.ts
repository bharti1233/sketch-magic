export type SketchMode = "graphite" | "colored" | "watercolor";

// Shared state for passing image between pages (sessionStorage has size limits)
let _sharedImage = "";
let _sharedMode: SketchMode = "graphite";

export function setSharedImage(image: string, mode: SketchMode) {
  _sharedImage = image;
  _sharedMode = mode;
}

export function getSharedImage(): { image: string; mode: SketchMode } {
  return { image: _sharedImage, mode: _sharedMode };
}

export function clearSharedImage() {
  _sharedImage = "";
  _sharedMode = "graphite";
}
