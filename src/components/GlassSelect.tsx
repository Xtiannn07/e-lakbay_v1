import React, { useEffect, useRef, useState } from 'react';

interface GlassSelectOption {
  value: string;
  label: string;
}

interface GlassSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  emptyText = 'No options',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;
  const displayLabel = selectedLabel || placeholder;
  const showEmpty = !loading && options.length === 0;

  const toggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className="w-full rounded-lg bg-white/20 backdrop-blur-md border border-white/15 px-4 py-2 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedLabel ? 'text-white' : 'text-white/60'}>{displayLabel}</span>
        <span className="text-white/60">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-white/15 bg-black/70 backdrop-blur-xl shadow-lg max-h-56 overflow-y-auto text-sm">
          {loading ? (
            <div className="px-4 py-2 text-white/70">{loadingText}</div>
          ) : showEmpty ? (
            <div className="px-4 py-2 text-white/10">{emptyText}</div>
          ) : (
            options.map((opt) => (
              <button
                type="button"
                key={opt.value}
                className={`w-full text-left px-4 py-2 hover:bg-white/20 transition-colors ${
                  value === opt.value ? 'bg-white/20 text-white' : 'text-white'
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
