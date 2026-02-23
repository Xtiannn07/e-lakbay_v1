import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { DestinationTileSkeleton, SkeletonList } from '../components/ui/Skeletons';
import { DestinationCard } from '../components/DestinationCard';
import { RatingModal } from '../components/RatingModal';
import { SearchSuggest } from '../components/SearchSuggest';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { trackContentView, trackFilterUsage, trackSearchPerformed } from '../lib/analytics';
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
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
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
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
          .select('id, destination_name, description, image_url, image_urls, created_at, user_id, municipality, barangay, latitude, longitude, address')
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
            location: {
              municipality: (row as { municipality?: string | null }).municipality ?? null,
              barangay: (row as { barangay?: string | null }).barangay ?? null,
              lat: (row as { latitude?: number | null }).latitude ?? null,
              lng: (row as { longitude?: number | null }).longitude ?? null,
              address: (row as { address?: string | null }).address ?? null,
            },
          } as DestinationItem;
        });
      } catch (error) {
        console.error('Failed to load destinations:', error);
        toast.error('Failed to load destinations.');
        return [] as DestinationItem[];
      }
    },
  });

  const visibleDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return destinations.filter((item) => {
      if (!item.imageUrl) return false;
      if (!query) return true;
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesDescription = item.description?.toLowerCase().includes(query) ?? false;
      const matchesPoster = item.postedByName?.toLowerCase().includes(query) ?? false;
      const matchesMunicipality = item.location?.municipality?.toLowerCase().includes(query) ?? false;
      const matchesBarangay = item.location?.barangay?.toLowerCase().includes(query) ?? false;
      return matchesName || matchesDescription || matchesPoster || matchesMunicipality || matchesBarangay;
    });
  }, [destinations, searchQuery]);
  const showDestinationSkeletons =
    isDestinationsPending || (isDestinationsFetching && destinations.length === 0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') ?? '';
    setSearchQuery(query);
  }, [location.search]);

  useEffect(() => {
    if (isDestinationsPending || isDestinationsFetching) return;
    const query = searchQuery.trim();
    if (!query) return;

    void trackSearchPerformed({
      query,
      scope: 'destinations',
      resultCount: visibleDestinations.length,
      userId: user?.id ?? null,
      userRole: profile?.role ?? null,
      pagePath: '/destinations',
      filters: { filter_name: 'search_query' },
    });

    void trackFilterUsage({
      scope: 'destinations',
      filterName: 'search_query',
      filterValue: query,
      userId: user?.id ?? null,
      userRole: profile?.role ?? null,
      pagePath: '/destinations',
      filters: { active_query: query },
    });
  }, [isDestinationsPending, isDestinationsFetching, searchQuery, visibleDestinations.length, user?.id, profile?.role]);

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
                  <BreadcrumbPage>Destinations</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Destinations</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore every destination shared by the community.
            </p>
          </div>
          <SearchSuggest
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search destinations, hosts, or locations"
            items={destinations
              .filter((item) => item.imageUrl)
              .map((item) => ({
                id: item.id,
                label: item.name,
                meta: item.postedByName ?? 'Traveler',
              }))}
            className="w-full sm:max-w-sm"
          />
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
                  <DestinationCard
                    id={destination.id}
                    title={destination.name}
                    description={destination.description ?? 'A featured destination from Ilocos Sur.'}
                    imageUrl={destination.imageUrl ?? ''}
                    imageUrls={destination.imageUrls}
                    postedBy={destination.postedByName ?? 'Community'}
                    postedByImageUrl={destination.postedByImageUrl}
                    postedById={destination.postedById}
                    ratingAvg={destination.ratingAvg}
                    ratingCount={destination.ratingCount}
                    location={destination.location}
                    showDescription
                    enableModal
                    onModalOpen={() => {
                      void trackContentView({
                        contentType: 'destination',
                        contentId: destination.id,
                        ownerId: destination.postedById ?? null,
                        userId: user?.id ?? null,
                        userRole: profile?.role ?? null,
                        pagePath: '/destinations',
                      });
                    }}
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
