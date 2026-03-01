import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ModalProvider } from './components/ModalContext';
import { GlobalModal } from './components/GlobalModal';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { DestinationsPage } from './pages/DestinationsPage';
import { ProductsPage } from './pages/ProductsPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import { SonnerGlobal } from './components/modern-ui/sonner';
import Footer from './sections/footer';
import ComingSoonModal from './components/ui/coming_soon';
import loadingVideo from './assets/Loading_chatbot.webm';
import { initializeAnalyticsSession } from './lib/analytics';

const ProfileRoute: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {
  const { profileId } = useParams();

  if (!profileId) {
    return <Navigate to="/" replace />;
  }

  return <ProfilePage profileId={profileId} onBackHome={onBackHome} />;
};

const AdminRoute: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading...</p>
      </main>
    );
  }

  if (!user || profile?.role !== 'developer') {
    return <Navigate to="/" replace />;
  }

  return <AdminPage />;
};

const AppContent: React.FC = () => {
  const [active, setActive] = useState<'login' | 'signup'>('login');
  const { user, profile, loading, signOut } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const scrollAttemptRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [location.pathname]);

  useEffect(() => {
    initializeAnalyticsSession({
      userId: user?.id ?? null,
      userRole: profile?.role ?? null,
    });
  }, [user?.id, profile?.role]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 640);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkFooterVisibility = () => {
      const footer = document.querySelector('footer');
      if (!footer) {
        setIsFooterVisible(false);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      setIsFooterVisible(footerRect.top < windowHeight && footerRect.bottom > 0);
    };

    checkFooterVisibility();
    window.addEventListener('scroll', checkFooterVisibility, { passive: true });
    window.addEventListener('resize', checkFooterVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkFooterVisibility);
      window.removeEventListener('resize', checkFooterVisibility);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.pathname !== '/' || !pendingScrollId) return;

    const tryScroll = () => {
      const target = document.getElementById(pendingScrollId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPendingScrollId(null);
        scrollAttemptRef.current = 0;
        return;
      }

      if (scrollAttemptRef.current < 10) {
        scrollAttemptRef.current += 1;
        window.setTimeout(tryScroll, 120);
      } else {
        setPendingScrollId(null);
        scrollAttemptRef.current = 0;
      }
    };

    window.setTimeout(tryScroll, 0);
  }, [location.pathname, pendingScrollId]);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const id = location.hash.replace('#', '');
    if (!id) return;
    setPendingScrollId(id);
  }, [location.pathname, location.hash]);

  const handleJumpToSection = (sectionId: string) => {
    const cleanId = sectionId.replace(/^#/, '');
    navigate({ pathname: '/', hash: `#${cleanId}` });
    setPendingScrollId(cleanId);
  };

  const handleViewProfile = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  return (
    <ModalProvider>
      <div className="min-h-screen flex flex-col">
        <div className="relative">
          <NavBar
            active={active}
            onActiveChange={setActive}
            isAuthenticated={Boolean(user)}
            profile={profile}
            onDashboard={() => navigate('/dashboard')}
            onLogout={signOut}
            onHome={() => navigate('/')}
            onJumpToSection={handleJumpToSection}
          />
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onViewDestinations={() => navigate('/destinations')}
                  onViewProducts={() => navigate('/products')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/destinations"
              element={
                <DestinationsPage
                  onBackHome={() => navigate('/')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/products"
              element={
                <ProductsPage
                  onBackHome={() => navigate('/')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/search"
              element={
                <SearchResultsPage
                  onBackHome={() => navigate('/')}
                  onViewProfile={handleViewProfile}
                />
              }
            />
            <Route
              path="/profile/:profileId"
              element={<ProfileRoute onBackHome={() => navigate('/')} />}
            />
            <Route
              path="/dashboard"
              element={user ? <DashboardPage profile={profile} /> : <Navigate to="/" replace />}
            />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        {location.pathname !== '/dashboard' && location.pathname !== '/admin' && <Footer onOpenComingSoon={() => setIsComingSoonOpen(true)} />}
        <GlobalModal onModeChange={setActive} />
      </div>
      <SonnerGlobal />
      <button
        type="button"
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
        className={`fixed right-2 md:right-6 z-40 flex h-10 md:h-12 w-10 md:w-12 items-center justify-center rounded-full glass-button text-foreground shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring ${
          isFooterVisible ? 'bottom-52 md:bottom-44' : 'bottom-6'
        } ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>
      {isComingSoonOpen && (
        <ComingSoonModal isOpen={isComingSoonOpen} onClose={() => setIsComingSoonOpen(false)} />
      )}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <video
            src={loadingVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-40 w-40 sm:h-52 sm:w-52"
          />
        </div>
      )}
    </ModalProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
