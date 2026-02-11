import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ProfileItem {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface MunicipalitiesSectionProps {
  onSelectProfile?: (profileId: string) => void;
}

export const MunicipalitiesSection: React.FC<MunicipalitiesSectionProps> = ({ onSelectProfile }) => {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, img_url')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const mapped = (data ?? []).map((row) => ({
          id: row.id,
          name: row.full_name || row.email || 'Traveler',
          imageUrl: row.img_url ?? null,
        })) as ProfileItem[];

        setProfiles(mapped);
      } catch (fetchError) {
        console.error('Failed to load profiles:', fetchError);
      }
    };

    loadProfiles();
  }, []);

  const loopProfiles = useMemo(() => {
    if (profiles.length === 0) return [];
    return [...profiles, ...profiles];
  }, [profiles]);

  if (loopProfiles.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-950 text-white -mx-4 sm:-mx-6 lg:-mx-10">
      <div className="overflow-hidden municipalities-fade">
        <div className="municipalities-marquee">
          <div className="municipalities-track px-1 sm:px-2">
            {loopProfiles.map((profile, index) => (
              <button
                key={`${profile.id}-${index}`}
                type="button"
                onClick={() => onSelectProfile?.(profile.id)}
                className="flex flex-col items-center gap-1 text-center min-w-[72px]"
              >
                <div className="h-14 w-14 rounded-full border border-white/15 bg-white/10 overflow-hidden flex items-center justify-center text-xs font-semibold">
                  {profile.imageUrl ? (
                    <img src={profile.imageUrl} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    profile.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-white/80 leading-tight line-clamp-2">
                  {profile.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
