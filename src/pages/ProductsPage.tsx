import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductCardSkeleton, SkeletonList } from '../components/hero-ui/Skeletons';
import { ProductCard } from '../components/ProductCard';
import { RatingModal } from '../components/RatingModal';
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

interface ProductsPageProps {
  onBackHome?: () => void;
}

interface ProductItem {
  id: string;
  name: string;
  uploaderName: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  ratingAvg?: number;
  ratingCount?: number;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onBackHome }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);

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
          .select('id, product_name, description, image_url, image_urls, created_at, user_id')
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
        const profilesById = new Map<string, { full_name?: string | null; email?: string | null }>();
        if (userIds.length > 0) {
          const { data: profileRows, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
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
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            createdAt: row.created_at ?? null,
            ratingAvg,
            ratingCount: rating?.count,
          } as ProductItem;
        });
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products.');
        return [] as ProductItem[];
      }
    },
  });

  const visibleProducts = useMemo(() => products.filter((item) => item.imageUrl), [products]);
  const showProductSkeletons = isProductsPending || (isProductsFetching && products.length === 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-12 md:pt-20 pb-12 px-4 sm:px-6 lg:px-10">
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
            <p className="mt-2 text-sm text-white/70">
              Discover locally made products curated for travelers.
            </p>
          </div>
        </div>

        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {showProductSkeletons ? (
              <SkeletonList
                count={8}
                render={(index) => <ProductCardSkeleton key={`product-skeleton-${index}`} />}
              />
            ) : (
              visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  title={product.name}
                  meta={product.uploaderName}
                  description={product.description ?? ''}
                  imageUrl={product.imageUrl ?? ''}
                  ratingAvg={product.ratingAvg}
                  ratingCount={product.ratingCount}
                  showDescription
                  showMeta
                  onRate={() => {
                    if (!user) {
                      toast.error('Please sign in to rate products.');
                      return;
                    }
                    setRatingTarget({ id: product.id, name: product.name });
                  }}
                />
              ))
            )}
          </div>
        </section>
      </div>

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
