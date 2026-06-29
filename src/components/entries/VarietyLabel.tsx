import type { SerializedBigBagVariety } from "@/lib/validations";
import { VarietyOptionContent } from "@/components/entries/VarietySelect";

export function VarietyLabel({ variety }: { variety: SerializedBigBagVariety | null }) {
  if (!variety) return <>Big bag</>;
  return <VarietyOptionContent variety={variety} />;
}
