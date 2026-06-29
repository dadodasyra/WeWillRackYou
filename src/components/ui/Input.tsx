import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const borderClass = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-100"
    : "border-stone-300 focus:border-emerald-600 focus:ring-emerald-100";
  return (
    <label className="block space-y-1" htmlFor={inputId}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white px-3 py-3 text-base outline-none focus:ring-2 ${borderClass} ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
