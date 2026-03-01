import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HomepageHeroSection } from '../sections/homepage_herosection';
import { HomepageMunicipalitiesSection } from '../sections/homepage_municipalitiessection';
import { HomepageTopDestinationsSection } from '../sections/homepage_topdestinationssection';
import { HomepageProductSection } from '../sections/homepage_productsection';

interface HomePageProps {
  onViewDestinations?: () => void;
  onViewProducts?: () => void;
  onViewProfile?: (profileId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onViewDestinations, onViewProducts, onViewProfile }) => {
  const shouldReduceMotion = useReducedMotion();
  const sectionMotion = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: 'easeOut' },
      };
  return (
    <>
      <HomepageHeroSection />
      <main className=" text-foreground px-4 sm:px-6 lg:px-10 pb-12">
        <div className="max-w-7xl mx-auto">
          <motion.div {...sectionMotion}>
            <HomepageMunicipalitiesSection onSelectProfile={onViewProfile} />
          </motion.div>
          <motion.div {...sectionMotion} transition={shouldReduceMotion ? undefined : { duration: 0.45, ease: 'easeOut', delay: 0.08 }}>
            <HomepageTopDestinationsSection onViewMore={onViewDestinations} onViewProfile={onViewProfile} />
          </motion.div>
          <motion.div {...sectionMotion} transition={shouldReduceMotion ? undefined : { duration: 0.45, ease: 'easeOut', delay: 0.14 }}>
            <HomepageProductSection onViewProfile={onViewProfile} onViewProducts={onViewProducts} />
          </motion.div>
        </div>
      </main>
    </>
  );
};
