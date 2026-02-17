import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductTileSkeleton, SkeletonList } from '../components/ui/Skeletons';
import { RatingModal } from '../components/RatingModal';
import { ProductModal } from '../components/ProductModal';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  createdAt: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  uploaderName: string;
  uploaderImageUrl?: string | null;
  uploaderId?: string | null;
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
}

interface HomepageProductSectionProps {
  onViewProfile?: (profileId: string) => void;
  onViewProducts?: () => void;
}

export const HomepageProductSection: React.FC<HomepageProductSectionProps> = ({
  onViewProfile,
  onViewProducts,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeProduct, setActiveProduct] = useState<{
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
  } | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{
    type: 'Product' | 'Destination';
    name: string;
    id: string;
  } | null>(null);

  const {
    data: localProducts = [],
    isPending: isProductsPending,
    isFetching: isProductsFetching,
  } = useQuery({
    queryKey: ['products', 'home'],
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

        const userIds = Array.from(
          new Set((productRows ?? []).map((row) => row.user_id).filter(Boolean)),
        ) as string[];

        const profilesById = new Map<
          string,
          { full_name?: string | null; email?: string | null; img_url?: string | null }
        >();
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

        const mapped = (productRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const imageUrls = (row as { image_urls?: string[] }).image_urls ?? [];
          const typedRow = row as { user_id?: string | null };
          const profile = typedRow.user_id ? profilesById.get(typedRow.user_id) : undefined;
          const uploaderName = profile?.full_name || profile?.email || 'Traveler';
          return {
            id: row.id,
            name: row.product_name,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            imageUrls,
            createdAt: row.created_at ?? null,
            ratingAvg,
            ratingCount: rating?.count,
            uploaderName,
            uploaderImageUrl: profile?.img_url ?? null,
            uploaderId: typedRow.user_id ?? null,
            location: {
              municipality: (row as { municipality?: string | null }).municipality ?? null,
              barangay: (row as { barangay?: string | null }).barangay ?? null,
              lat: (row as { latitude?: number | null }).latitude ?? null,
              lng: (row as { longitude?: number | null }).longitude ?? null,
              address: (row as { address?: string | null }).address ?? null,
            },
          } as ProductItem;
        });

        const sorted = [...mapped].sort((a, b) => {
          const aRated = typeof a.ratingAvg === 'number';
          const bRated = typeof b.ratingAvg === 'number';
          if (aRated && bRated) {
            return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
          }
          if (aRated) return -1;
          if (bRated) return 1;
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });

        return sorted.slice(0, 12);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products.');
        return [] as ProductItem[];
      }
    },
  });

  const visibleProducts = useMemo(
    () => localProducts.filter((item) => item.imageUrl),
    [localProducts],
  );
  const showProductSkeletons = isProductsPending || (isProductsFetching && localProducts.length === 0);

  return (
    <>
      <section id="products" className="mt-12">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-extrabold">Local Products</h1>
          <p className="mt-3 text-sm text-white/70">
            "Experience the best of Ilocos Sur's products"
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {showProductSkeletons ? (
            <SkeletonList
              count={12}
              render={(index) => <ProductTileSkeleton key={`product-skeleton-${index}`} />}
            />
          ) : (
            visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                title={product.name}
                imageUrl={product.imageUrl ?? ''}
                ratingAvg={product.ratingAvg}
                ratingCount={product.ratingCount}
                uploaderName={product.uploaderName}
                uploaderImageUrl={product.uploaderImageUrl}
                uploaderId={product.uploaderId}
                location={product.location}
                onProfileClick={onViewProfile}
                imageClassName="aspect-[3/4]"
                className="rounded-bl-2xl rounded-tr-2xl border border-white/10 bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                onClick={() =>
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
                  })}
              />
            ))
          )}
        </div>
        <div className="mt-6 flex flex-row items-center justify-center gap-1 text-sm md:text-base text-white/80">
          <p>Want to see more products?</p>
          <button
            type="button"
            onClick={onViewProducts}
            className="text-white underline underline-offset-4 hover:text-white/70"
          >
            Click here to view more
          </button>
        </div>
      </section>

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
          setRatingTarget({ type: 'Product', name: activeProduct.name, id: activeProduct.id });
        }}
      />

      <RatingModal
        open={Boolean(ratingTarget)}
        title={ratingTarget ? `Rate ${ratingTarget.type}: ${ratingTarget.name}` : 'Rate'}
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

            queryClient.setQueryData<ProductItem[]>(['products', 'home'], (prev) => {
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
    </>
  );
};
