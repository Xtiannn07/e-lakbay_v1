import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DestinationTileSkeleton, SkeletonList } from '../components/hero-ui/Skeletons';
import { DestinationTile } from '../components/DestinationTile';
import { RatingModal } from '../components/RatingModal';
import { useAuth } from '../components/AuthProvider';
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

interface DestinationsPageProps {
  onBackHome?: () => void;
  onViewProfile?: (profileId: string) => void;
}

interface DestinationItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  createdAt: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  postedByName?: string;
  postedByImageUrl?: string | null;
  postedById?: string | null;
}

export const DestinationsPage: React.FC<DestinationsPageProps> = ({ onBackHome, onViewProfile }) => {
  const shouldReduceMotion = useReducedMotion();
  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: 'easeOut', delay: index * 0.04 },
        };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);
  const {
    data: destinations = [],
    isPending: isDestinationsPending,
    isFetching: isDestinationsFetching,
  } = useQuery({
    queryKey: ['destinations', 'all'],
    queryFn: async () => {
      try {
        const { data: destinationRows, error: destinationError } = await supabase
          .from('destinations')
          .select('id, destination_name, description, image_url, image_urls, created_at, user_id')
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

        const userIds = Array.from(
          new Set((destinationRows ?? []).map((row) => row.user_id).filter(Boolean)),
        ) as string[];

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

        return (destinationRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const typedRow = row as { image_urls?: string[]; user_id?: string | null };
          const imageUrls = typedRow.image_urls ?? [];
          const profile = typedRow.user_id ? profilesById.get(typedRow.user_id) : undefined;
          const postedByName = profile?.full_name || profile?.email || 'Traveler';
          return {
            id: row.id,
            name: row.destination_name,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            imageUrls,
            createdAt: row.created_at ?? null,
            ratingAvg,
            ratingCount: rating?.count,
            postedByName,
            postedByImageUrl: profile?.img_url ?? null,
            postedById: typedRow.user_id ?? null,
          } as DestinationItem;
        });
      } catch (error) {
        console.error('Failed to load destinations:', error);
        toast.error('Failed to load destinations.');
        return [] as DestinationItem[];
      }
    },
  });

  const visibleDestinations = useMemo(() => destinations.filter((item) => item.imageUrl), [destinations]);
  const showDestinationSkeletons =
    isDestinationsPending || (isDestinationsFetching && destinations.length === 0);

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
                  <BreadcrumbPage>Destinations</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Destinations</h1>
            <p className="mt-2 text-sm text-white/70">
              Explore every destination shared by the community.
            </p>
          </div>
        </div>

        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {showDestinationSkeletons ? (
              <SkeletonList
                count={6}
                render={(index) => <DestinationTileSkeleton key={`destination-skeleton-${index}`} />}
              />
            ) : (
              visibleDestinations.map((destination, index) => (
                <motion.div key={destination.id} {...getItemMotion(index)}>
                  <DestinationTile
                    title={destination.name}
                    description={destination.description ?? 'A featured destination from Ilocos Sur.'}
                    imageUrl={destination.imageUrl ?? ''}
                    imageUrls={destination.imageUrls}
                    meta="Uploaded destination"
                    postedBy={destination.postedByName ?? 'Community'}
                    postedByImageUrl={destination.postedByImageUrl}
                    postedById={destination.postedById}
                    ratingAvg={destination.ratingAvg}
                    ratingCount={destination.ratingCount}
                    enableModal
                    onProfileClick={onViewProfile}
                    onRate={() => {
                      if (!user) {
                        toast.error('Please sign in to rate destinations.');
                        return;
                      }
                      setRatingTarget({ id: destination.id, name: destination.name });
                    }}
                  />
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>

      <RatingModal
        open={Boolean(ratingTarget)}
        title={ratingTarget ? `Rate Destination: ${ratingTarget.name}` : 'Rate'}
        onClose={() => setRatingTarget(null)}
        onSubmit={async (rating, comment) => {
          if (!ratingTarget || !user) return;
          try {
            const { error } = await supabase.from('destination_ratings').insert({
              destination_id: ratingTarget.id,
              user_id: user.id,
              rating,
              comment: comment || null,
            });

            if (error) {
              throw error;
            }

            queryClient.setQueryData<DestinationItem[]>(['destinations', 'all'], (prev) => {
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
