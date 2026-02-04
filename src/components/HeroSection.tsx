import React from 'react';
import { SearchBar } from './SearchBar';

export const HeroSection: React.FC = () => {
  return (
    <section className="hero-section-bg relative flex items-center justify-center min-h-screen pt-24 md:pt-28">
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-transparent" />
      <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center">
        <div className="text-center md:text-left w-full">
          <h1 className="text-white text-6xl md:text-8xl font-semibold leading-tight">Explore</h1>
          <h1 className="text-hero-gradient text-transparent text-4xl md:text-7xl font-semibold mt-3 md:mt-2 drop-shadow-white drop-shadow-xl leading-tight">
            2nd District of Ilocos Sur
          </h1>
          <p className="text-white text-base md:text-lg mt-4">
            “Explore, Taste, and Enjoy the culture of every town.”
          </p>
        </div>
        <div className="mt-7 sm:mt-8 md:mt-10 w-full flex justify-center">
          <SearchBar />
        </div>
      </div>
    </section>
  );
};
