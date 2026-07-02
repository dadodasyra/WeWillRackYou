"use client";

import { useCallback, useEffect, useState } from "react";
import { VarietyColorSwatch } from "@/components/entries/VarietyColorSwatch";
import type { SerializedBigBagVariety } from "@/lib/validations";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function VarietyFilterSelect({ value, onChange, className }: Props) {
  const [varieties, setVarieties] = useState<SerializedBigBagVariety[]>([]);

  const load = useCallback(async () => {
    const response = await fetch("/api/big-bag-varieties");
    if (response.ok) setVarieties(await response.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = varieties.find((v) => v.id === value);

  return (
    <label className={className ?? "block space-y-1"}>
      <span className="text-sm font-medium text-stone-700">Filtrer par variété</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-stone-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Toutes les variétés</option>
          {varieties.map((variety) => (
            <option key={variety.id} value={variety.id}>
              {variety.name}
            </option>
          ))}
        </select>
        {selected ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <VarietyColorSwatch variety={selected} size="sm" />
          </span>
        ) : null}
      </div>
    </label>
  );
}
