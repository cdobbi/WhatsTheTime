"use client";

import { useId, useState } from "react";
import { formatZoneLabel, searchTimeZones } from "@/lib/time/zones";
import type { TimeZoneOption } from "@/lib/time/types";

interface TimeZonePickerProps {
  label: string;
  value: string;
  options: TimeZoneOption[];
  onChange: (zoneId: string) => void;
  error?: string;
  hint?: string;
}

/** Searchable time-zone combobox following the WAI-ARIA APG combobox pattern. */
export default function TimeZonePicker({
  label,
  value,
  options,
  onChange,
  error,
  hint,
}: TimeZonePickerProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((option) => option.id === value);
  const results = query ? searchTimeZones(options, query) : [];
  const open = query !== null && results.length > 0;
  const displayValue = query ?? (selected ? formatZoneLabel(selected) : "");

  function choose(option: TimeZoneOption) {
    onChange(option.id);
    setQuery(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && open) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp" && open) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      choose(results[activeIndex]);
    } else if (event.key === "Escape") {
      setQuery(null);
    }
  }

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor={inputId} className="font-medium">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        placeholder="Type a city or country"
        value={displayValue}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
        }}
        onFocus={(event) => event.target.select()}
        onBlur={() => setQuery(null)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-zinc-500 bg-white px-3 py-2 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 aria-[invalid=true]:border-red-700 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:outline-blue-400 dark:aria-[invalid=true]:border-red-400"
      />
      {hint && (
        <p id={hintId} className="text-sm text-zinc-700 dark:text-zinc-300">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <ul
        id={listboxId}
        role="listbox"
        aria-label={label}
        hidden={!open}
        className="absolute top-full z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-zinc-400 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
      >
        {open &&
          results.map((option, index) => (
            <li
              key={option.id}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // Keep focus in the input so blur does not close the list before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className="flex cursor-pointer flex-wrap justify-between gap-x-3 px-3 py-2 aria-selected:bg-blue-100 dark:aria-selected:bg-blue-950"
            >
              <span>{formatZoneLabel(option)}</span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {option.abbreviation}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
