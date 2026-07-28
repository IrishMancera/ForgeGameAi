import { useState, useCallback, useEffect } from 'react';
import Sidebar, { type AppPage } from './components/Sidebar';
import Header from './components/Header';
import AIPanel from './components/AIPanel';
import { ToastCenter, type ToastMessage, createToast, type ToastType } from './components/Toast';
import { getBackendSnapshot, type BackendSnapshot } from './services/backend';
import { fetchCurrentUser, getStoredUser, getStoredToken, clearAuth, type UserProfile } from './services/auth';

import CommandCenter from './pages/CommandCenter';
import GameBlueprint from './pages/GameBlueprint';
import Systems from './pages/Systems';
import EconomyLab from './pages/EconomyLab';
import Progression from './pages/Progression';
import PlayerPsychology from './pages/PlayerPsychology';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';
import WorkbookStudio from './pages/WorkbookStudio';
import KnowledgeBase from './pages/KnowledgeBase';
import AuditCenter from './pages/AuditCenter';
import Settings from './pages/Settings';
import PublicWebsite from './pages/PublicWebsite';
import Auth from './pages/Auth';

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('website');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [aiCollapsed, setAiCollapsed] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [backendSnapshot, setBackendSnapshot] = useState<BackendSnapshot | null>(null);
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [authPage, setAuthPage] = useState<'sign-in' | 'register' | null>(null);

  useEffect(() => {
    let active = true;

    getBackendSnapshot()
      .then((snapshot) => {
        if (active) {
          setBackendSnapshot(snapshot);
        }
      })
      .catch(() => {
        if (active) {
          setBackendSnapshot(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || user) return;

    fetchCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => {
        clearAuth();
        setUser(null);
      });
  }, [user]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    setToasts((prev) => [...prev, createToast(type, title, message)]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = (page: AppPage) => {
    setCurrentPage(page);
    setAuthPage(null);
  };

  const handleEnterApp = () => {
    if (user) {
      setCurrentPage('command-center');
      setAuthPage(null);
    } else {
      setAuthPage('sign-in');
    }
  };

  const handleAuthenticated = (profile: UserProfile) => {
    setUser(profile);
    setAuthPage(null);
    setCurrentPage('command-center');
  };

  const handleSignOut = () => {
    clearAuth();
    setUser(null);
    setCurrentPage('website');
    setAuthPage(null);
    addToast('info', 'Signed out', 'You are now signed out of GameForge.');
  };

  if (authPage) {
    return <Auth onAuthenticated={handleAuthenticated} onToast={addToast} />;
  }

  if (currentPage === 'website') {
    return (
      <>
        <PublicWebsite onEnterApp={handleEnterApp} />
        <ToastCenter toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  const renderPage = () => {
    const props = { onToast: addToast, user, onSignOut: handleSignOut };
    switch (currentPage) {
      case 'command-center': return <CommandCenter {...props} />;
      case 'game-blueprint': return <GameBlueprint {...props} />;
      case 'systems': return <Systems {...props} />;
      case 'economy-lab': return <EconomyLab {...props} />;
      case 'progression': return <Progression {...props} />;
      case 'player-psychology': return <PlayerPsychology {...props} />;
      case 'simulation': return <Simulation {...props} />;
      case 'analytics': return <Analytics {...props} />;
      case 'workbook-studio': return <WorkbookStudio {...props} />;
      case 'knowledge-base': return <KnowledgeBase {...props} />;
      case 'audit-center': return <AuditCenter {...props} />;
      case 'settings': return <Settings {...props} />;
      default: return <CommandCenter {...props} />;
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(108,59,255,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(25,198,209,0.18),_transparent_35%),linear-gradient(135deg,_#fff9f2_0%,_#fef8f1_45%,_#f7f0ff_100%)] text-[#17152B]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb ambient-orb-left" />
        <div className="ambient-orb ambient-orb-right" />
        <div className="grid-overlay" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col">
        <Header onToast={addToast} unsavedChanges={unsavedChanges} snapshot={backendSnapshot} user={user} onSignOut={handleSignOut} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentPage={currentPage} onNavigate={navigate} snapshot={backendSnapshot} />

          <main className="flex-1 min-w-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {renderPage()}
            </div>
          </main>

          <AIPanel
            onToast={addToast}
            collapsed={aiCollapsed}
            onToggle={() => setAiCollapsed(!aiCollapsed)}
            snapshot={backendSnapshot}
            projectId={backendSnapshot?.projectId}
          />
        </div>
      </div>

      <ToastCenter toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
