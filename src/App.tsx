import React, { useEffect, useState } from 'react';
import { NavBar } from './components/NavBar';
import { ModalProvider } from './components/ModalContext';
import { GlobalModal } from './components/GlobalModal';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { DestinationsPage } from './pages/DestinationsPage';
import { ProfilePage } from './pages/ProfilePage';
import loadingVideo from './assets/Loading_chatbot.webm';

const AppContent: React.FC = () => {
  const [active, setActive] = useState<'login' | 'signup'>('login');
  const { user, profile, loading, signOut } = useAuth();
  const [view, setView] = useState<'home' | 'dashboard' | 'destinations' | 'profile'>(() => {
    if (typeof window === 'undefined') return 'home';
    const stored = window.localStorage.getItem('elakbay:view');
    if (stored === 'home' || stored === 'dashboard' || stored === 'destinations' || stored === 'profile') {
      return stored;
    }
    return 'home';
  });
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('elakbay:profileId');
  });

  useEffect(() => {
    if (!user && view === 'dashboard') {
      setView('home');
    }
    if (view === 'profile' && !selectedProfileId) {
      setView('home');
    }
  }, [user, view, selectedProfileId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('elakbay:view', view);
  }, [view]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedProfileId) {
      window.localStorage.setItem('elakbay:profileId', selectedProfileId);
    } else {
      window.localStorage.removeItem('elakbay:profileId');
    }
  }, [selectedProfileId]);

  return (
    <ModalProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <div className="relative">
          <NavBar
            active={active}
            onActiveChange={setActive}
            isAuthenticated={Boolean(user)}
            profile={profile}
            onDashboard={() => setView('dashboard')}
            onLogout={signOut}
            onHome={() => setView('home')}
          />
          {user && view === 'dashboard' ? (
            <DashboardPage profile={profile} />
          ) : view === 'profile' && selectedProfileId ? (
            <ProfilePage
              profileId={selectedProfileId}
              onBackHome={() => setView('home')}
            />
          ) : view === 'destinations' ? (
            <DestinationsPage onBackHome={() => setView('home')} />
          ) : (
            <HomePage
              onViewDestinations={() => setView('destinations')}
              onViewProfile={(profileId) => {
                setSelectedProfileId(profileId);
                setView('profile');
              }}
            />
          )}
        </div>
        <GlobalModal onModeChange={setActive} />
      </div>
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
