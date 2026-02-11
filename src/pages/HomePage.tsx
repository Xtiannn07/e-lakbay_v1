import React, { useEffect, useMemo, useState } from 'react';
import { HeroSection } from '../sections/HeroSection';
import { MunicipalitiesSection } from '../sections/MunicipalitiesSection';
import { TopDestinationsSection } from '../sections/TopDestinationsSection';
import { ProductCard } from '../components/ProductCard';
import { RatingModal } from '../components/RatingModal';
import { supabase } from '../lib/supabaseClient';

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  ratingAvg?: number;
  ratingCount?: number;
}

interface HomePageProps {
  onViewDestinations?: () => void;
  onViewProfile?: (profileId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onViewDestinations, onViewProfile }) => {
  const [localProducts, setLocalProducts] = useState<ProductItem[]>([]);
  const [activeProduct, setActiveProduct] = useState<{
    name: string;
    imageUrl: string;
    description?: string | null;
    ratingAvg?: number;
    ratingCount?: number;
  } | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ type: 'Product' | 'Destination'; name: string } | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data: productRows, error: productError } = await supabase
          .from('products')
          .select('id, product_name, description, image_url, image_urls, created_at')
          .order('created_at', { ascending: false });

        if (productError) {
          throw productError;
        }

        const { data: ratingRows, error: ratingError } = await supabase
          .from('product_ratings')
          .select('product_id, rating');

        if (ratingError) {
          throw ratingError;
        }

        const ratingMap = new Map<string, { total: number; count: number }>();
        (ratingRows ?? []).forEach((row) => {
          const current = ratingMap.get(row.product_id) ?? { total: 0, count: 0 };
          ratingMap.set(row.product_id, {
            total: current.total + (row.rating ?? 0),
            count: current.count + 1,
          });
        });

        const mapped = (productRows ?? []).map((row) => {
          const rating = ratingMap.get(row.id);
          const ratingAvg = rating && rating.count > 0 ? rating.total / rating.count : undefined;
          const imageUrls = (row as { image_urls?: string[] }).image_urls ?? [];
          return {
            id: row.id,
            name: row.product_name,
            description: row.description ?? null,
            imageUrl: imageUrls[0] ?? row.image_url ?? null,
            createdAt: row.created_at ?? null,
            ratingAvg,
            ratingCount: rating?.count,
          } as ProductItem;
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

        setLocalProducts(sorted.slice(0, 12));
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };

    loadProducts();
  }, []);

  const visibleProducts = useMemo(() => localProducts.filter((item) => item.imageUrl), [localProducts]);

  return (
    <>
      <HeroSection />
      <main className="bg-slate-950 text-white px-4 sm:px-6 lg:px-10 pb-12">
        <div className="max-w-7xl mx-auto">
          <MunicipalitiesSection onSelectProfile={onViewProfile} />
          <TopDestinationsSection onViewMore={onViewDestinations} />
          <section className="mt-12">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-semibold">Local Products</h1>
              <p className="mt-3 text-sm text-white/70">
                "Experience the best of Ilocos Sur'r products"
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() =>
                    setActiveProduct({
                      name: product.name,
                      imageUrl: product.imageUrl ?? '',
                      description: product.description,
                      ratingAvg: product.ratingAvg,
                      ratingCount: product.ratingCount,
                    })}
                  className="flex flex-col gap-3 text-left focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                    <img
                      src={product.imageUrl ?? ''}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-semibold text-white/90 text-center">{product.name}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      {activeProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="w-[280px] sm:w-[320px] md:w-[360px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <ProductCard
              title={activeProduct.name}
              description={activeProduct.description || 'A locally crafted product from Ilocos Sur.'}
              imageUrl={activeProduct.imageUrl}
              meta="Local product"
              ratingAvg={activeProduct.ratingAvg ?? 4.6}
              ratingCount={activeProduct.ratingCount ?? 96}
              onRate={() => setRatingTarget({ type: 'Product', name: activeProduct.name })}
            />
          </div>
        </div>
      )}

      <RatingModal
        open={Boolean(ratingTarget)}
        title={ratingTarget ? `Rate ${ratingTarget.type}: ${ratingTarget.name}` : 'Rate'}
        onClose={() => setRatingTarget(null)}
        onSubmit={() => setRatingTarget(null)}
      />
    </>
  );
};
