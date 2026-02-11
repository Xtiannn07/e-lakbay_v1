import React, { useEffect, useMemo, useState } from 'react';
import { DestinationTile } from '../components/DestinationTile';
import { supabase } from '../lib/supabaseClient';

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
  ratingAvg?: number;
  ratingCount?: number;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profileId, onBackHome }) => {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, img_url, battle_cry')
          .eq('id', profileId)
          .single();

        if (error) {
          throw error;
        }

        setProfile({
          id: data.id,
          fullName: data.full_name ?? null,
          email: data.email ?? null,
          imageUrl: data.img_url ?? null,
          battleCry: data.battle_cry ?? null,
        });
      } catch (fetchError) {
        console.error('Failed to load profile:', fetchError);
      }
    };

    loadProfile();
  }, [profileId]);

  useEffect(() => {
    const loadDestinations = async () => {
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

        const mapped = (destinationRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const imageUrls = (row as { image_urls?: string[] }).image_urls ?? [];
          return {
            id: row.id,
            name: row.destination_name,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            ratingAvg,
            ratingCount: rating?.count,
          } as DestinationItem;
        });

        setDestinations(mapped);
      } catch (fetchError) {
        console.error('Failed to load destinations:', fetchError);
      }
    };

    loadDestinations();
  }, [profileId]);

  const visibleDestinations = useMemo(() => destinations.filter((item) => item.imageUrl), [destinations]);
  const displayName = profile?.fullName || profile?.email || 'Traveler';

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Destinations shared</h2>
            <span className="text-xs text-white/50">{visibleDestinations.length} entries</span>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleDestinations.map((destination) => (
              <DestinationTile
                key={destination.id}
                title={destination.name}
                description={destination.description ?? 'A featured destination from Ilocos Sur.'}
                imageUrl={destination.imageUrl ?? ''}
                ratingAvg={destination.ratingAvg}
                ratingCount={destination.ratingCount}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
