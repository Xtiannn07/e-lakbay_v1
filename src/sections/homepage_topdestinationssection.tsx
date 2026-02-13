import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SkeletonList, TopDestinationSkeleton } from '../components/hero-ui/Skeletons';
import { DestinationModalCard } from '../components/DestinationModalCard';
import { RatingModal } from '../components/RatingModal';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

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

interface HomepageTopDestinationsSectionProps {
  onViewMore?: () => void;
  onViewProfile?: (profileId: string) => void;
}

export const HomepageTopDestinationsSection: React.FC<HomepageTopDestinationsSectionProps> = ({
  onViewMore,
  onViewProfile,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeDestination, setActiveDestination] = useState<{
    id: string;
    name: string;
    imageUrl: string;
    imageUrls?: string[];
    description?: string | null;
    ratingAvg?: number;
    ratingCount?: number;
    postedByName?: string;
    postedByImageUrl?: string | null;
    postedById?: string | null;
  } | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!activeDestination) return;
    const handleScroll = () => setActiveDestination(null);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeDestination]);

  const {
    data: destinations = [],
    isPending: isDestinationsPending,
    isFetching: isDestinationsFetching,
  } = useQuery({
    queryKey: ['destinations', 'top'],
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

        const mapped = (destinationRows ?? []).map((row) => {
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

        return sorted.slice(0, 10);
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
    <section className="mt-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold">Top Destinations</h2>
        <p className="mt-3 text-sm text-white/70">
          "Discover the heart of Ilocos Sur — where culture, nature, and history meet."
        </p>
      </div>

      <div className="mt-8">
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex gap-5 pr-[12.5%] pl-[12.5%] -ml-[12.5%]">
            {showDestinationSkeletons ? (
              <SkeletonList
                count={4}
                render={(index) => <TopDestinationSkeleton key={`top-destination-skeleton-${index}`} />}
              />
            ) : (
              visibleDestinations.map((destination) => (
                <button
                  key={destination.id}
                  type="button"
                  onClick={() =>
                    setActiveDestination({
                      id: destination.id,
                      name: destination.name,
                      imageUrl: destination.imageUrl ?? '',
                      imageUrls: destination.imageUrls,
                      description: destination.description,
                      ratingAvg: destination.ratingAvg,
                      ratingCount: destination.ratingCount,
                      postedByName: destination.postedByName,
                      postedByImageUrl: destination.postedByImageUrl,
                      postedById: destination.postedById,
                    })}
                  className="relative min-w-[60%] sm:min-w-[40%] lg:min-w-[35%] aspect-square overflow-hidden border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <img
                    src={destination.imageUrl ?? ''}
                    alt={destination.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
                    <p className="text-sm sm:text-base font-semibold text-white">{destination.name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 text-sm md:text-base text-white/80">
          <p>Want to see more destinations?</p>
          <button
            type="button"
            onClick={onViewMore}
            className="text-white underline underline-offset-4 hover:text-white/90"
          >
            click here to view more
          </button>
        </div>
      </div>

      {activeDestination && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onClick={() => setActiveDestination(null)}
        >
          <div
            className="max-w-5xl w-full max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar"
            role="dialog"
            aria-modal="true"
            aria-labelledby="top-destination-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <DestinationModalCard
              title={activeDestination.name}
              description={activeDestination.description || 'A featured destination from Ilocos Sur.'}
              imageUrl={activeDestination.imageUrl}
              imageUrls={activeDestination.imageUrls}
              meta="Featured destination"
              postedBy={activeDestination.postedByName ?? 'Tourism Office'}
              postedByImageUrl={activeDestination.postedByImageUrl}
              postedById={activeDestination.postedById}
              ratingAvg={activeDestination.ratingAvg}
              ratingCount={activeDestination.ratingCount}
              onProfileClick={onViewProfile}
              onRate={() => {
                if (!user) {
                  toast.error('Please sign in to rate destinations.');
                  return;
                }
                setRatingTarget({ id: activeDestination.id, name: activeDestination.name });
              }}
            />
          </div>
        </div>
      )}

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

            queryClient.setQueryData<DestinationItem[]>(['destinations', 'top'], (prev) => {
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

            setActiveDestination((prev) => {
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
    </section>
  );
};
