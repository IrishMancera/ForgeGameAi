import { useState, useCallback, useEffect } from 'react';
import Sidebar, { type AppPage } from './components/Sidebar';
import Header from './components/Header';
import AIPanel from './components/AIPanel';
import { ToastCenter, type ToastMessage, createToast, type ToastType } from './components/Toast';
import { getBackendSnapshot, type BackendSnapshot } from './services/backend';
import { fetchCurrentUser, getStoredUser, getStoredToken, clearAuth, type UserProfile } from './services/auth';
import { getProjects, createProject, type AppProject } from './services/project';

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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [aiCollapsed, setAiCollapsed] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [backendSnapshot, setBackendSnapshot] = useState<BackendSnapshot | null>(null);
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [authPage, setAuthPage] = useState<'sign-in' | 'register' | null>(null);
  const [snapshotVersion, setSnapshotVersion] = useState(0);

  // Projects State
  const [projectsList, setProjectsList] = useState<AppProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);

  const getInitialPage = (): AppPage => {
    const saved = localStorage.getItem('gameforge_current_page') as AppPage | null;
    const hasAuth = Boolean(getStoredUser() || getStoredToken());
    if (hasAuth) {
      return saved && saved !== 'website' ? saved : 'command-center';
    }
    return saved || 'website';
  };

  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage);

  // Fetch projects list when user is logged in
  // Fetch projects list when user is logged in with a valid server token
  const fetchUserProjects = useCallback(async () => {
    const token = getStoredToken();
    if (!token || token.startsWith('local-')) return;

    try {
      const res = await getProjects();
      setProjectsList(res.projects);
      if (res.projects.length > 0 && !activeProjectId) {
        setActiveProjectId(res.projects[0].id);
      }
    } catch {
      // ignore 401 / unauthenticated error gracefully
    }
  }, [activeProjectId]);

  useEffect(() => {
    const token = getStoredToken();
    if ((user || token) && token && !token.startsWith('local-')) {
      fetchUserProjects();
    }
  }, [user, snapshotVersion, fetchUserProjects]);

  // Refresh backend snapshot — called on mount and after project creation
  const refreshSnapshot = useCallback(() => {
    let active = true;
    getBackendSnapshot()
      .then((snapshot) => {
        if (active) {
          setBackendSnapshot(snapshot);
          if (snapshot?.projectId && !activeProjectId) {
            setActiveProjectId(String(snapshot.projectId));
          }
        }
      })
      .catch(() => { if (active) setBackendSnapshot(null); });
    return () => { active = false; };
  }, [activeProjectId]);

  useEffect(() => {
    return refreshSnapshot();
  }, [snapshotVersion, refreshSnapshot]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    if (token.startsWith('local-')) {
      fetch('/api/health')
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then(() => {
          addToast('info', 'Backend connected', 'Sign out and sign in again to sync your account with the server.');
        })
        .catch(() => {
          const stored = getStoredUser();
          if (stored && !user) setUser(stored);
        });
      return;
    }

    if (user) return;

    fetchCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => {
        clearAuth();
        setUser(null);
        setCurrentPage('website');
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
    localStorage.setItem('gameforge_current_page', page);
    setAuthPage(null);
  };

  const handleEnterApp = () => {
    if (user || getStoredToken()) {
      const saved = localStorage.getItem('gameforge_current_page') as AppPage | null;
      const target = saved && saved !== 'website' ? saved : 'command-center';
      navigate(target);
    } else {
      setAuthPage('sign-in');
    }
  };

  const handleAuthenticated = (profile: UserProfile) => {
    setUser(profile);
    setAuthPage(null);
    const saved = localStorage.getItem('gameforge_current_page') as AppPage | null;
    const targetPage = saved && saved !== 'website' ? saved : 'command-center';
    setCurrentPage(targetPage);
    localStorage.setItem('gameforge_current_page', targetPage);
    setSnapshotVersion((v) => v + 1);
  };

  const handleSignOut = () => {
    clearAuth();
    setUser(null);
    localStorage.setItem('gameforge_current_page', 'website');
    setCurrentPage('website');
    setAuthPage(null);
    setProjectsList([]);
    setActiveProjectId(undefined);
    addToast('info', 'Signed out', 'You are now signed out of GameForgeAI.');
  };

  const handleCreateProjectHeader = async (name: string, genre?: string, targetPlatform?: string) => {
    const res = await createProject(name, genre, targetPlatform);
    setProjectsList((prev) => [res.project, ...prev]);
    setActiveProjectId(res.project.id);
    setSnapshotVersion((v) => v + 1);
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const selected = projectsList.find((p) => p.id === projectId);
    if (selected && backendSnapshot) {
      setBackendSnapshot({
        ...backendSnapshot,
        projectId: selected.id,
        projectName: selected.name,
        gameGenre: selected.genre || 'Hybrid-Casual Tycoon',
        liveMetrics: {
          health: selected.systemHealth,
          blueprint: selected.blueprintComplete,
          risks: selected.criticalRisks,
          decisions: selected.openDecisions,
        },
      });
    }
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
    const activeId = activeProjectId || (backendSnapshot?.projectId ? String(backendSnapshot.projectId) : undefined);
    const props = { onToast: addToast, user, onSignOut: handleSignOut, projectId: activeId };
    const onProjectCreated = () => setSnapshotVersion((v) => v + 1);

    switch (currentPage) {
      case 'command-center': return <CommandCenter {...props} onProjectCreated={onProjectCreated} />;
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
    <div className="relative flex h-full min-h-screen w-full overflow-hidden bg-[#FFF9F2] bg-[radial-gradient(circle_at_top_left,_rgba(108,59,255,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(25,198,209,0.18),_transparent_35%),linear-gradient(135deg,_#fff9f2_0%,_#fef8f1_45%,_#f7f0ff_100%)] text-[#17152B]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-orb ambient-orb-left" />
        <div className="ambient-orb ambient-orb-right" />
        <div className="grid-overlay" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col">
        <Header
          onToast={addToast}
          unsavedChanges={unsavedChanges}
          snapshot={backendSnapshot}
          user={user}
          onSignOut={handleSignOut}
          projects={projectsList}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProjectHeader}
          onNavigate={(page) => navigate(page as AppPage)}
          onSave={() => addToast("success", "Workspace Saved", "All module configurations synced to project database.")}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentPage={currentPage} onNavigate={navigate} snapshot={backendSnapshot} user={user} />

          <main className="flex-1 min-w-0 overflow-hidden">
            <div key={currentPage} className="h-full overflow-y-auto page-transition-fade">
              {renderPage()}
            </div>
          </main>

          <AIPanel
            onToast={addToast}
            collapsed={aiCollapsed}
            onToggle={() => setAiCollapsed(!aiCollapsed)}
            snapshot={backendSnapshot}
            projectId={activeProjectId || backendSnapshot?.projectId}
          />
        </div>
      </div>

      <ToastCenter toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
