
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Sidebar, ViewType } from './components/Sidebar';
import { ContractList } from './components/ContractList';
import { ClientList } from './components/ClientList';
import { ServiceTypeList } from './components/ServiceTypeList';
import { RevenueProvision } from './components/RevenueProvision';
import { UserList } from './components/UserList';
import { Home } from './components/Home';
import { Profile } from './components/Profile';
import { NotesList } from './components/NotesList';
import { ToastProvider } from './components/ToastContext';
import { QuickActionModal } from './components/QuickActionModal';
import { User } from './types';
import { Menu } from 'lucide-react';

const SESSION_KEY = 'wes_session_v2';
const SIDEBAR_PIN_KEY = 'wes_sidebar_pin';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  
  // Quick Action Modal State
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    const storedPin = localStorage.getItem(SIDEBAR_PIN_KEY);
    
    if (storedSession) {
      try {
        const parsedUser = JSON.parse(storedSession);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    if (storedPin) {
        setIsSidebarPinned(storedPin === 'true');
    }

    setInitializing(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
  };

  const handleUpdateUserSession = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const togglePin = () => {
      const newState = !isSidebarPinned;
      setIsSidebarPinned(newState);
      localStorage.setItem(SIDEBAR_PIN_KEY, String(newState));
  }

  const handleQuickActionSuccess = () => {
      setRefreshKey(prev => prev + 1); // Trigger refresh in child components
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-500 rounded-xl mb-4 shadow-lg shadow-primary-500/30"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const MainContent = () => {
    if (!user) {
      return <Login onLoginSuccess={handleLogin} />;
    }

    return (
      <div className="flex min-h-screen bg-gray-50 font-sans overflow-x-hidden">
        <Sidebar 
          onLogout={handleLogout} 
          activeView={activeView}
          onChangeView={(view) => setActiveView(view)}
          isOpen={isSidebarOpen}
          toggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isPinned={isSidebarPinned}
          onTogglePin={togglePin}
        />
        
        <div className={`flex-1 flex flex-col w-full transition-all duration-300 ${isSidebarPinned ? 'md:ml-64' : 'md:ml-20'}`}>
          <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20">
              <h1 className="font-bold text-gray-800">WES</h1>
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Menu className="w-6 h-6" />
              </button>
          </div>

          <main className="flex-1 p-4 md:p-8">
              {activeView === 'home' && (
                  <Home 
                    key={`home-${refreshKey}`}
                    user={user} 
                    onNavigate={setActiveView} 
                    onQuickAction={() => setIsQuickActionOpen(true)} 
                  />
              )}
              {activeView === 'contracts' && (
                  <ContractList 
                    key={`contracts-${refreshKey}`}
                    user={user} 
                  />
              )}
              {activeView === 'notes' && (
                <NotesList 
                  key={`notes-${refreshKey}`}
                  user={user} 
                />
              )}
              {activeView === 'clients' && <ClientList user={user} />}
              {activeView === 'service-types' && <ServiceTypeList user={user} />}
              {activeView === 'revenue' && (
                  <RevenueProvision 
                    key={`revenue-${refreshKey}`}
                    user={user} 
                    onQuickAction={() => setIsQuickActionOpen(true)}
                  />
              )}
              {activeView === 'users' && <UserList />}
              {activeView === 'profile' && (
                  <Profile user={user} onUpdateUser={handleUpdateUserSession} />
              )}
          </main>
        </div>

        {/* Centralized Quick Action Modal */}
        <QuickActionModal 
          user={user}
          isOpen={isQuickActionOpen}
          onClose={() => setIsQuickActionOpen(false)}
          onSuccess={handleQuickActionSuccess}
        />
      </div>
    );
  }

  return (
      <ToastProvider>
          <MainContent />
      </ToastProvider>
  );
};

export default App;
