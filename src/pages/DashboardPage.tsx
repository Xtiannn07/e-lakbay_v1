import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Profile } from '../components/AuthProvider';
import { DashboardAnalyticsSection } from '../sections/dashboard_analyticssection';
import { DashboardProductSection } from '../sections/dashboard_productsection';
import { DashboardDestinationSection } from '../sections/dashboard_destinationsection';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { ProductUploadModal } from '../components/ProductUploadModal';
import { DestinationUploadModal } from '../components/DestinationUploadModal';
import { ProductModal } from '../components/ProductModal';
import { useAuth } from '../components/AuthProvider';

type ActiveProduct = {
  id: string;
  name: string;
  imageUrl: string;
  imageUrls?: string[];
  description?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  uploaderName?: string;
  uploaderImageUrl?: string | null;
  uploaderId?: string | null;
  location?: {
    municipality: string | null;
    barangay: string | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
};

interface DashboardPageProps {
  profile: Profile | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ profile }) => {
  const shouldReduceMotion = useReducedMotion();
  const sidebarMotion = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut', delay: 0.08 },
      };
  const { user } = useAuth();
  const displayName = profile?.full_name || profile?.email || 'Traveler';
  const battleCry = profile?.battle_cry || 'Ready for the next adventure.';
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ActiveProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<ActiveProduct | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleWheel = (event: WheelEvent) => {
      const container = contentRef.current;
      if (!container) return;

      const canScroll = container.scrollHeight > container.clientHeight;
      if (!canScroll) return;

      container.scrollBy({ top: event.deltaY });
      event.preventDefault();
    };

    section.addEventListener('wheel', handleWheel, { passive: false });
    return () => section.removeEventListener('wheel', handleWheel);
  }, []);

  const handleJumpToSection = (sectionId: string) => {
    const container = contentRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`#${sectionId}`);
    if (!target) return;
    const containerTop = container.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    const offsetTop = targetTop - containerTop + container.scrollTop;
    container.scrollTo({ top: offsetTop, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="h-screen text-foreground px-2 overflow-y-hidden overflow-x-visible">
      <div className="max-w-7xl mx-auto h-full pt-12 md:pt-24 pb-12 overflow-x-visible">
        <div className="flex flex-col lg:flex-row gap-8 h-full lg:pl-3 overflow-x-visible">
          <motion.div className="shrink-0" {...sidebarMotion}>
            <DashboardSidebar
              displayName={displayName}
              battleCry={battleCry}
              imgUrl={profile?.img_url}
              userId={user?.id ?? profile?.id ?? null}
              fullName={profile?.full_name ?? null}
              onOpenProductUpload={() => setIsProductOpen(true)}
              onOpenDestinationUpload={() => setIsDestinationOpen(true)}
              onJumpToSection={handleJumpToSection}
            />
          </motion.div>

          <div ref={contentRef} className="flex-1 h-full overflow-y-auto overflow-x-visible hide-scrollbar pl-4 p-4">
            <DashboardAnalyticsSection
              displayName={displayName}
              userId={user?.id ?? profile?.id ?? null}
            />
            <DashboardProductSection
              userId={user?.id ?? profile?.id ?? null}
              onOpenProduct={(product) => {
                setActiveProduct({
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl ?? '',
                  imageUrls: product.imageUrls,
                  description: product.description,
                  ratingAvg: product.ratingAvg,
                  ratingCount: product.ratingCount,
                  uploaderName: product.uploaderName,
                  uploaderImageUrl: product.uploaderImageUrl,
                  uploaderId: product.uploaderId,
                  location: product.location,
                });
              }}
            />
            <DashboardDestinationSection userId={user?.id ?? profile?.id ?? null} />
          </div>
        </div>
      </div>

      <ProductUploadModal open={isProductOpen} onClose={() => setIsProductOpen(false)} />
      <DestinationUploadModal open={isDestinationOpen} onClose={() => setIsDestinationOpen(false)} />
      <ProductModal
        open={Boolean(activeProduct)}
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        showEditControl
        onEditRequest={(product) => {
          setEditingProduct((prev) => ({
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            imageUrls: product.imageUrls,
            description: product.description,
            ratingAvg: prev?.ratingAvg,
            ratingCount: prev?.ratingCount,
            uploaderName: prev?.uploaderName,
            uploaderImageUrl: prev?.uploaderImageUrl,
            uploaderId: prev?.uploaderId,
            location: product.location,
          }));
        }}
      />
      <ProductUploadModal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        mode="edit"
        productId={editingProduct?.id}
        initialData={editingProduct ? {
          name: editingProduct.name,
          description: editingProduct.description,
          imageUrl: editingProduct.imageUrl,
          imageUrls: editingProduct.imageUrls,
          location: editingProduct.location,
        } : null}
        onSuccess={(updated) => {
          if (!updated) return;
          setEditingProduct((prev) => (prev ? {
            ...prev,
            name: updated.name,
            description: updated.description,
            imageUrl: updated.imageUrl ?? prev.imageUrl,
            imageUrls: updated.imageUrls,
            location: updated.location,
          } : prev));
        }}
      />
    </section>
  );
};
