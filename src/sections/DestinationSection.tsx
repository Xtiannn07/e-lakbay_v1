import React, { useEffect, useMemo, useState } from 'react';
import { DestinationModalCard } from '../components/DestinationModalCard';
import { supabase } from '../lib/supabaseClient';

interface DestinationSectionProps {
  onRate?: (name: string) => void;
  userId?: string | null;
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
  postedBy: string;
  postedByImageUrl?: string | null;
}

export const DestinationSection: React.FC<DestinationSectionProps> = ({ onRate, userId }) => {
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        let query = supabase
          .from('destinations')
          .select('id, destination_name, description, image_url, image_urls, created_at, user_id')
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        let { data: destinationRows, error: destinationError } = await query;

        if (destinationError && userId && destinationError.message.toLowerCase().includes('user_id')) {
          const retry = await supabase
            .from('destinations')
            .select('id, destination_name, description, image_url, image_urls, created_at, user_id')
            .order('created_at', { ascending: false });
          destinationRows = retry.data ?? [];
          destinationError = retry.error ?? null;
        }

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

        const profilesById = new Map<string, { full_name?: string | null; img_url?: string | null }>();
        if (userIds.length > 0) {
          const { data: profileRows, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, img_url')
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
          const postedBy = profile?.full_name || 'Traveler';
          return {
            id: row.id,
            name: row.destination_name,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            imageUrls,
            createdAt: row.created_at ?? null,
            ratingAvg,
            ratingCount: rating?.count,
            postedBy,
            postedByImageUrl: profile?.img_url ?? null,
          } as DestinationItem;
        });

        setDestinations(mapped);
      } catch (error) {
        console.error('Failed to load destinations:', error);
      }
    };

    loadDestinations();
  }, [userId]);

  const visibleDestinations = useMemo(() => destinations.filter((item) => item.imageUrl), [destinations]);

  return (
    <section id="destinations" className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Destinations</h2>
          <p className="text-sm text-white/60">Popular spots you can highlight for visitors.</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {visibleDestinations.map((destination) => (
          <DestinationModalCard
            key={destination.id}
            title={destination.name}
            meta="Uploaded destination"
            description={destination.description ?? ''}
            imageUrl={destination.imageUrl ?? ''}
            imageUrls={destination.imageUrls}
            postedBy={destination.postedBy}
            postedByImageUrl={destination.postedByImageUrl}
            ratingAvg={destination.ratingAvg}
            ratingCount={destination.ratingCount}
            onRate={onRate ? () => onRate(destination.name) : undefined}
          />
        ))}
      </div>
    </section>
  );
};
