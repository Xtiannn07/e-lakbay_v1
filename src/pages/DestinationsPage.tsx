import React, { useEffect, useMemo, useState } from 'react';
import { DestinationModalCard } from '../components/DestinationModalCard';
import { DestinationTile } from '../components/DestinationTile';
import { RatingModal } from '../components/RatingModal';
import { supabase } from '../lib/supabaseClient';

interface DestinationsPageProps {
  onBackHome?: () => void;
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
}

export const DestinationsPage: React.FC<DestinationsPageProps> = ({ onBackHome }) => {
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [activeDestination, setActiveDestination] = useState<DestinationItem | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const loadDestinations = async () => {
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
          } as DestinationItem;
        });

        setDestinations(mapped);
      } catch (error) {
        console.error('Failed to load destinations:', error);
      }
    };

    loadDestinations();
  }, []);

  const visibleDestinations = useMemo(() => destinations.filter((item) => item.imageUrl), [destinations]);

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">ILOCOS SUR</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Destinations</h1>
            <p className="mt-2 text-sm text-white/70">
              Explore every destination shared by the community.
            </p>
          </div>
          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="self-start sm:self-auto rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              Back to home
            </button>
          )}
        </div>

        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleDestinations.map((destination) => (
              <DestinationTile
                key={destination.id}
                title={destination.name}
                description={destination.description ?? 'A featured destination from Ilocos Sur.'}
                imageUrl={destination.imageUrl ?? ''}
                ratingAvg={destination.ratingAvg}
                ratingCount={destination.ratingCount}
                onClick={() => setActiveDestination(destination)}
              />
            ))}
          </div>
        </section>
      </div>

      {activeDestination && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onClick={() => setActiveDestination(null)}
        >
          <div
            className="max-w-5xl w-full"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destinations-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <DestinationModalCard
              title={activeDestination.name}
              description={activeDestination.description || 'A featured destination from Ilocos Sur.'}
              imageUrl={activeDestination.imageUrl ?? ''}
              imageUrls={activeDestination.imageUrls}
              meta="Uploaded destination"
              postedBy={activeDestination.postedByName ?? 'Community'}
              postedByImageUrl={activeDestination.postedByImageUrl}
              ratingAvg={activeDestination.ratingAvg ?? 4.7}
              ratingCount={activeDestination.ratingCount ?? 128}
              onRate={() => setRatingTarget({ name: activeDestination.name })}
            />
          </div>
        </div>
      )}

      <RatingModal
        open={Boolean(ratingTarget)}
        title={ratingTarget ? `Rate Destination: ${ratingTarget.name}` : 'Rate'}
        onClose={() => setRatingTarget(null)}
        onSubmit={() => setRatingTarget(null)}
      />
    </main>
  );
};
