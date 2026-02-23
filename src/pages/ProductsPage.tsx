import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { ProductCardSkeleton, SkeletonList } from '../components/ui/Skeletons';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { RatingModal } from '../components/RatingModal';
import { SearchSuggest } from '../components/SearchSuggest';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/modern-ui/breadcrumb';
import { useAuth } from '../components/AuthProvider';
import { trackContentView, trackFilterUsage, trackSearchPerformed } from '../lib/analytics';

interface ProductsPageProps {
  onBackHome?: () => void;
  onViewProfile?: (profileId: string) => void;
}

interface ProductItem {
  id: string;
  name: string;
  uploaderName: string;
  uploaderId?: string | null;
  uploaderImageUrl?: string | null;
  description: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  createdAt: string | null;
  ratingAvg?: number;
  ratingCount?: number;
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

export const ProductsPage: React.FC<ProductsPageProps> = ({ onBackHome, onViewProfile }) => {
  const shouldReduceMotion = useReducedMotion();
  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: 'easeOut', delay: index * 0.04 },
        };
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);
  const [activeProduct, setActiveProduct] = useState<ActiveProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: products = [],
    isPending: isProductsPending,
    isFetching: isProductsFetching,
  } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      try {
        const { data: productRows, error: productError } = await supabase
          .from('products')
          .select('id, product_name, description, image_url, image_urls, created_at, user_id, municipality, barangay, latitude, longitude, address')
          .order('created_at', { ascending: false });

        if (productError) {
          throw productError;
        }

        const { data: ratingRows, error: ratingError } = await supabase
          .from('product_ratings')
          .select('product_id, rating');

        if (ratingError) {
          throw ratingError;
        }

        const ratingMap = new Map<string, { total: number; count: number }>();
        (ratingRows ?? []).forEach((row) => {
          const current = ratingMap.get(row.product_id) ?? { total: 0, count: 0 };
          ratingMap.set(row.product_id, {
            total: current.total + (row.rating ?? 0),
            count: current.count + 1,
          });
        });

        const userIds = Array.from(new Set((productRows ?? []).map((row) => row.user_id).filter(Boolean))) as string[];
        const profilesById = new Map<string, { full_name?: string | null; email?: string | null; img_url?: string | null }>();
        if (userIds.length > 0) {
          const { data: profileRows, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email, img_url')
            .in('id', userIds);

          if (profileError) {
            throw profileError;
          }

          (profileRows ?? []).forEach((profile) => {
            profilesById.set(profile.id, profile);
          });
        }

        return (productRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const imageUrls = (row as { image_urls?: string[] }).image_urls ?? [];
          const typedRow = row as { user_id?: string | null };
          const profile = typedRow.user_id ? profilesById.get(typedRow.user_id) : undefined;
          const uploaderName = profile?.full_name || profile?.email || 'Traveler';
          return {
            id: row.id,
            name: row.product_name,
            uploaderName,
            uploaderId: typedRow.user_id ?? null,
            uploaderImageUrl: profile?.img_url ?? null,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            imageUrls,
            createdAt: row.created_at ?? null,
            ratingAvg,
            ratingCount: rating?.count,
            location: {
              municipality: (row as { municipality?: string | null }).municipality ?? null,
              barangay: (row as { barangay?: string | null }).barangay ?? null,
              lat: (row as { latitude?: number | null }).latitude ?? null,
              lng: (row as { longitude?: number | null }).longitude ?? null,
              address: (row as { address?: string | null }).address ?? null,
            },
          } as ProductItem;
        });
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products.');
        return [] as ProductItem[];
      }
    },
  });

  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      if (!item.imageUrl) return false;
      if (!query) return true;
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesDescription = item.description?.toLowerCase().includes(query) ?? false;
      const matchesUploader = item.uploaderName.toLowerCase().includes(query);
      const matchesMunicipality = item.location?.municipality?.toLowerCase().includes(query) ?? false;
      const matchesBarangay = item.location?.barangay?.toLowerCase().includes(query) ?? false;
      return matchesName || matchesDescription || matchesUploader || matchesMunicipality || matchesBarangay;
    });
  }, [products, searchQuery]);
  const showProductSkeletons = isProductsPending || (isProductsFetching && products.length === 0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') ?? '';
    setSearchQuery(query);
  }, [location.search]);

  useEffect(() => {
    if (isProductsPending || isProductsFetching) return;
    const query = searchQuery.trim();
    if (!query) return;

    void trackSearchPerformed({
      query,
      scope: 'products',
      resultCount: visibleProducts.length,
      userId: user?.id ?? null,
      userRole: profile?.role ?? null,
      pagePath: '/products',
      filters: { filter_name: 'search_query' },
    });

    void trackFilterUsage({
      scope: 'products',
      filterName: 'search_query',
      filterValue: query,
      userId: user?.id ?? null,
      userRole: profile?.role ?? null,
      pagePath: '/products',
      filters: { active_query: query },
    });
  }, [isProductsPending, isProductsFetching, searchQuery, visibleProducts.length, user?.id, profile?.role]);

  return (
    <main className="min-h-screen text-foreground pt-12 md:pt-20 pb-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {onBackHome && (
          <div className="flex justify-start">
            <Breadcrumb className="my-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      onBackHome();
                    }}
                  >
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Products</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Products</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover locally made products curated for travelers.
            </p>
          </div>
          <SearchSuggest
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products, makers, or locations"
            items={products
              .filter((item) => item.imageUrl)
              .map((item) => ({
                id: item.id,
                label: item.name,
                meta: item.uploaderName,
              }))}
            className="w-full sm:max-w-sm"
          />
        </div>

        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {showProductSkeletons ? (
              <SkeletonList
                count={8}
                render={(index) => <ProductCardSkeleton key={`product-skeleton-${index}`} />}
              />
            ) : (
              visibleProducts.map((product, index) => (
                <motion.div key={product.id} {...getItemMotion(index)}>
                  <ProductCard
                    title={product.name}
                    meta={product.uploaderName}
                    description={product.description ?? ''}
                    imageUrl={product.imageUrl ?? ''}
                    ratingAvg={product.ratingAvg}
                    ratingCount={product.ratingCount}
                    location={product.location}
                    showDescription
                    showMeta
                    onClick={() => {
                      void trackContentView({
                        contentType: 'product',
                        contentId: product.id,
                        ownerId: product.uploaderId ?? null,
                        userId: user?.id ?? null,
                        userRole: profile?.role ?? null,
                        pagePath: '/products',
                      });
                      setActiveProduct({
                        id: product.id,
                        name: product.name,
                        imageUrl: product.imageUrl ?? '',
                        imageUrls: product.imageUrls,
                        description: product.description,
                        ratingAvg: product.ratingAvg,
                        ratingCount: product.ratingCount,
                        uploaderName: product.uploaderName,
                        uploaderImageUrl: product.uploaderImageUrl,
                        uploaderId: product.uploaderId,
                        location: product.location,
                      });
                    }}
                    onRate={() => {
                      if (!user) {
                        toast.error('Please sign in to rate products.');
                        return;
                      }
                      setRatingTarget({ id: product.id, name: product.name });
                    }}
                  />
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>

      <ProductModal
        open={Boolean(activeProduct)}
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onProfileClick={onViewProfile}
        onRate={() => {
          if (!activeProduct) return;
          if (!user) {
            toast.error('Please sign in to rate products.');
            return;
          }
          setRatingTarget({ id: activeProduct.id, name: activeProduct.name });
        }}
      />

      <RatingModal
        open={Boolean(ratingTarget)}
        title={ratingTarget ? `Rate Product: ${ratingTarget.name}` : 'Rate'}
        onClose={() => setRatingTarget(null)}
        onSubmit={async (rating, comment) => {
          if (!ratingTarget || !user) return;
          try {
            const { error } = await supabase.from('product_ratings').insert({
              product_id: ratingTarget.id,
              user_id: user.id,
              rating,
              comment: comment || null,
            });

            if (error) {
              throw error;
            }

            queryClient.setQueryData<ProductItem[]>(['products', 'all'], (prev) => {
              if (!prev) return prev;
              return prev.map((item) => {
                if (item.id !== ratingTarget.id) return item;
                const currentCount = item.ratingCount ?? 0;
                const currentAvg = item.ratingAvg ?? 0;
                const nextCount = currentCount + 1;
                const nextAvg = (currentAvg * currentCount + rating) / nextCount;
                return {
                  ...item,
                  ratingAvg: nextAvg,
                  ratingCount: nextCount,
                };
              });
            });

            setActiveProduct((prev) => {
              if (!prev || prev.id !== ratingTarget.id) return prev;
              const currentCount = prev.ratingCount ?? 0;
              const currentAvg = prev.ratingAvg ?? 0;
              const nextCount = currentCount + 1;
              const nextAvg = (currentAvg * currentCount + rating) / nextCount;
              return {
                ...prev,
                ratingAvg: nextAvg,
                ratingCount: nextCount,
              };
            });

            toast.success('Thanks for your rating!');
            setRatingTarget(null);
          } catch (error) {
            console.error('Failed to submit rating:', error);
            toast.error('Failed to submit rating. Please try again.');
          }
        }}
      />
    </main>
  );
};
