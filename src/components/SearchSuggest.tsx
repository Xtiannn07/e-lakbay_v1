import React, { useMemo, useState } from 'react';
import { cn } from '../lib/utils';

export interface SearchSuggestItem {
  id: string;
  label: string;
  meta?: string;
}

interface SearchSuggestProps {
  value: string;
  onChange: (value: string) => void;
  items: SearchSuggestItem[];
  placeholder?: string;
  className?: string;
  maxSuggestions?: number;
}

export const SearchSuggest: React.FC<SearchSuggestProps> = ({
  value,
  onChange,
  items,
  placeholder = 'Search...',
  className,
  maxSuggestions = 6,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return items
      .filter((item) => {
        const label = item.label.toLowerCase();
        const meta = item.meta?.toLowerCase() ?? '';
        return label.includes(query) || meta.includes(query);
      })
      .slice(0, maxSuggestions);
  }, [items, maxSuggestions, value]);

  return (
    <div className={cn('relative w-full max-w-xl', className)}>
      <div className="glass-secondary rounded-2xl sm:rounded-full flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-2 text-white border border-white/10">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-base sm:text-lg px-2 text-white placeholder:text-white/70"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl glass-secondary border border-white/10">
          <ul className="py-2 max-h-64 overflow-auto">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(item.label);
                    setIsOpen(false);
                  }}
                >
                  <div className="font-medium text-white">{item.label}</div>
                  {item.meta && <div className="text-xs text-white/60">{item.meta}</div>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
