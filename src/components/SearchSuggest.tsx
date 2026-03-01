import React, { useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { trackSearchPerformed } from '../lib/analytics';
import { useAuth } from './AuthProvider';
import { SearchItemAvatar, SearchItemType } from './SearchItemAvatar';

export interface SearchSuggestItem {
  id: string;
  label: string;
  meta?: string;
}

// Extended interface for grouped search suggestions
export interface GroupedSearchItem {
  id: string;
  name: string;
  imageUrl: string | null;
  type: SearchItemType;
  meta?: string;
  ratingAvg?: number;
  ownerId?: string | null;
}

interface SearchSuggestProps {
  value: string;
  onChange: (value: string) => void;
  items: SearchSuggestItem[];
  placeholder?: string;
  className?: string;
  maxSuggestions?: number;
}

// New enhanced interface for grouped search
interface GroupedSearchSuggestProps {
  value: string;
  onChange: (value: string) => void;
  destinations: GroupedSearchItem[];
  products: GroupedSearchItem[];
  placeholder?: string;
  className?: string;
  maxSuggestionsPerGroup?: number;
  onSelectItem?: (item: GroupedSearchItem) => void;
  onSearch?: (query: string) => void;
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
  const { user, profile } = useAuth();

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
        <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl glass-secondary border border-white/10 ">
          <ul className="py-2 max-h-64 overflow-auto hide-scrollbar">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={async () => {
                    // Fire analytics event only when a suggestion is clicked
                    await trackSearchPerformed({
                      query: value,
                      scope: 'global', // or pass as prop if needed
                      resultCount: suggestions.length,
                      userId: user?.id ?? null,
                      userRole: profile?.role ?? null,
                      pagePath: window.location.pathname,
                      filters: {},
                    });
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

/**
 * Enhanced grouped search suggest component.
 * Shows destinations and products in separate groups with avatars.
 */
export const GroupedSearchSuggest: React.FC<GroupedSearchSuggestProps> = ({
  value,
  onChange,
  destinations,
  products,
  placeholder = 'Search destinations, products...',
  className,
  maxSuggestionsPerGroup = 5,
  onSelectItem,
  onSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile } = useAuth();

  // Filter destinations based on search query
  const filteredDestinations = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return destinations
      .filter((item) => {
        const name = item.name.toLowerCase();
        const meta = item.meta?.toLowerCase() ?? '';
        return name.includes(query) || meta.includes(query);
      })
      .slice(0, maxSuggestionsPerGroup);
  }, [destinations, maxSuggestionsPerGroup, value]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter((item) => {
        const name = item.name.toLowerCase();
        const meta = item.meta?.toLowerCase() ?? '';
        return name.includes(query) || meta.includes(query);
      })
      .slice(0, maxSuggestionsPerGroup);
  }, [products, maxSuggestionsPerGroup, value]);

  const hasResults = filteredDestinations.length > 0 || filteredProducts.length > 0;
  const totalResults = filteredDestinations.length + filteredProducts.length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;

    await trackSearchPerformed({
      query,
      scope: 'global',
      resultCount: totalResults,
      userId: user?.id ?? null,
      userRole: profile?.role ?? null,
      pagePath: window.location.pathname,
      filters: {},
    });

    setIsOpen(false);
    onSearch?.(query);
  };

  const handleSelectItem = async (item: GroupedSearchItem) => {
    await trackSearchPerformed({
      query: value,
      scope: item.type === 'destination' ? 'destinations' : 'products',
      resultCount: totalResults,
      userId: user?.id ?? null,
      userRole: profile?.role ?? null,
      pagePath: window.location.pathname,
      filters: { selectedType: item.type, selectedId: item.id },
      destinationId: item.type === 'destination' ? item.id : null,
      productId: item.type === 'product' ? item.id : null,
      ownerId: item.ownerId ?? null,
    });

    setIsOpen(false);
    onSelectItem?.(item);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full max-w-xl', className)}>
      <div className="glass-secondary rounded-full flex items-center gap-3 px-4 sm:px-6 py-1.5 text-foreground border border-white/10">
        {/* Search icon */}
        <svg
          className="h-5 w-5 text-white/60 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 150);
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-base sm:text-lg px-2 text-foreground placeholder:text-muted-foreground"
        />

        <button
          type="submit"
          className="px-4 sm:px-5 py-2 rounded-full bg-hero-gradient text-foreground sm:font-semibold text-xs sm:text-base transition-colors hover:brightness-110 shrink-0"
        >
          Search
        </button>
      </div>

      {/* Dropdown suggestions */}
      {isOpen && value.trim() && (
        <div className="absolute left-0 right-0 mt-2 z-[10000] rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 overflow-hidden">
          <div className="py-2 max-h-80 overflow-auto hide-scrollbar">
            {hasResults ? (
              <>
                {/* Destinations group */}
                {filteredDestinations.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Destinations
                    </div>
                    {filteredDestinations.map((item) => (
                      <SearchItemAvatar
                        key={`dest-${item.id}`}
                        id={item.id}
                        name={item.name}
                        imageUrl={item.imageUrl}
                        type="destination"
                        meta={item.meta}
                        onClick={() => handleSelectItem(item)}
                      />
                    ))}
                  </div>
                )}

                {/* Products group */}
                {filteredProducts.length > 0 && (
                  <div className={filteredDestinations.length > 0 ? 'border-t border-white/10 mt-2 pt-2' : ''}>
                    <div className="px-4 py-2 text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Products
                    </div>
                    {filteredProducts.map((item) => (
                      <SearchItemAvatar
                        key={`prod-${item.id}`}
                        id={item.id}
                        name={item.name}
                        imageUrl={item.imageUrl}
                        type="product"
                        meta={item.meta}
                        onClick={() => handleSelectItem(item)}
                      />
                    ))}
                  </div>
                )}

                {/* View all results hint */}
                <div className="px-4 py-2 border-t border-white/10 mt-2">
                  <p className="text-xs text-white/50 text-center">
                    Press Enter or click Search to see all results
                  </p>
                </div>
              </>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-white/60">No results found for "{value}"</p>
                <p className="text-xs text-white/40 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
};
