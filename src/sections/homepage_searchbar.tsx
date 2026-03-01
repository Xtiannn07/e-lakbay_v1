import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../lib/utils';
import { trackSearchPerformed } from '../lib/analytics';
import { GroupedSearchSuggest, GroupedSearchItem } from '../components/SearchSuggest';
import { supabase } from '../lib/supabaseClient';

interface HomepageSearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export const HomepageSearchBar: React.FC<HomepageSearchBarProps> = ({
  className,
  placeholder = 'Search...',
  onSearch,
}) => {
  const [value, setValue] = React.useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Fire analytics only on submit
    await trackSearchPerformed({
      query: value,
      scope: 'global', // or customize as needed
      resultCount: null,
      pagePath: window.location.pathname,
      filters: {},
    });
    onSearch?.(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'glass-secondary rounded-full flex items-center gap-3 px-4 sm:px-6 py-1.5 w-full max-w-xl text-foreground overflow-hidden',
        className
      )}
    >
      <input
        type="text"
        className="flex-1 min-w-0 bg-transparent outline-none text-base sm:text-lg px-2 text-foreground placeholder:text-muted-foreground"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type="submit"
        className="px-4 sm:px-5 py-2 rounded-full bg-hero-gradient text-foreground sm:font-semibold text-xs sm:text-base transition-colors hover:brightness-110 shrink-0"
      >
        Search
      </button>
    </form>
  );
};

/**
 * Enhanced homepage search bar with grouped suggestions for destinations and products.
 * Shows autocomplete suggestions as the user types.
 */
interface HomepageSearchWithSuggestionsProps {
  className?: string;
  onSelectDestination?: (id: string) => void;
  onSelectProduct?: (id: string) => void;
}

export const HomepageSearchWithSuggestions: React.FC<HomepageSearchWithSuggestionsProps> = ({
  className,
  onSelectDestination,
  onSelectProduct,
}) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');

  // Fetch destinations for suggestions
  const { data: destinations = [] } = useQuery({
    queryKey: ['homepage-search-destinations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('destinations')
        .select('id, destination_name, image_url, municipality, user_id')
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch products for suggestions
  const { data: products = [] } = useQuery({
    queryKey: ['homepage-search-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, product_name, image_url, municipality, user_id')
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Convert to GroupedSearchItem format
  const destinationSuggestions: GroupedSearchItem[] = useMemo(() =>
    destinations.map((d) => ({
      id: d.id,
      name: d.destination_name,
      imageUrl: d.image_url,
      type: 'destination' as const,
      meta: d.municipality ?? undefined,
      ownerId: d.user_id ?? null,
    })),
    [destinations]
  );

  const productSuggestions: GroupedSearchItem[] = useMemo(() =>
    products.map((p) => ({
      id: p.id,
      name: p.product_name,
      imageUrl: p.image_url,
      type: 'product' as const,
      meta: p.municipality ?? undefined,
      ownerId: p.user_id ?? null,
    })),
    [products]
  );

  const handleSelectItem = (item: GroupedSearchItem) => {
    if (item.type === 'destination') {
      onSelectDestination?.(item.id);
      navigate(`/destinations?highlight=${item.id}`);
    } else {
      onSelectProduct?.(item.id);
      navigate(`/products?highlight=${item.id}`);
    }
  };

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <GroupedSearchSuggest
      value={searchValue}
      onChange={setSearchValue}
      destinations={destinationSuggestions}
      products={productSuggestions}
      placeholder="Search destinations, products..."
      onSelectItem={handleSelectItem}
      onSearch={handleSearch}
      className={className}
    />
  );
};
