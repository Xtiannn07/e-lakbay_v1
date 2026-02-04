import React, { useState } from 'react';
import type { Profile } from '../components/AuthProvider';
import { AnalyticsSection } from '../sections/AnalyticsSection';
import { ProductSection } from '../sections/ProductSection';
import { DestinationSection } from '../sections/DestinationSection';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { RatingModal } from '../components/RatingModal';

interface DashboardPageProps {
  profile: Profile | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ profile }) => {
  const displayName = profile?.full_name || profile?.email || 'Traveler';
  const battleCry = profile?.battle_cry || 'Ready for the next adventure.';
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ type: 'Product' | 'Destination'; name: string } | null>(null);

  return (
    <section className="min-h-screen bg-slate-950 text-white pt-24 pb-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <DashboardSidebar
          displayName={displayName}
          battleCry={battleCry}
          imgUrl={profile?.img_url}
          onOpenProductUpload={() => setIsProductOpen(true)}
          onOpenDestinationUpload={() => setIsDestinationOpen(true)}
        />

        <div className="flex-1">
          <AnalyticsSection displayName={displayName} />
          <ProductSection onRate={(name) => setRatingTarget({ type: 'Product', name })} />
          <DestinationSection onRate={(name) => setRatingTarget({ type: 'Destination', name })} />
        </div>
      </div>

      {isProductOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          role="presentation"
          onClick={() => setIsProductOpen(false)}
        >
          <div
            className="glass-secondary border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-2xl text-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-upload-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold" id="product-upload-title">Product Upload</h2>
                <p className="text-sm text-white/60">Add new products tied to destinations.</p>
              </div>
              <button
                type="button"
                className="text-white/70 hover:text-white text-2xl"
                onClick={() => setIsProductOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Product name</label>
                <input
                  type="text"
                  placeholder="Ilocos Souvenir Bundle"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Destination name</label>
                <input
                  type="text"
                  placeholder="Vigan Heritage"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm text-white/70">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the product..."
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Image upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white/20 file:px-3 file:py-1 file:text-xs file:text-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Created at</label>
                <input
                  type="datetime-local"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Last updated</label>
                <input
                  type="datetime-local"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  className="text-sm text-white/70 hover:text-white"
                  onClick={() => setIsProductOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  Upload product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDestinationOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          role="presentation"
          onClick={() => setIsDestinationOpen(false)}
        >
          <div
            className="glass-secondary border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-2xl text-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destination-upload-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold" id="destination-upload-title">Destination Upload</h2>
                <p className="text-sm text-white/60">Add new destinations with visuals.</p>
              </div>
              <button
                type="button"
                className="text-white/70 hover:text-white text-2xl"
                onClick={() => setIsDestinationOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Destination name</label>
                <input
                  type="text"
                  placeholder="San Vicente Cove"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Location / Municipality</label>
                <input
                  type="text"
                  placeholder="San Vicente"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm text-white/70">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the destination..."
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Image upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white/20 file:px-3 file:py-1 file:text-xs file:text-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Created at</label>
                <input
                  type="datetime-local"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70">Last updated</label>
                <input
                  type="datetime-local"
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  className="text-sm text-white/70 hover:text-white"
                  onClick={() => setIsDestinationOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  Upload destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RatingModal
        open={Boolean(ratingTarget)}
        title={ratingTarget ? `Rate ${ratingTarget.type}: ${ratingTarget.name}` : 'Rate'}
        onClose={() => setRatingTarget(null)}
        onSubmit={() => setRatingTarget(null)}
      />
    </section>
  );
};
