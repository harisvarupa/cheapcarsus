"use client";

import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

type CustomSelectProps = {
  label: string;
  value: string;
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CustomSelect({
  label,
  value,
  options,
  placeholder = "Any",
  onChange,
  className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  return (
    <div className={cn("relative", className)}>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-800 shadow-sm transition hover:border-orange-300 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100"
      >
        <span>{selected?.label || placeholder}</span>
        <ChevronDown
          size={18}
          className={cn("text-slate-400 transition", open ? "rotate-180 text-orange-500" : "")}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
          <SelectOption
            label={placeholder}
            active={!value}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          />
          {options.map((option) => (
            <SelectOption
              key={option.value}
              label={option.label}
              active={value === option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SelectOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition",
        active ? "bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50",
      )}
    >
      <span>{label}</span>
      {active ? <Check size={16} /> : null}
    </button>
  );
}
