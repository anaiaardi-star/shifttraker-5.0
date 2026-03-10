
import React, { useState, useEffect } from 'react';
import { ApiService, User } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { t, language } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'locating' | 'syncing' | 'done' | 'error'>('idle');
  const [commentStart, setCommentStart] = useState('');
  const [commentEnd, setCommentEnd] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startData, setStartData] = useState<{ iso: Date; displayTime: string; displayDate: string } | null>(null);
  const [timezone, setTimezone] = useState(user?.timezone || 'America/New_York');

  useEffect(() => {
    const fetchTz = async () => {
      if (user) {
        const tz = await ApiService.getUserTimezone(user);
        if (tz) setTimezone(tz);
      }
    };
    fetchTz();
  }, [user]);

  useEffect(() => {
    const validateActiveShift = async () => {
      if (!user) return;
      
      // Primero revisamos localmente por rapidez
      const activeSession = ApiService.getActiveSession();
      if (activeSession && activeSession.iso) {
        setStartData({
          iso: new Date(activeSession.iso),
          displayTime: activeSession.displayTime,
          displayDate: activeSession.displayDate
        });
        setIsActive(true);
      }

      // Luego validamos con el servidor (webhook) para estar seguros
      const serverActiveShift = await ApiService.checkActiveShift(user, timezone);
      if (serverActiveShift) {
        setStartData({
          iso: new Date(serverActiveShift.iso),
          displayTime: serverActiveShift.displayTime,
          displayDate: serverActiveShift.displayDate
        });
        setIsActive(true);
      } else if (activeSession) {
        // Si el servidor dice que NO está activo pero localmente sí, limpiamos local
        ApiService.clearActiveSession();
        setIsActive(false);
        setStartData(null);
      }
    };

    validateActiveShift();
  }, [user, timezone]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPosition = () => {
    return new Promise<{ lat: number; lng: number; accuracy: number } | null>((resolve) => {
        if (!navigator.geolocation) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    });
  };

  const handleStartShift = async () => {
    if (!user) return;
    setSyncStatus('locating');
    const locationData = await getPosition();
    setSyncStatus('syncing');
    const result = await ApiService.startShift(user, locationData || undefined, commentStart, timezone);
    if (result) {
        setStartData({
            iso: result.iso,
            displayTime: result.displayTime,
            displayDate: result.displayDate
        });
    } else {
        const now = new Date();
        setStartData({
            iso: now,
            displayTime: now.toLocaleTimeString("en-US", { timeZone: timezone, hour12: false }),
            displayDate: now.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { timeZone: timezone })
        });
    }
    setIsActive(true);
    setShowSummary(false);
    setSyncStatus('idle');
    setCommentStart('');
  };

  const calculateDuration = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { str: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, seconds: totalSeconds };
  };

  const handleEndShift = async () => {
    if (!user || !startData) return;
    setSyncStatus('locating');
    const locationDataEnd = await getPosition();
    const endTime = new Date();
    setSyncStatus('syncing');
    const { str: durationStr, seconds: secondsDiff } = calculateDuration(startData.iso, endTime);

    const userTz = timezone;
    const shiftData = {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      date: new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(endTime),
      startTime: startData.displayTime, 
      endTime: endTime.toLocaleTimeString("en-US", { timeZone: userTz, hour12: false }), 
      duration: durationStr,
      seconds: secondsDiff,
      status: 'completed',
      color: 'bg-primary/10 text-primary',
      timestamp_start: startData.iso.toISOString(),
      timestamp_end: endTime.toISOString(),
      timezone: userTz
    };

    await ApiService.endShift(shiftData, locationDataEnd || undefined, commentEnd);
    setSyncStatus('done');
    setIsActive(false);
    setShowSummary(true);
    setCommentEnd('');
  };

  const userTz = timezone;
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const dateDisplayRaw = new Intl.DateTimeFormat(locale, { 
      timeZone: userTz, 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
  }).format(currentDate);
  
  const dateDisplay = dateDisplayRaw.charAt(0).toUpperCase() + dateDisplayRaw.slice(1);
  const timeDisplay = currentDate.toLocaleTimeString(locale, { timeZone: userTz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (showSummary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl text-center w-full">
          <div className="size-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-5xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{t('dash.success_title')}</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">{t('dash.success_desc')}</p>
          <button onClick={() => setShowSummary(false)} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-all">
            {t('dash.btn_back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 md:py-12 max-w-5xl mx-auto w-full relative">
      <div className="fixed inset-0 pointer-events-none glowing-aura z-0"></div>
      <div className="relative z-10 w-full flex flex-col items-center">
        {!isActive ? (
          <>
            <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="text-primary font-bold tracking-[0.2em] uppercase text-[10px] mb-4 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">{t('dash.terminal')}</p>
              <h1 className="text-slate-900 dark:text-white text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                {t('dash.hello')}, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium mb-8">
                 {dateDisplay} ({timezone})
              </p>
              <div className="text-7xl md:text-8xl font-black font-mono text-slate-900 dark:text-white tracking-tighter mb-8 tabular-nums drop-shadow-sm">
                 {timeDisplay}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                 <span className="material-symbols-outlined text-lg animate-pulse text-success">database</span>
                 {t('dash.ready')}
              </div>
            </div>

            <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 text-center relative overflow-hidden animate-in zoom-in-95 duration-500 delay-150">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <div className="size-20 bg-white dark:bg-slate-800 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-4xl">timer</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('dash.start_q')}</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">{t('dash.start_desc')}</p>
                <div className="mb-6 space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-widest">{t('dash.note_label')}</label>
                  <textarea 
                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm p-4 focus:ring-4 focus:ring-primary/10 transition-all resize-none min-h-[100px]" 
                    placeholder={t('dash.note_placeholder')}
                    value={commentStart}
                    onChange={(e) => setCommentStart(e.target.value)}
                    disabled={syncStatus === 'syncing' || syncStatus === 'locating'}
                  />
                </div>
                <button onClick={handleStartShift} disabled={syncStatus === 'syncing' || syncStatus === 'locating'} className="w-full bg-primary text-white font-bold h-14 rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                  {syncStatus === 'locating' ? t('dash.btn_locating') : t('dash.btn_start')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-12 mb-10 border-t-4 border-t-primary animate-in fade-in slide-in-from-bottom-8">
            <div className="flex flex-col items-center">
              <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                 <span className="size-2 bg-primary rounded-full animate-pulse"></span>
                 {t('dash.in_progress')}
              </div>
              <div className="flex flex-col md:flex-row gap-8 py-6 w-full justify-center items-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-24 w-40 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-inner">
                    <p className="text-slate-900 dark:text-white text-4xl font-black font-mono tracking-tighter">{startData?.displayTime || '--:--'}</p>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('dash.start_time')}</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-24 w-40 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-inner">
                    <p className="text-primary text-xl font-black text-center px-4">{startData?.displayDate || '---'}</p>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('dash.date')}</p>
                </div>
              </div>
              <div className="w-full max-w-md mt-6 mb-8 space-y-1 text-left mx-auto">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-widest">{t('dash.note_out')}</label>
                <textarea 
                  className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm p-4 focus:ring-4 focus:ring-primary/10 transition-all resize-none min-h-[100px]" 
                  placeholder={t('dash.note_out_placeholder')}
                  value={commentEnd}
                  onChange={(e) => setCommentEnd(e.target.value)}
                />
              </div>
              <button onClick={handleEndShift} disabled={syncStatus === 'syncing' || syncStatus === 'locating'} className="w-full max-w-md flex items-center justify-center gap-3 rounded-2xl h-16 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-lg font-bold shadow-xl transition-all">
                {syncStatus === 'locating' ? t('dash.btn_locating') : t('dash.btn_end')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
