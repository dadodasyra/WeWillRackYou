import type { SerializedBigBagVariety } from "@/lib/validations";
import { varietySwatchStyle } from "@/lib/variety-color";

type Props = {
  variety: Pick<SerializedBigBagVariety, "color" | "isBarred">;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
} as const;

export function VarietyColorSwatch({ variety, size = "md", className = "" }: Props) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border border-stone-300 ${sizeClass[size]} ${className}`}
      style={varietySwatchStyle({ color: variety.color, isBarred: variety.isBarred })}
    />
  );
}
