
import React, { useState } from 'react';
import { ApiService, User } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await ApiService.loginUser({ email, password });
      setIsLoading(false);
      if (user && user.id) {
        onLogin(user);
      } else {
        throw new Error("Incomplete user data");
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(t('login.error_auth'));
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4">
      <div className="flex w-full max-w-[1100px] min-h-[650px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex-col md:flex-row border border-slate-100 dark:border-slate-800">
        <div className="hidden md:flex md:w-5/12 bg-primary relative overflow-hidden flex-col justify-between p-12 text-white">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg height="100%" width="100%"><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill="url(#grid)"/></svg>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="size-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white">shield</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">ShiftTrack Pro</h2>
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold leading-tight mb-4">ShiftTrack Pro</h1>
            <p className="text-lg text-white/80 font-medium">Enterprise workforce management solution.</p>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <div className="size-2 bg-success rounded-full animate-pulse"></div>
            <p className="text-xs text-white/60 italic uppercase tracking-widest font-bold">PostgreSQL Online</p>
          </div>
        </div>

        <div className="w-full md:w-7/12 flex flex-col justify-center px-8 py-12 md:px-16 lg:px-24 relative">
          <div className="absolute top-6 right-6 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setLanguage('es')} 
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${language === 'es' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
            >
              ES
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
            >
              EN
            </button>
          </div>

          <div className="max-w-[400px] w-full mx-auto">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-slate-900 dark:text-white text-3xl font-extrabold mb-2">{t('login.welcome')}</h2>
              <p className="text-slate-500 text-base">{t('login.desc')}</p>
            </div>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger text-xs p-4 rounded-xl font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-sm font-bold">error</span>
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <p className="text-slate-900 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">{t('login.email')}</p>
                <input 
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-14 px-4 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                  value={email} 
                  type="email"
                  placeholder="admin@empresa.com"
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-slate-900 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">{t('login.pass')}</p>
                <input 
                  className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-14 px-4 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                  type="password" 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading} 
                className={`bg-primary text-white font-bold h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all ${isLoading ? 'opacity-80' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                {isLoading ? t('login.verifying') : t('login.button')}
              </button>
            </form>
            <p className="mt-10 text-slate-400 text-xs text-center">
              {t('login.footer')}
              <br />
              <a 
                href="https://wa.me/573134970533?text=Tu%20mensaje%20aqu%C3%AD"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-primary font-bold hover:underline"
              >
                Quieres tener esta herramienta haz click
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
