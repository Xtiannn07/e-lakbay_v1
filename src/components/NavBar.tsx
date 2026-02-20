import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './modern-ui/button';
import { cn } from '../lib/utils';
import { useModal } from './ModalContext';
import logoWhite from '../assets/e-lakbay_logo(white).svg';
import type { Profile } from './AuthProvider';

interface NavBarProps {
  active: 'login' | 'signup';
  onActiveChange: (active: 'login' | 'signup') => void;
  isAuthenticated: boolean;
  profile: Profile | null;
  onLogout: () => void;
  onDashboard: () => void;
  onHome: () => void;
  onJumpToSection: (sectionId: string) => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  active,
  onActiveChange,
  isAuthenticated,
  profile,
  onLogout,
  onDashboard,
  onHome,
  onJumpToSection,
}) => {
  const { openModal } = useModal();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const displayName = useMemo(() => {
    return profile?.full_name || profile?.email || 'User';
  }, [profile]);

  const handleAuthClick = (mode: 'login' | 'signup') => {
    onActiveChange(mode);
    openModal(mode);
    setIsMenuOpen(false);
  };

  const handleSectionJump = (sectionId: string) => {
    setIsMenuOpen(false);
    onJumpToSection(sectionId);
  };

  const activeHash = location.hash.replace('#', '');
  const isHome = location.pathname === '/';
  const isDestinationsActive = location.pathname === '/destinations' || (isHome && activeHash === 'top-destinations');
  const isProductsActive = location.pathname === '/products' || (isHome && activeHash === 'products');
  const isMunicipalitiesActive = isHome && activeHash === 'municipalities';
  const activeLinkClass = 'font-semibold underline underline-offset-4 text-foreground';

  return (
    <nav className="absolute top-0 left-0 z-20 w-full flex items-center justify-between px-4 py-1 md:px-8 md:py-4 text-foreground">
      {/* Logo */}
      <button type="button" className="select-none" onClick={onHome} aria-label="Go to homepage">
        <img 
          src={logoWhite} 
          alt="E-Lakbay" 
          className="h-7 md:h-14 w-auto opacity-90"
        />
      </button>
      {/* Navigation Items */}
      <div className="hidden md:flex items-center gap-6">
        <button
          type="button"
          onClick={() => handleSectionJump('top-destinations')}
          className={cn('cursor-pointer hover:text-muted-foreground transition-colors', isDestinationsActive && activeLinkClass)}
        >
          Destinations
        </button>
        <button
          type="button"
          onClick={() => handleSectionJump('municipalities')}
          className={cn('cursor-pointer hover:text-muted-foreground transition-colors', isMunicipalitiesActive && activeLinkClass)}
        >
          Municipalities
        </button>
        <button
          type="button"
          onClick={() => handleSectionJump('products')}
          className={cn('cursor-pointer hover:text-muted-foreground transition-colors', isProductsActive && activeLinkClass)}
        >
          Products
        </button>
        {!isAuthenticated ? (
          <>
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
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDashboard}
              className="px-4 py-2 rounded-full glass-button text-sm font-semibold transition-colors"
              aria-label="Open dashboard"
            >
              {displayName}
            </button>
            <Button
              variant="outline"
              className="rounded-full px-5 py-2 font-medium transition-colors"
              onClick={() => setIsLogoutOpen(true)}
            >
              Log Out
            </Button>
          </div>
        )}
      </div>

      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-foreground/90 hover:text-foreground hover:bg-foreground/10 transition-colors"
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
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
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div
        className={cn(
          'md:hidden absolute left-4 right-4 mt-52 rounded-2xl glass-secondary border border-white/20 overflow-hidden transition-all',
          isMenuOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'
        )}
      >
        <div className="relative flex flex-col gap-2 px-4 py-4 text-foreground">
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full p-2 text-foreground/90 hover:text-foreground hover:bg-foreground/10 transition-colors"
            aria-label="Close navigation menu"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleSectionJump('top-destinations')}
            className={cn(
              'text-left text-sm font-medium tracking-wide hover:text-muted-foreground transition-colors',
              isDestinationsActive && 'text-foreground font-semibold'
            )}
          >
            Destinations
          </button>
          <button
            type="button"
            onClick={() => handleSectionJump('products')}
            className={cn(
              'text-left text-sm font-medium tracking-wide hover:text-muted-foreground transition-colors',
              isProductsActive && 'text-foreground font-semibold'
            )}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => handleSectionJump('municipalities')}
            className={cn(
              'text-left text-sm font-medium tracking-wide hover:text-muted-foreground transition-colors',
              isMunicipalitiesActive && 'text-foreground font-semibold'
            )}
          >
            Municipalities
          </button>
          {!isAuthenticated ? (
            <>
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
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onDashboard();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 text-sm font-medium"
              >
                <span className="font-semibold">{displayName}</span>
              </button>
              <Button
                variant="outline"
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                onClick={() => {
                  setIsLogoutOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Log Out
              </Button>
            </>
          )}
        </div>
      </div>

      {isLogoutOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          role="presentation"
          onClick={() => setIsLogoutOpen(false)}
        >
          <div
            className="glass-secondary rounded-2xl p-6 w-full max-w-sm text-white max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold" id="logout-title">
              Log out of your account?
            </h3>
            <p className="text-sm text-white/80 mt-2">
              You can log back in anytime.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="text-sm text-white/80 hover:text-white"
                onClick={() => setIsLogoutOpen(false)}
              >
                Cancel
              </button>
              <Button
                variant="default"
                className="rounded-full px-4 py-2 text-sm font-medium"
                onClick={() => {
                  setIsLogoutOpen(false);
                  onLogout();
                }}
              >
                Yes, log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
