import { supabase } from "@/integrations/supabase/client";
import type { SketchMode } from "@/lib/shared-state";
export type { SketchMode };

export interface SketchResult {
  sketch: string;
}

export async function generateSketch(imageBase64: string, mode: SketchMode = "graphite"): Promise<SketchResult> {
  const { data, error } = await supabase.functions.invoke("generate-sketch", {
    body: { image: imageBase64, mode },
  });

  if (error) {
    const msg = (error as any)?.message || "Failed to generate sketch";
    throw new Error(msg);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.sketch) {
    throw new Error("No sketch was returned. Please try again.");
  }

  return data as SketchResult;
}
