import { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({ label, error, options, id, className = "", ...props }: Props) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block space-y-1" htmlFor={selectId}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <select
        id={selectId}
        className={`w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
