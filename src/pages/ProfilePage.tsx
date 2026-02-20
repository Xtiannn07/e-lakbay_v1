import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion, easeOut } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DestinationTileSkeleton, ProfileHeaderSkeleton, ProductCardSkeleton, SkeletonList } from '../components/ui/Skeletons';
import { DestinationCard } from '../components/DestinationCard';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
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

interface ProfilePageProps {
  profileId: string;
  onBackHome?: () => void;
}

interface ProfileInfo {
  id: string;
  fullName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  battleCry?: string | null;
}

interface DestinationItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
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

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
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
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ profileId, onBackHome }) => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [destinationRatingTarget, setDestinationRatingTarget] = useState<{ id: string; name: string } | null>(null);
  const [productRatingTarget, setProductRatingTarget] = useState<{ id: string; name: string } | null>(null);
  const [activeProduct, setActiveProduct] = useState<ActiveProduct | null>(null);
  
  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: easeOut, delay: index * 0.04 },
        };
  const { data: profile, isPending: isProfilePending, isFetching: isProfileFetching } = useQuery({
    queryKey: ['profiles', profileId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, img_url, battle_cry')
          .eq('id', profileId)
          .single();

        if (error) {
          throw error;
        }

        return {
          id: data.id,
          fullName: data.full_name ?? null,
          email: data.email ?? null,
          imageUrl: data.img_url ?? null,
          battleCry: data.battle_cry ?? null,
        } as ProfileInfo;
      } catch (fetchError) {
        console.error('Failed to load profile:', fetchError);
        toast.error('Failed to load profile.');
        return null;
      }
    },
  });

  const {
    data: destinations = [],
    isPending: isDestinationsPending,
    isFetching: isDestinationsFetching,
  } = useQuery({
    queryKey: ['destinations', 'profile', profileId],
    queryFn: async () => {
      try {
        const { data: destinationRows, error: destinationError } = await supabase
          .from('destinations')
          .select('id, destination_name, description, image_url, image_urls, created_at, municipality, barangay, latitude, longitude, address')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (destinationError) {
          throw destinationError;
        }

        const { data: ratingRows, error: ratingError } = await supabase
          .from('destination_ratings')
          .select('destination_id, rating');

        if (ratingError) {
          throw ratingError;
        }

        const ratingMap = new Map<string, { total: number; count: number }>();
        (ratingRows ?? []).forEach((row) => {
          const current = ratingMap.get(row.destination_id) ?? { total: 0, count: 0 };
          ratingMap.set(row.destination_id, {
            total: current.total + (row.rating ?? 0),
            count: current.count + 1,
          });
        });

        return (destinationRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const imageUrls = (row as { image_urls?: string[] }).image_urls ?? [];
          return {
            id: row.id,
            name: row.destination_name,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            imageUrls,
            ratingAvg,
            ratingCount: rating?.count,
            location: {
              municipality: (row as { municipality?: string | null }).municipality ?? null,
              barangay: (row as { barangay?: string | null }).barangay ?? null,
              lat: (row as { latitude?: number | null }).latitude ?? null,
              lng: (row as { longitude?: number | null }).longitude ?? null,
              address: (row as { address?: string | null }).address ?? null,
            },
          } as DestinationItem;
        });
      } catch (fetchError) {
        console.error('Failed to load destinations:', fetchError);
        toast.error('Failed to load destinations.');
        return [] as DestinationItem[];
      }
    },
  });

  const {
    data: products = [],
    isPending: isProductsPending,
    isFetching: isProductsFetching,
  } = useQuery({
    queryKey: ['products', 'profile', profileId],
    queryFn: async () => {
      try {
        const { data: productRows, error: productError } = await supabase
          .from('products')
          .select('id, product_name, description, image_url, image_urls, created_at, municipality, barangay, latitude, longitude, address')
          .eq('user_id', profileId)
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

        return (productRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const imageUrls = (row as { image_urls?: string[] }).image_urls ?? [];
          return {
            id: row.id,
            name: row.product_name,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            imageUrls,
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
      } catch (fetchError) {
        console.error('Failed to load products:', fetchError);
        toast.error('Failed to load products.');
        return [] as ProductItem[];
      }
    },
  });

  const visibleDestinations = useMemo(() => destinations.filter((item) => item.imageUrl), [destinations]);
  const visibleProducts = useMemo(() => products.filter((item) => item.imageUrl), [products]);
  const showProfileSkeleton = isProfilePending || isProfileFetching;
  const showDestinationSkeletons =
    isDestinationsPending || (isDestinationsFetching && destinations.length === 0);
  const showProductSkeletons = isProductsPending || (isProductsFetching && products.length === 0);
  const displayName = profile?.fullName || profile?.email || 'Traveler';

  return (
    <main className="min-h-screen text-foreground pt-12 md:pt-20 pb-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
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
                  <BreadcrumbPage>Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mt-1 sm:mt-3 md:mt-5">
          {showProfileSkeleton ? (
            <ProfileHeaderSkeleton />
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-border bg-card/60 overflow-hidden flex items-center justify-center text-lg font-semibold">
                {profile?.imageUrl ? (
                  <img src={profile.imageUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold">{displayName}</h1>
                {profile?.battleCry && <p className="text-sm text-muted-foreground mt-1">{profile.battleCry}</p>}
              </div>
            </div>
          )}
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Destinations shared</h2>
            <span className="text-xs text-muted-foreground">{visibleDestinations.length} entries</span>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {showDestinationSkeletons ? (
              <SkeletonList
                count={3}
                render={(index) => <DestinationTileSkeleton key={`profile-destination-skeleton-${index}`} />}
              />
            ) : (
              visibleDestinations.map((destination, index) => (
                <motion.div key={destination.id} {...getItemMotion(index)}>
                  <DestinationCard
                    title={destination.name}
                    description={destination.description ?? 'A featured destination from Ilocos Sur.'}
                    imageUrl={destination.imageUrl ?? ''}
                    imageUrls={destination.imageUrls}
                    postedBy={displayName}
                    postedByImageUrl={profile?.imageUrl ?? null}
                    postedById={profileId}
                    ratingAvg={destination.ratingAvg}
                    ratingCount={destination.ratingCount}
                    location={destination.location}
                    showDescription
                    enableModal
                    onRate={() => {
                      setDestinationRatingTarget({ id: destination.id, name: destination.name });
                    }}
                  />
                </motion.div>
              ))
            )}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Products shared</h2>
            <span className="text-xs text-muted-foreground">{visibleProducts.length} entries</span>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {showProductSkeletons ? (
              <SkeletonList
                count={4}
                render={(index) => <ProductCardSkeleton key={`profile-product-skeleton-${index}`} />}
              />
            ) : (
              visibleProducts.map((product, index) => (
                <motion.div key={product.id} {...getItemMotion(index)}>
                  <ProductCard
                    title={product.name}
                    meta={displayName}
                    description={product.description ?? ''}
                    imageUrl={product.imageUrl ?? ''}
                    uploaderName={displayName}
                    uploaderImageUrl={profile?.imageUrl ?? null}
                    uploaderId={profileId}
                    ratingAvg={product.ratingAvg}
                    ratingCount={product.ratingCount}
                    location={product.location}
                    showDescription
                    showMeta
                    onClick={() =>
                      setActiveProduct({
                        id: product.id,
                        name: product.name,
                        imageUrl: product.imageUrl ?? '',
                        imageUrls: product.imageUrls,
                        description: product.description,
                        ratingAvg: product.ratingAvg,
                        ratingCount: product.ratingCount,
                        location: product.location,
                      })
                    }
                    onRate={() => {
                      setProductRatingTarget({ id: product.id, name: product.name });
                    }}
                  />
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>

      <RatingModal
        open={Boolean(destinationRatingTarget)}
        title={destinationRatingTarget ? `Rate Destination: ${destinationRatingTarget.name}` : 'Rate'}
        onClose={() => setDestinationRatingTarget(null)}
        onSubmit={async (rating, comment) => {
          if (!destinationRatingTarget) return;
          try {
            const { error } = await supabase.from('destination_ratings').insert({
              destination_id: destinationRatingTarget.id,
              user_id: profileId,
              rating,
              comment: comment || null,
            });

            if (error) {
              throw error;
            }

            queryClient.invalidateQueries({ queryKey: ['destinations', 'profile', profileId] });
            setDestinationRatingTarget(null);
            toast.success('Destination rated successfully!');
          } catch (error) {
            console.error('Failed to rate destination:', error);
            toast.error('Failed to rate destination.');
          }
        }}
      />

      <ProductModal
        open={Boolean(activeProduct)}
        product={
          activeProduct
            ? {
                ...activeProduct,
                uploaderName: displayName,
                uploaderImageUrl: profile?.imageUrl ?? null,
                uploaderId: profileId,
              }
            : null
        }
        onClose={() => setActiveProduct(null)}
        onRate={() => {
          if (!activeProduct) return;
          setProductRatingTarget({ id: activeProduct.id, name: activeProduct.name });
        }}
      />

      <RatingModal
        open={Boolean(productRatingTarget)}
        title={productRatingTarget ? `Rate Product: ${productRatingTarget.name}` : 'Rate'}
        onClose={() => setProductRatingTarget(null)}
        onSubmit={async (rating, comment) => {
          if (!productRatingTarget) return;
          try {
            const { error } = await supabase.from('product_ratings').insert({
              product_id: productRatingTarget.id,
              user_id: profileId,
              rating,
              comment: comment || null,
            });

            if (error) {
              throw error;
            }

            queryClient.invalidateQueries({ queryKey: ['products', 'profile', profileId] });
            setActiveProduct((prev) => {
              if (!prev || prev.id !== productRatingTarget.id) return prev;
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
            setProductRatingTarget(null);
            toast.success('Product rated successfully!');
          } catch (error) {
            console.error('Failed to rate product:', error);
            toast.error('Failed to rate product.');
          }
        }}
      />
    </main>
  );
};

export default ProfilePage;
