import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DestinationCard } from '../components/DestinationCard';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { RatingModal } from '../components/RatingModal';
import { GroupedSearchSuggest, GroupedSearchItem } from '../components/SearchSuggest';
import { DestinationTileSkeleton, ProductCardSkeleton } from '../components/ui/Skeletons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { trackSearchPerformed, trackContentView } from '../lib/analytics';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/modern-ui/breadcrumb';

interface SearchResultsPageProps {
  onBackHome?: () => void;
  onViewProfile?: (profileId: string) => void;
}

type FilterType = 'all' | 'destination' | 'product';
type SortOption = 'relevant' | 'rating-high' | 'rating-low' | 'newest';

interface DestinationResult {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  ratingAvg?: number;
  ratingCount?: number;
  postedByName?: string;
  postedByImageUrl?: string | null;
  postedById?: string | null;
  createdAt?: string | null;
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
}

interface ProductResult {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  ratingAvg?: number;
  ratingCount?: number;
  uploaderName?: string;
  uploaderImageUrl?: string | null;
  uploaderId?: string | null;
  createdAt?: string | null;
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
}

type ActiveProduct = {
  id: string;
  name: string;
  imageUrl: string;
  imageUrls?: string[];
  description?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  uploaderName?: string;
  uploaderImageUrl?: string | null;
  uploaderId?: string | null;
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
};

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ onBackHome, onViewProfile }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') ?? '';
  const typeParam = (searchParams.get('type') ?? 'all') as FilterType;
  const { user, profile } = useAuth();

  const shouldReduceMotion = useReducedMotion();
  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: 'easeOut' as const, delay: index * 0.04 },
        };

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [filterType, setFilterType] = useState<FilterType>(typeParam);
  const [sortOption, setSortOption] = useState<SortOption>('relevant');
  const [minRating, setMinRating] = useState<number>(0);
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string; type: 'destination' | 'product' } | null>(null);
  const [activeProduct, setActiveProduct] = useState<ActiveProduct | null>(null);

  // Fetch all destinations
  const { data: destinations = [], isPending: isDestinationsPending } = useQuery({
    queryKey: ['search-destinations'],
    queryFn: async () => {
      const { data: destinationRows, error: destinationError } = await supabase
        .from('destinations')
        .select('id, destination_name, description, image_url, image_urls, created_at, user_id, municipality, barangay, latitude, longitude, address');

      if (destinationError) throw destinationError;

      const { data: ratingRows } = await supabase
        .from('destination_ratings')
        .select('destination_id, rating');

      const ratingMap = new Map<string, { total: number; count: number }>();
      (ratingRows ?? []).forEach((row) => {
        const current = ratingMap.get(row.destination_id) ?? { total: 0, count: 0 };
        ratingMap.set(row.destination_id, {
          total: current.total + (row.rating ?? 0),
          count: current.count + 1,
        });
      });

      const userIds = Array.from(
        new Set((destinationRows ?? []).map((row) => row.user_id).filter(Boolean))
      ) as string[];

      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name, img_url')
        .in('id', userIds);

      const profileMap = new Map(profileRows?.map((p) => [p.id, p]) ?? []);

      return (destinationRows ?? []).map((row) => {
        const rating = ratingMap.get(row.id);
        const postedBy = row.user_id ? profileMap.get(row.user_id) : null;
        return {
          id: row.id,
          name: row.destination_name,
          description: row.description,
          imageUrl: row.image_url,
          imageUrls: row.image_urls ?? [],
          createdAt: row.created_at,
          ratingAvg: rating ? rating.total / rating.count : undefined,
          ratingCount: rating?.count,
          postedByName: postedBy?.full_name ?? (postedBy ? 'User' : undefined),
          postedByImageUrl: postedBy?.img_url ?? null,
          postedById: row.user_id ?? null,
          location: {
            municipality: row.municipality,
            barangay: row.barangay,
            lat: row.latitude,
            lng: row.longitude,
            address: row.address,
          },
        } as DestinationResult;
      });
    },
  });

  // Fetch all products
  const { data: products = [], isPending: isProductsPending } = useQuery({
    queryKey: ['search-products'],
    queryFn: async () => {
      const { data: productRows, error: productError } = await supabase
        .from('products')
        .select('id, product_name, description, image_url, image_urls, created_at, user_id, municipality, barangay, latitude, longitude, address');

      if (productError) throw productError;

      const { data: ratingRows } = await supabase
        .from('product_ratings')
        .select('product_id, rating');

      const ratingMap = new Map<string, { total: number; count: number }>();
      (ratingRows ?? []).forEach((row) => {
        const current = ratingMap.get(row.product_id) ?? { total: 0, count: 0 };
        ratingMap.set(row.product_id, {
          total: current.total + (row.rating ?? 0),
          count: current.count + 1,
        });
      });

      const userIds = Array.from(
        new Set((productRows ?? []).map((row) => row.user_id).filter(Boolean))
      ) as string[];

      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name, img_url')
        .in('id', userIds);

      const profileMap = new Map(profileRows?.map((p) => [p.id, p]) ?? []);

      return (productRows ?? []).map((row) => {
        const rating = ratingMap.get(row.id);
        const uploader = row.user_id ? profileMap.get(row.user_id) : null;
        return {
          id: row.id,
          name: row.product_name,
          description: row.description,
          imageUrl: row.image_url,
          imageUrls: row.image_urls ?? [],
          createdAt: row.created_at,
          ratingAvg: rating ? rating.total / rating.count : undefined,
          ratingCount: rating?.count,
          uploaderName: uploader?.full_name ?? (uploader ? 'User' : undefined),
          uploaderImageUrl: uploader?.img_url ?? null,
          uploaderId: row.user_id ?? null,
          location: {
            municipality: row.municipality,
            barangay: row.barangay,
            lat: row.latitude,
            lng: row.longitude,
            address: row.address,
          },
        } as ProductResult;
      });
    },
  });

  // Convert to GroupedSearchItem format for search suggestions
  const destinationSuggestions: GroupedSearchItem[] = useMemo(() =>
    destinations.map((d) => ({
      id: d.id,
      name: d.name,
      imageUrl: d.imageUrl,
      type: 'destination' as const,
      meta: d.location?.municipality ?? undefined,
      ratingAvg: d.ratingAvg,
    })),
    [destinations]
  );

  const productSuggestions: GroupedSearchItem[] = useMemo(() =>
    products.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      type: 'product' as const,
      meta: p.location?.municipality ?? undefined,
      ratingAvg: p.ratingAvg,
    })),
    [products]
  );

  // Filter results based on search query
  const filteredDestinations = useMemo(() => {
    const query = queryParam.toLowerCase();
    if (!query) return destinations;
    return destinations.filter((d) => {
      const name = d.name.toLowerCase();
      const description = d.description?.toLowerCase() ?? '';
      const municipality = d.location?.municipality?.toLowerCase() ?? '';
      return name.includes(query) || description.includes(query) || municipality.includes(query);
    });
  }, [destinations, queryParam]);

  const filteredProducts = useMemo(() => {
    const query = queryParam.toLowerCase();
    if (!query) return products;
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const description = p.description?.toLowerCase() ?? '';
      const municipality = p.location?.municipality?.toLowerCase() ?? '';
      return name.includes(query) || description.includes(query) || municipality.includes(query);
    });
  }, [products, queryParam]);

  // Apply filters (type and rating)
  const displayDestinations = useMemo(() => {
    if (filterType === 'product') return [];
    return filteredDestinations.filter((d) => (d.ratingAvg ?? 0) >= minRating);
  }, [filteredDestinations, filterType, minRating]);

  const displayProducts = useMemo(() => {
    if (filterType === 'destination') return [];
    return filteredProducts.filter((p) => (p.ratingAvg ?? 0) >= minRating);
  }, [filteredProducts, filterType, minRating]);

  // Sort results
  const sortedDestinations = useMemo(() => {
    const sorted = [...displayDestinations];
    switch (sortOption) {
      case 'rating-high':
        return sorted.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
      case 'rating-low':
        return sorted.sort((a, b) => (a.ratingAvg ?? 0) - (b.ratingAvg ?? 0));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
      default:
        return sorted;
    }
  }, [displayDestinations, sortOption]);

  const sortedProducts = useMemo(() => {
    const sorted = [...displayProducts];
    switch (sortOption) {
      case 'rating-high':
        return sorted.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
      case 'rating-low':
        return sorted.sort((a, b) => (a.ratingAvg ?? 0) - (b.ratingAvg ?? 0));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
      default:
        return sorted;
    }
  }, [displayProducts, sortOption]);

  const totalResults = sortedDestinations.length + sortedProducts.length;
  const isLoading = isDestinationsPending || isProductsPending;

  // Track page view
  useEffect(() => {
    if (queryParam) {
      trackContentView({
        contentId: `search-${queryParam}`,
        contentType: 'destination',
        userId: user?.id ?? null,
        userRole: profile?.role ?? null,
        pagePath: `/search?q=${queryParam}`,
      });
    }
  }, [queryParam, user?.id, profile?.role]);

  const handleSearch = (query: string) => {
    setSearchParams({ q: query, type: filterType });
  };

  const handleSelectItem = (item: GroupedSearchItem) => {
    if (item.type === 'destination') {
      navigate(`/destinations?highlight=${item.id}`);
    } else {
      navigate(`/products?highlight=${item.id}`);
    }
  };

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    setSearchParams({ q: queryParam, type });
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-4 sm:px-6 lg:px-10 pt-14 md:pt-24 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" onClick={(e) => { e.preventDefault(); onBackHome?.(); }}>
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Search Results</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {queryParam ? `Results for "${queryParam}"` : 'Search'}
          </h1>
          {queryParam && !isLoading && (
            <p className="text-muted-foreground">
              Found {totalResults} {totalResults === 1 ? 'result' : 'results'}
            </p>
          )}
        </motion.div>

        {/* Search bar with suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 flex justify-center"
        >
          <GroupedSearchSuggest
            value={searchQuery}
            onChange={setSearchQuery}
            destinations={destinationSuggestions}
            products={productSuggestions}
            placeholder="Search destinations, products..."
            onSelectItem={handleSelectItem}
            onSearch={handleSearch}
            className="w-full max-w-2xl"
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-8 flex flex-wrap gap-4 items-center"
        >
          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type:</span>
            <div className="flex gap-1">
              {(['all', 'destination', 'product'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'destination' ? 'Destinations' : 'Products'}
                </button>
              ))}
            </div>
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="min-rating-filter" className="text-sm text-muted-foreground">Min Rating:</label>
            <select
              id="min-rating-filter"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm border border-border"
            >
              <option value={0}>Any</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-filter" className="text-sm text-muted-foreground">Sort:</label>
            <select
              id="sort-filter"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm border border-border"
            >
              <option value="relevant">Most Relevant</option>
              <option value="rating-high">Highest Rated</option>
              <option value="rating-low">Lowest Rated</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Destinations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <DestinationTileSkeleton key={`dest-skeleton-${index}`} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <ProductCardSkeleton key={`prod-skeleton-${index}`} />
                ))}
              </div>
            </div>
          </div>
        ) : totalResults === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground mb-4">
              {queryParam
                ? `We couldn't find anything matching "${queryParam}"`
                : 'Enter a search term to find destinations and products'}
            </p>
            {queryParam && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-10">
            {/* Destinations Section */}
            {sortedDestinations.length > 0 && (
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold">
                    Destinations ({sortedDestinations.length})
                  </h2>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedDestinations.map((dest, index) => (
                    <motion.div key={dest.id} {...getItemMotion(index)}>
                      <DestinationCard
                        id={dest.id}
                        title={dest.name}
                        description={dest.description ?? ''}
                        imageUrl={dest.imageUrl ?? '/placeholder-destination.jpg'}
                        imageUrls={dest.imageUrls}
                        postedBy={dest.postedByName}
                        postedByImageUrl={dest.postedByImageUrl}
                        postedById={dest.postedById}
                        ratingAvg={dest.ratingAvg}
                        ratingCount={dest.ratingCount}
                        location={dest.location}
                        showDescription
                        showMeta
                        enableModal
                        onRate={() => setRatingTarget({ id: dest.id, name: dest.name, type: 'destination' })}
                        onProfileClick={onViewProfile}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Products Section */}
            {sortedProducts.length > 0 && (
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold">
                    Products ({sortedProducts.length})
                  </h2>
                </motion.div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {sortedProducts.map((prod, index) => (
                    <motion.div key={prod.id} {...getItemMotion(index)}>
                      <ProductCard
                        title={prod.name}
                        description={prod.description ?? ''}
                        imageUrl={prod.imageUrl ?? '/placeholder-product.jpg'}
                        ratingAvg={prod.ratingAvg}
                        ratingCount={prod.ratingCount}
                        uploaderName={prod.uploaderName}
                        uploaderImageUrl={prod.uploaderImageUrl}
                        uploaderId={prod.uploaderId}
                        location={prod.location}
                        showDescription
                        showMeta
                        onClick={() => setActiveProduct({
                          id: prod.id,
                          name: prod.name,
                          imageUrl: prod.imageUrl ?? '/placeholder-product.jpg',
                          imageUrls: prod.imageUrls,
                          description: prod.description,
                          ratingAvg: prod.ratingAvg,
                          ratingCount: prod.ratingCount,
                          uploaderName: prod.uploaderName,
                          uploaderImageUrl: prod.uploaderImageUrl,
                          uploaderId: prod.uploaderId,
                          location: prod.location,
                        })}
                        onRate={() => setRatingTarget({ id: prod.id, name: prod.name, type: 'product' })}
                        onProfileClick={onViewProfile}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {activeProduct && (
        <ProductModal
          open={Boolean(activeProduct)}
          onClose={() => setActiveProduct(null)}
          product={{
            id: activeProduct.id,
            name: activeProduct.name,
            imageUrl: activeProduct.imageUrl,
            imageUrls: activeProduct.imageUrls,
            description: activeProduct.description,
            ratingAvg: activeProduct.ratingAvg,
            ratingCount: activeProduct.ratingCount,
            uploaderName: activeProduct.uploaderName,
            uploaderImageUrl: activeProduct.uploaderImageUrl,
            uploaderId: activeProduct.uploaderId,
            location: activeProduct.location,
          }}
          onRate={() => {
            if (activeProduct) {
              setRatingTarget({ id: activeProduct.id, name: activeProduct.name, type: 'product' });
            }
          }}
          onProfileClick={onViewProfile}
        />
      )}

      {/* Rating Modal */}
      {ratingTarget && (
        <RatingModal
          open={Boolean(ratingTarget)}
          title={`Rate ${ratingTarget.name}`}
          onClose={() => setRatingTarget(null)}
        />
      )}
    </main>
  );
};
