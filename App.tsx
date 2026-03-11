
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { MyReports } from './components/MyReports';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Users } from './components/Users';
import { Profile } from './components/Profile';
import { ApiService, User } from './services/api';
import { LanguageProvider } from './context/LanguageContext';

export enum Page {
  LOGIN = 'login',
  REGISTER = 'register',
  DASHBOARD = 'dashboard',
  REPORTS = 'reports',
  MY_REPORTS = 'my_reports',
  USERS = 'users',
  PROFILE = 'profile'
}

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      let user = ApiService.getCurrentUser();
      if (user) {
        // REPARACIÓN DE SESIÓN: Si falta el id_subcuenta, intentamos cargarlo del perfil
        if (!user.id_subcuenta && user.email) {
          try {
            const profile = await ApiService.getUserProfile(user.email);
            if (profile.id_subcuenta) {
              user = { ...user, id_subcuenta: profile.id_subcuenta };
              localStorage.setItem('shifttrack_auth_user', JSON.stringify(user));
            }
          } catch (e) {
            console.error("No se pudo reparar la subcuenta faltante", e);
          }
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        setCurrentPage(Page.DASHBOARD);
      }
    };
    
    initApp();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
    ApiService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage(Page.LOGIN);
  };

  if (!isAuthenticated) {
    if (currentPage === Page.REGISTER) {
      return (
        <Register 
          onNavigateToLogin={() => setCurrentPage(Page.LOGIN)} 
          onRegisterSuccess={handleLoginSuccess} 
        />
      );
    }
    return (
      <Login 
        onLogin={handleLoginSuccess} 
        onNavigateToRegister={() => setCurrentPage(Page.REGISTER)}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard user={currentUser} />;
      case Page.REPORTS:
        if (currentUser?.role === 'Admin') return <Reports />;
        return <Dashboard user={currentUser} />;
      case Page.MY_REPORTS:
        return <MyReports />;
      case Page.USERS:
        if (currentUser?.role === 'Admin') return <Users />;
        return <Dashboard user={currentUser} />;
      case Page.PROFILE:
        return <Profile user={currentUser} />;
      default:
        return <Dashboard user={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout}
        user={currentUser}
      />
      <main className="flex-1 flex flex-col">
        {renderPage()}
      </main>
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-background-dark/50">
        <p className="text-slate-400 text-xs font-medium">
          ShiftTrack Enterprise v3.1.0 • Powered by <a href="https://ardi.agency/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><strong className="text-orange-500">ALPHA 360</strong> • ardi.agency</a>
        </p>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
