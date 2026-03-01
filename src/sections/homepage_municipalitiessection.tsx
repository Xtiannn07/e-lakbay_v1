import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfileChipSkeleton, SkeletonList } from '../components/ui/Skeletons';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface ProfileItem {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface HomepageMunicipalitiesSectionProps {
  onSelectProfile?: (profileId: string) => void;
}

export const HomepageMunicipalitiesSection: React.FC<HomepageMunicipalitiesSectionProps> = ({
  onSelectProfile,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isAdjustingScrollRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  const {
    data: profiles = [],
    isPending: isProfilesPending,
    isFetching: isProfilesFetching,
  } = useQuery({
    queryKey: ['profiles', 'municipalities'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, img_url, role')
          .eq('role', 'municipality')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        return (data ?? []).map((row) => ({
          id: row.id,
          name: row.full_name || row.email || 'Traveler',
          imageUrl: row.img_url ?? null,
        })) as ProfileItem[];
      } catch (fetchError) {
        console.error('Failed to load profiles:', fetchError);
        toast.error('Failed to load hosts.');
        return [] as ProfileItem[];
      }
    },
  });

  const loopProfiles = useMemo(() => {
    if (profiles.length === 0) return [];
    return [...profiles, ...profiles];
  }, [profiles]);

  const showProfileSkeletons = isProfilesPending || (isProfilesFetching && profiles.length === 0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || showProfileSkeletons || profiles.length === 0) {
      return;
    }

    const singleTrackWidth = scroller.scrollWidth / 2;
    if (singleTrackWidth > 0) {
      scroller.scrollLeft = singleTrackWidth;
    }
  }, [profiles.length, showProfileSkeletons]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || showProfileSkeletons || profiles.length === 0) {
      return;
    }

    let frameId = 0;
    let lastTimestamp = 0;
    const speedPxPerMs = 0.06;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      if (!isPaused) {
        const elapsed = timestamp - lastTimestamp;
        const singleTrackWidth = scroller.scrollWidth / 2;

        if (singleTrackWidth > 0) {
          scroller.scrollLeft += elapsed * speedPxPerMs;

          if (scroller.scrollLeft >= singleTrackWidth * 2 - scroller.clientWidth) {
            scroller.scrollLeft -= singleTrackWidth;
          }
        }
      }

      lastTimestamp = timestamp;
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPaused, profiles.length, showProfileSkeletons]);

  const handleScrollerScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || isAdjustingScrollRef.current) {
      return;
    }

    const singleTrackWidth = scroller.scrollWidth / 2;
    if (singleTrackWidth <= 0) {
      return;
    }

    if (scroller.scrollLeft <= 1) {
      isAdjustingScrollRef.current = true;
      scroller.scrollLeft += singleTrackWidth;
      isAdjustingScrollRef.current = false;
    } else if (scroller.scrollLeft >= singleTrackWidth * 2 - scroller.clientWidth - 1) {
      isAdjustingScrollRef.current = true;
      scroller.scrollLeft -= singleTrackWidth;
      isAdjustingScrollRef.current = false;
    }
  };

  if (!showProfileSkeletons && loopProfiles.length === 0) {
    return null;
  }

  return (
    <section id="municipalities" className="text-foreground py-5 md:py-10 relative left-1/2 w-screen -ml-[50vw] -mr-[50vw] z-0">
      <div className="px-3 sm:px-4">
        <div
          ref={scrollerRef}
          className="hide-scrollbar overflow-x-auto px-1 sm:px-2 touch-pan-x"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onTouchCancel={() => setIsPaused(false)}
          onScroll={handleScrollerScroll}
        >
          <div className="flex w-max gap-8 px-1 sm:px-2">
            {showProfileSkeletons ? (
              <SkeletonList
                count={12}
                render={(index) => <ProfileChipSkeleton key={`profile-skeleton-${index}`} />}
              />
            ) : (
              loopProfiles.map((profile, index) => (
                <button
                  key={`${profile.id}-${index}`}
                  type="button"
                  onClick={() => onSelectProfile?.(profile.id)}
                  className="flex flex-col items-center gap-1 text-center w-15 md:w-28"
                >
                  <div className="h-20 md:h-28 w-20 md:w-28 rounded-full border border-border bg-background overflow-hidden flex items-center justify-center text-sm md:text-3xl font-extrabold text-foreground">
                    {profile.imageUrl ? (
                      <img src={profile.imageUrl} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                      profile.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-2 wrap-break-word w-full">
                    {profile.name.toUpperCase()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
