
import React, { useEffect, useState } from 'react';
import { ApiService, User } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface ProfileProps {
  user: User | null;
}

export const Profile: React.FC<ProfileProps> = ({ user }) => {
  const { t, language } = useLanguage();
  const [extraInfo, setExtraInfo] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    timezone: 'America/New_York'
  });

  useEffect(() => {
    if (user?.email) {
      // Fetch main profile info
      ApiService.getUserProfile(user).then(data => {
        setExtraInfo(data);
        setFormData(prev => ({
          ...prev,
          name: data.name || user.name || '',
          phone: data.phone || '',
          timezone: data.timezone || prev.timezone
        }));
      });

      // Fetch specific timezone from the new webhook as requested
      ApiService.getUserTimezone(user).then(tz => {
        if (tz) {
          setFormData(prev => ({
            ...prev,
            timezone: tz
          }));
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveStatus('idle');
    
    const success = await ApiService.updateUser(user, {
      nombre: formData.name,
      phone: formData.phone,
      timezone: formData.timezone
    });

    // Also call the specific timezone update webhook as requested
    await ApiService.updateUserTimezone(user.email, formData.timezone);

    if (success) {
      setSaveStatus('success');
      // Update local extraInfo
      setExtraInfo(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
    } else {
      setSaveStatus('error');
    }
    setIsSaving(false);
    
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleCancel = () => {
    setFormData({
      name: extraInfo.name || user?.name || '',
      phone: extraInfo.phone || '',
      timezone: extraInfo.timezone || 'America/New_York'
    });
    setIsEditing(false);
  };

  const displayName = extraInfo.name || user?.name || 'User';
  const displayRole = extraInfo.role || user?.role || 'User';
  const displayEmail = extraInfo.email || user?.email || 'user@company.com';
  const displayAvatar = extraInfo.avatar || user?.avatar || 'https://via.placeholder.com/200';

  const timezones = [
    { value: 'America/New_York', label: '(GMT-05:00) Eastern Time - New York' },
    { value: 'America/Chicago', label: '(GMT-06:00) Central Time - Chicago' },
    { value: 'America/Denver', label: '(GMT-07:00) Mountain Time - Denver' },
    { value: 'America/Phoenix', label: '(GMT-07:00) Mountain Time - Phoenix' },
    { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time - Los Angeles' },
    { value: 'America/Anchorage', label: '(GMT-09:00) Alaska Time' },
    { value: 'America/Adak', label: '(GMT-10:00) Hawaii-Aleutian Time' },
    { value: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii Time' },
    { value: 'America/Caracas', label: '(GMT-04:00) Venezuela Time - Caracas' },
    { value: 'America/Bogota', label: '(GMT-05:00) Colombia Time - Bogota' },
    { value: 'America/Lima', label: '(GMT-05:00) Peru Time - Lima' },
    { value: 'America/Mexico_City', label: '(GMT-06:00) Mexico City Time' },
    { value: 'America/Argentina/Buenos_Aires', label: '(GMT-03:00) Argentina Time - Buenos Aires' },
    { value: 'America/Santiago', label: '(GMT-03:00) Chile Time - Santiago' },
    { value: 'America/Sao_Paulo', label: '(GMT-03:00) Brazil Time - Sao Paulo' },
    { value: 'America/Guatemala', label: '(GMT-06:00) Guatemala Time' },
    { value: 'America/Panama', label: '(GMT-05:00) Panama Time' },
    { value: 'America/Santo_Domingo', label: '(GMT-04:00) Dominican Republic Time' },
    { value: 'America/Puerto_Rico', label: '(GMT-04:00) Puerto Rico Time' },
    { value: 'Europe/London', label: '(GMT+00:00) Western European Time - London' },
    { value: 'Europe/Madrid', label: '(GMT+01:00) Central European Time - Madrid' },
    { value: 'Europe/Paris', label: '(GMT+01:00) Central European Time - Paris' },
    { value: 'Europe/Berlin', label: '(GMT+01:00) Central European Time - Berlin' },
    { value: 'Europe/Rome', label: '(GMT+01:00) Central European Time - Rome' },
    { value: 'Europe/Moscow', label: '(GMT+03:00) Moscow Time' },
    { value: 'Asia/Dubai', label: '(GMT+04:00) Gulf Standard Time - Dubai' },
    { value: 'Asia/Tokyo', label: '(GMT+09:00) Japan Standard Time - Tokyo' },
    { value: 'Asia/Shanghai', label: '(GMT+08:00) China Standard Time - Shanghai' },
    { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore Standard Time' },
    { value: 'Australia/Sydney', label: '(GMT+11:00) Australian Eastern Time - Sydney' },
    { value: 'UTC', label: '(GMT+00:00) Coordinated Universal Time (UTC)' }
  ].sort((a, b) => a.label.localeCompare(b.label));

  const currentTzLabel = timezones.find(tz => tz.value === formData.timezone)?.label || formData.timezone;

  return (
    <div className="flex-1 w-full max-w-[960px] mx-auto py-10 px-6 md:px-10 lg:px-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">{t('prof.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal">{t('prof.desc')}</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            {t('prof.edit')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-32 border-4 border-white dark:border-slate-800 shadow-md" style={{ backgroundImage: `url("${displayAvatar}")` }}></div>
          <div className="flex flex-col justify-center text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1">
              <h2 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{displayName}</h2>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest">{displayRole}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('prof.id')}: #{user?.id || 'AR-1092'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-8 bg-slate-50/30 dark:bg-slate-800/20">
          <button className="border-b-[3px] border-primary text-primary pb-3 pt-4 font-bold text-sm">{t('prof.general_info')}</button>
        </div>

        <div className="p-8">
          <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6">{t('prof.details')}</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('prof.name')}</label>
              {isEditing ? (
                <input 
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <div className="px-4 py-3 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-transparent">
                  {displayName}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('prof.email')}</label>
              <div className="px-4 py-3 text-sm text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-transparent cursor-not-allowed">
                {displayEmail}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('prof.phone')}</label>
              {isEditing ? (
                <input 
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <div className="px-4 py-3 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-transparent">
                  {formData.phone || '---'}
                </div>
              )}
            </div>
            {user?.role === 'Admin' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('prof.role')}</label>
                <div className="px-4 py-3 text-sm text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-transparent">
                  {displayRole}
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('prof.timezone')}</label>
              {isEditing ? (
                <>
                  <select 
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    value={formData.timezone}
                    onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 italic">{t('prof.timezone_desc')}</p>
                </>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-transparent">
                  <span>{currentTzLabel}</span>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {language === 'es' ? 'Cambiar' : 'Change'}
                  </button>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="md:col-span-2 pt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div>
                  {saveStatus === 'error' && <span className="text-error text-sm font-bold flex items-center gap-2"><span className="material-symbols-outlined text-lg">error</span> Error al guardar</span>}
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    {t('prof.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                    {t('prof.save')}
                  </button>
                </div>
              </div>
            )}
            
            {!isEditing && saveStatus === 'success' && (
              <div className="md:col-span-2 pt-4 flex justify-center">
                <span className="text-success text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span> 
                  {language === 'es' ? 'Cambios guardados correctamente' : 'Changes saved successfully'}
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
