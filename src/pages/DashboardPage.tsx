import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Profile } from '../components/AuthProvider';
import { DashboardAnalyticsSection } from '../sections/dashboard_analyticssection';
import { DashboardProductSection } from '../sections/dashboard_productsection';
import { DashboardDestinationSection } from '../sections/dashboard_destinationsection';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { ProductUploadModal } from '../components/ProductUploadModal';
import { DestinationUploadModal } from '../components/DestinationUploadModal';
import { useAuth } from '../components/AuthProvider';

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
  const contentRef = useRef<HTMLDivElement | null>(null);

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
    <section className="h-screen bg-slate-950 text-white px-4 sm:px-6 lg:px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full pt-12 md:pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-8 h-full">
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

          <div ref={contentRef} className="flex-1 h-full overflow-y-auto hide-scrollbar">
            <DashboardAnalyticsSection displayName={displayName} />
            <DashboardProductSection userId={user?.id ?? profile?.id ?? null} />
            <DashboardDestinationSection userId={user?.id ?? profile?.id ?? null} />
          </div>
        </div>
      </div>

      <ProductUploadModal open={isProductOpen} onClose={() => setIsProductOpen(false)} />
      <DestinationUploadModal open={isDestinationOpen} onClose={() => setIsDestinationOpen(false)} />
    </section>
  );
};
