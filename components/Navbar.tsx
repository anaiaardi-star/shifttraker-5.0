
import React from 'react';
import { Page } from '../App';
import { User } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  user: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onLogout, user }) => {
  const { language, setLanguage, t } = useLanguage();

  const allNavItems = [
    { label: t('nav.dashboard'), page: Page.DASHBOARD, icon: 'dashboard', requiredRole: null },
    { label: t('nav.reports'), page: Page.REPORTS, icon: 'analytics', requiredRole: 'Admin' },
    { label: t('nav.my_reports'), page: Page.MY_REPORTS, icon: 'history', requiredRole: null },
    { label: t('nav.users'), page: Page.USERS, icon: 'group', requiredRole: 'Admin' },
    { label: t('nav.profile'), page: Page.PROFILE, icon: 'person', requiredRole: null },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.requiredRole === 'Admin') {
      return user?.role === 'Admin';
    }
    // Si es "My Reports", ocultarlo para Admins si ya tienen acceso a "Reports"
    if (item.page === Page.MY_REPORTS && user?.role === 'Admin') {
      return false;
    }
    return true;
  });

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate(Page.DASHBOARD)}>
        <div className="size-8 text-primary">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
          </svg>
        </div>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">ShiftTrack</h2>
      </div>

      <nav className="hidden md:flex flex-1 justify-center gap-8">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
              currentPage === item.page 
              ? 'text-primary border-b-2 border-primary pb-1' 
              : 'text-slate-500 dark:text-slate-400 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setLanguage('es')} 
            className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${language === 'es' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
          >
            ES
          </button>
          <button 
            onClick={() => setLanguage('en')} 
            className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
          >
            EN
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block animate-in fade-in slide-in-from-right-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
            </div>
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/20 cursor-pointer hover:scale-105 transition-transform" 
              style={{ backgroundImage: `url("${user.avatar || 'https://via.placeholder.com/100'}")` }}
              onClick={() => onNavigate(Page.PROFILE)}
            ></div>
          </div>
        )}
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>
        <button 
          onClick={onLogout}
          className="flex items-center justify-center size-10 rounded-xl text-slate-400 hover:text-danger hover:bg-danger/10 transition-all"
          title={t('nav.logout')}
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
};
