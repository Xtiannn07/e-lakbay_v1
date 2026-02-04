import React, { useState } from 'react';
import { Button } from './modern-ui/button';
import { cn } from '../lib/utils';
import { useModal } from './ModalContext';
import logo from '../assets/E-lakbay_Logo.svg';

interface NavBarProps {
  active: 'login' | 'signup';
  onActiveChange: (active: 'login' | 'signup') => void;
}

export const NavBar: React.FC<NavBarProps> = ({ active, onActiveChange }) => {
  const { openModal } = useModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAuthClick = (mode: 'login' | 'signup') => {
    onActiveChange(mode);
    openModal(mode);
    setIsMenuOpen(false);
  };

  const handleNavItemClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="absolute top-0 left-0 z-20 w-full flex items-center justify-between px-4 py-3 md:px-8 md:py-4 text-white pb-6 md:pb-8">
      {/* Logo */}
      <div className="select-none">
        <img 
          src={logo} 
          alt="E-Lakbay" 
          className="h-7 md:h-13 w-auto opacity-75"
        />
      </div>
      {/* Navigation Items */}
      <div className="hidden md:flex items-center gap-6">
        <span className="cursor-pointer hover:text-black transition-colors">Destinations</span>
        <span className="cursor-pointer hover:text-black transition-colors">Municipalities</span>
        <Button
          variant={active === 'login' ? 'default' : 'outline'}
          className={cn('rounded-full px-5 py-2 font-medium transition-colors', active === 'login' ? 'shadow-md' : '')}
          onClick={() => handleAuthClick('login')}
        >
          Log In
        </Button>
        <Button
          variant={active === 'signup' ? 'default' : 'outline'}
          className={cn('rounded-full px-5 py-2 font-medium transition-colors', active === 'signup' ? 'shadow-md' : '')}
          onClick={() => handleAuthClick('signup')}
        >
          Sign Up
        </Button>
      </div>

      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-white/90 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isMenuOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>

      <div
        className={cn(
          'md:hidden absolute left-4 right-4 mt-52 rounded-2xl glass-secondary shadow-xl border border-white/20 overflow-hidden transition-all',
          isMenuOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'
        )}
      >
        <div className="flex flex-col gap-2 px-4 py-4 text-white">
          <button
            type="button"
            onClick={handleNavItemClick}
            className="text-left text-sm font-medium tracking-wide hover:text-black transition-colors"
          >
            Destinations
          </button>
          <button
            type="button"
            onClick={handleNavItemClick}
            className="text-left text-sm font-medium tracking-wide hover:text-black transition-colors"
          >
            Municipalities
          </button>
          <Button
            variant={active === 'login' ? 'default' : 'outline'}
            className={cn('rounded-full px-4 py-2 text-sm font-medium transition-colors', active === 'login' ? 'shadow-md' : '')}
            onClick={() => handleAuthClick('login')}
          >
            Log In
          </Button>
          <Button
            variant={active === 'signup' ? 'default' : 'outline'}
            className={cn('rounded-full px-4 py-2 text-sm font-medium transition-colors', active === 'signup' ? 'shadow-md' : '')}
            onClick={() => handleAuthClick('signup')}
          >
            Sign Up
          </Button>
        </div>
      </div>
    </nav>
  );
};
