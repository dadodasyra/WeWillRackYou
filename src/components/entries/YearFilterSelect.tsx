"use client";

type Props = {
  value: string;
  years: number[];
  onChange: (value: string) => void;
  className?: string;
};

export function YearFilterSelect({ value, years, onChange, className }: Props) {
  return (
    <label className={className ?? "block space-y-1"}>
      <span className="text-sm font-medium text-stone-700">Filtrer par année</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-stone-300 bg-white py-2.5 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">Toutes les années</option>
        {years.map((year) => (
          <option key={year} value={String(year)}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}
