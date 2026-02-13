import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DestinationTileSkeleton, ProfileHeaderSkeleton, SkeletonList } from '../components/hero-ui/Skeletons';
import { DestinationTile } from '../components/DestinationTile';
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
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profileId, onBackHome }) => {
  const shouldReduceMotion = useReducedMotion();
  const getItemMotion = (index: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: 'easeOut', delay: index * 0.04 },
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
          .select('id, destination_name, description, image_url, image_urls, created_at')
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
          } as DestinationItem;
        });
      } catch (fetchError) {
        console.error('Failed to load destinations:', fetchError);
        toast.error('Failed to load destinations.');
        return [] as DestinationItem[];
      }
    },
  });

  const visibleDestinations = useMemo(() => destinations.filter((item) => item.imageUrl), [destinations]);
  const showProfileSkeleton = isProfilePending || isProfileFetching;
  const showDestinationSkeletons =
    isDestinationsPending || (isDestinationsFetching && destinations.length === 0);
  const displayName = profile?.fullName || profile?.email || 'Traveler';

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-12 md:pt-20 pb-12 px-4 sm:px-6 lg:px-10">
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
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-white/20 bg-white/10 overflow-hidden flex items-center justify-center text-lg font-semibold">
                {profile?.imageUrl ? (
                  <img src={profile.imageUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold">{displayName}</h1>
                {profile?.battleCry && <p className="text-sm text-white/70 mt-1">{profile.battleCry}</p>}
              </div>
            </div>
          )}
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Destinations shared</h2>
            <span className="text-xs text-white/50">{visibleDestinations.length} entries</span>
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
                  <DestinationTile
                    title={destination.name}
                    description={destination.description ?? 'A featured destination from Ilocos Sur.'}
                    imageUrl={destination.imageUrl ?? ''}
                    imageUrls={destination.imageUrls}
                    meta="Uploaded destination"
                    postedBy={displayName}
                    postedByImageUrl={profile?.imageUrl ?? null}
                    postedById={profileId}
                    ratingAvg={destination.ratingAvg}
                    ratingCount={destination.ratingCount}
                    enableModal
                  />
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
