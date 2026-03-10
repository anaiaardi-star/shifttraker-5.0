
import React, { useState } from 'react';
import { ApiService } from '../services/api';

type ConfigTab = 'flow' | 'json' | 'sql' | 'status';

export const SystemConfig: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ConfigTab>('json');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const webhooks = ApiService.getEndpoints();

  return (
    <div className="flex-1 w-full max-w-[1100px] mx-auto py-10 px-6 md:px-10 relative">
      <div className="flex flex-col gap-8 mb-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-gradient-to-r from-primary to-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-widest">Producción SmartTitan</span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Infraestructura Webhook</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Configuración de endpoints para los 6 flujos operativos.</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
            <button onClick={() => setActiveTab('json')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'json' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Endpoints API
            </button>
            <button onClick={() => setActiveTab('flow')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'flow' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Ruta de Datos
            </button>
            <button onClick={() => setActiveTab('status')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'status' ? 'bg-white dark:bg-slate-700 text-success shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Estado DB
            </button>
          </div>

          {activeTab === 'json' && (
            <div className="bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-2xl p-8 animate-in zoom-in-95">
               <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">hub</span>
                 Webhook Endpoints Configurados
               </h3>
               
               <div className="grid gap-4">
                  {Object.entries(webhooks).map(([key, url]) => (
                    <div key={key} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between group">
                       <div className="mb-2 md:mb-0">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{key.replace('_', ' ')}</p>
                          <code className="text-indigo-300 font-mono text-xs break-all">{url}</code>
                       </div>
                       <button onClick={() => handleCopy(url, key)} className="self-end md:self-center p-2 bg-white/5 text-slate-400 rounded-lg hover:text-white hover:bg-white/10 transition-all">
                         <span className="material-symbols-outlined text-sm">{copied === key ? 'done' : 'content_copy'}</span>
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'flow' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                 <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
                    <div className="flex flex-col items-center gap-2">
                       <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border-2 border-primary/20"><span className="material-symbols-outlined text-3xl">language</span></div>
                       <span className="text-[10px] font-bold uppercase text-slate-400">Front (React)</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-200">trending_flat</span>
                    <div className="flex flex-col items-center gap-2">
                       <div className="size-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center border-2 border-primary/40 shadow-xl shadow-primary/10"><span className="material-symbols-outlined text-3xl">router</span></div>
                       <span className="text-[10px] font-bold uppercase text-slate-400">n8n Gateway</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-200">trending_flat</span>
                    <div className="flex flex-col items-center gap-2">
                       <div className="size-16 bg-success/10 text-success rounded-2xl flex items-center justify-center border-2 border-success/20"><span className="material-symbols-outlined text-3xl">database</span></div>
                       <span className="text-[10px] font-bold uppercase text-slate-400">PostgreSQL</span>
                    </div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 max-w-xl">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                       La aplicación segmenta el tráfico en 6 flujos distintos para optimizar la carga y la seguridad.
                       Cada acción crítica (Inicio, Fin, Registro) tiene su propio endpoint dedicado en SmartTitan.
                    </p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-bottom-4">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold">Monitor de Base de Datos</h3>
                    <p className="text-sm text-slate-500">Estado de la conexión vía n8n Relay</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full font-bold text-xs">
                    <span className="size-2 bg-success rounded-full animate-pulse"></span>
                    ONLINE
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                     <span className="text-sm font-medium">Latencia SmartTitan</span>
                     <span className="text-sm font-bold text-primary">42ms</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                     <span className="text-sm font-medium">Uptime del Nodo</span>
                     <span className="text-sm font-bold text-success">99.9%</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
