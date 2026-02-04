import React, { useMemo, useState } from 'react';
import { Button } from './modern-ui/button';
import { cn } from '../lib/utils';
import { useModal } from './ModalContext';
import logo from '../assets/E-lakbay_Logo.svg';
import type { Profile } from './AuthProvider';

interface NavBarProps {
  active: 'login' | 'signup';
  onActiveChange: (active: 'login' | 'signup') => void;
  isAuthenticated: boolean;
  profile: Profile | null;
  onLogout: () => void;
  onDashboard: () => void;
  onHome: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  active,
  onActiveChange,
  isAuthenticated,
  profile,
  onLogout,
  onDashboard,
  onHome,
}) => {
  const { openModal } = useModal();
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

  const handleNavItemClick = () => {
    setIsMenuOpen(false);
    onHome();
  };

  return (
    <nav className="absolute top-0 left-0 z-20 w-full flex items-center justify-between px-4 py-3 md:px-8 md:py-4 text-white pb-6 md:pb-8">
      {/* Logo */}
      <button type="button" className="select-none" onClick={onHome} aria-label="Go to homepage">
        <img 
          src={logo} 
          alt="E-Lakbay" 
          className="h-7 md:h-13 w-auto opacity-75"
        />
      </button>
      {/* Navigation Items */}
      <div className="hidden md:flex items-center gap-6">
        <button
          type="button"
          onClick={onHome}
          className="cursor-pointer hover:text-black transition-colors"
        >
          Destinations
        </button>
        <button
          type="button"
          onClick={onHome}
          className="cursor-pointer hover:text-black transition-colors"
        >
          Municipalities
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
              className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition-colors"
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
            className="glass-secondary rounded-2xl shadow-2xl p-6 w-full max-w-sm text-white"
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
