import { VarietyColorSwatch } from "@/components/entries/VarietyColorSwatch";
import type { SerializedBigBagVariety } from "@/lib/validations";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isBarred?: boolean;
  id?: string;
};

export function ColorInput({ label, value, onChange, isBarred = false, id }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="block space-y-1" htmlFor={inputId}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="flex items-center gap-3">
        <input
          id={inputId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-14 cursor-pointer rounded-xl border border-stone-300 bg-white p-1"
        />
        <VarietyColorSwatch
          variety={{ color: value, isBarred }}
          size="lg"
          className="rounded-xl"
        />
        <span className="rounded-xl bg-stone-50 px-3 py-3 font-mono text-sm text-stone-600">
          {value}
        </span>
      </div>
    </label>
  );
}
