import React from 'react';
import { HomepageHeroSection } from '../sections/homepage_herosection';
import { HomepageMunicipalitiesSection } from '../sections/homepage_municipalitiessection';
import { HomepageTopDestinationsSection } from '../sections/homepage_topdestinationssection';
import { HomepageProductSection } from '../sections/homepage_productsection';

interface HomePageProps {
  onViewDestinations?: () => void;
  onViewProfile?: (profileId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onViewDestinations, onViewProfile }) => {
  return (
    <>
      <HomepageHeroSection />
      <main className="bg-slate-950 text-white px-4 sm:px-6 lg:px-10 pb-12">
        <div className="max-w-7xl mx-auto">
          <HomepageMunicipalitiesSection onSelectProfile={onViewProfile} />
          <HomepageTopDestinationsSection onViewMore={onViewDestinations} onViewProfile={onViewProfile} />
          <HomepageProductSection onViewProfile={onViewProfile} />
        </div>
      </main>
    </>
  );
};
