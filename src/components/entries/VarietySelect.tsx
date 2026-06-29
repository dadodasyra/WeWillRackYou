"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VarietyColorSwatch } from "@/components/entries/VarietyColorSwatch";
import type { SerializedBigBagVariety } from "@/lib/validations";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function VarietySelect({ label, value, onChange }: Props) {
  const [varieties, setVarieties] = useState<SerializedBigBagVariety[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/big-bag-varieties");
    if (response.ok) setVarieties(await response.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = varieties.find((v) => v.id === value) ?? null;

  function selectVariety(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl border border-stone-300 bg-white px-3 py-3 text-left text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      >
        {selected ? (
          <VarietyOptionContent variety={selected} />
        ) : (
          <span className="text-stone-500">— Non renseigné —</span>
        )}
      </button>

      {open ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          <li>
            <button
              type="button"
              onClick={() => selectVariety("")}
              className="flex w-full px-3 py-2 text-left text-stone-500 hover:bg-stone-50"
            >
              — Non renseigné —
            </button>
          </li>
          {varieties.map((variety) => (
            <li key={variety.id}>
              <button
                type="button"
                onClick={() => selectVariety(variety.id)}
                className={`flex w-full px-3 py-2 text-left hover:bg-stone-50 ${
                  variety.id === value ? "bg-emerald-50" : ""
                }`}
              >
                <VarietyOptionContent variety={variety} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function VarietyOptionContent({ variety }: { variety: SerializedBigBagVariety }) {
  return (
    <span className="flex items-center gap-2">
      <VarietyColorSwatch variety={variety} />
      <span className="text-stone-800">{variety.name}</span>
    </span>
  );
}
