import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ProductCardSkeleton, SkeletonList } from '../components/ui/Skeletons';
import { ProductCard } from '../components/ProductCard';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface DashboardProductSectionProps {
  onRate?: (name: string) => void;
  userId?: string | null;
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
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
}

export const DashboardProductSection: React.FC<DashboardProductSectionProps> = ({ onRate, userId }) => {
  const shouldReduceMotion = useReducedMotion();
  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: 'easeOut', delay: index * 0.04 },
        };
  const {
    data: products = [],
    isPending: isProductsPending,
    isFetching: isProductsFetching,
  } = useQuery({
    queryKey: ['products', 'dashboard', userId ?? 'all'],
    queryFn: async () => {
      try {
        let query = supabase
          .from('products')
          .select('id, product_name, destination_name, description, image_url, image_urls, created_at, user_id, municipality, barangay, latitude, longitude, address')
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        let { data: productRows, error: productError } = await query;

        if (productError && userId && productError.message.toLowerCase().includes('user_id')) {
          const retry = await supabase
            .from('products')
            .select('id, product_name, destination_name, description, image_url, image_urls, created_at, user_id, municipality, barangay, latitude, longitude, address')
            .order('created_at', { ascending: false });
          productRows = retry.data ?? [];
          productError = retry.error ?? null;
        }

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

  const visibleProducts = useMemo(() => products.filter((item) => item.imageUrl), [products]);
  const showProductSkeletons = isProductsPending || (isProductsFetching && products.length === 0);

  return (
    <section id="products" className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="text-sm text-white/60">Featured items curated for travelers.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {showProductSkeletons ? (
          <SkeletonList
            count={4}
            render={(index) => <ProductCardSkeleton key={`product-card-skeleton-${index}`} />}
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
                onRate={onRate ? () => onRate(product.name) : undefined}
              />
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
};
