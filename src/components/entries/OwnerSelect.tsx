"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_OWNER_NAME } from "@/lib/owners";
import type { SerializedOwner } from "@/lib/validations";
import { Select } from "@/components/ui/Select";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  onBlur?: () => void;
  /** Présélectionner EARL Beiner à la création si aucune valeur. */
  defaultToEarlBeiner?: boolean;
};

export function OwnerSelect({
  label,
  value,
  onChange,
  required,
  error,
  onBlur,
  defaultToEarlBeiner,
}: Props) {
  const [owners, setOwners] = useState<SerializedOwner[]>([]);

  const load = useCallback(async () => {
    const response = await fetch("/api/owners");
    if (response.ok) setOwners(await response.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!defaultToEarlBeiner || value || owners.length === 0) return;
    const defaultOwner = owners.find((o) => o.name === DEFAULT_OWNER_NAME);
    if (defaultOwner) onChange(defaultOwner.id);
  }, [defaultToEarlBeiner, value, owners, onChange]);

  const options = owners.map((owner) => ({
    value: owner.id,
    label: owner.name,
  }));

  return (
    <Select
      label={required ? `${label} *` : label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      error={error}
      options={[{ value: "", label: "- Sélectionner -" }, ...options]}
      required={required}
    />
  );
}
