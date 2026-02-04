import React, { useEffect, useState } from 'react';
import { NavBar } from './components/NavBar';
import { ModalProvider } from './components/ModalContext';
import { GlobalModal } from './components/GlobalModal';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';

const AppContent: React.FC = () => {
  const [active, setActive] = useState<'login' | 'signup'>('login');
  const { user, profile, loading, signOut } = useAuth();
  const [view, setView] = useState<'home' | 'dashboard'>('home');

  useEffect(() => {
    if (user) {
      setView('dashboard');
    } else {
      setView('home');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

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
          {user && view === 'dashboard' ? <DashboardPage profile={profile} /> : <HomePage />}
        </div>
        <GlobalModal onModeChange={setActive} />
      </div>
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
