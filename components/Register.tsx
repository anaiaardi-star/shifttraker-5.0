
import React, { useState } from 'react';
import { ApiService, User } from '../services/api';

interface RegisterProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: (user: User) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Analyst'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side email validation
    if (!validateEmail(formData.email)) {
      setError('Por favor, ingresa un formato de correo electrónico válido (ej: nombre@empresa.com).');
      return;
    }

    setIsLoading(true);
    setStatusMsg('Enviando datos al servidor...');
    
    try {
      // Conexión real al Webhook de SmartTitan (Endpoint de Login/Registro unificado)
      setStatusMsg('Contactando n8n.smarttitan.pro...');
      
      // registerUserReal ahora devuelve el usuario y guarda la sesión
      const user = await ApiService.registerUserReal(formData);
      
      setRegisteredUser(user);
      setStatusMsg('¡Acceso concedido!');
      setSuccess(true);
      
      // Pequeña pausa para mostrar el éxito antes de entrar al dashboard
      setTimeout(() => {
        setIsLoading(false);
        onRegisterSuccess(user);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      // Mostrar el error real del servidor o de conexión
      setError(err.message || 'Error de conexión con el servidor. Intenta nuevamente.');
    }
  };

  if (success) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 text-center max-w-md w-full animate-in zoom-in-95 duration-300">
          <div className="size-24 bg-gradient-to-br from-success to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-success/30 animate-bounce">
            <span className="material-symbols-outlined text-5xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">¡Bienvenido!</h2>
          <p className="text-slate-500 mb-8">Cuenta verificada. Ingresando al sistema como <strong>{registeredUser?.name}</strong>...</p>
          <div className="flex items-center justify-center gap-3 text-slate-400 font-bold text-sm">
            <div className="size-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            Cargando Dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4">
      <div className="flex w-full max-w-[1100px] min-h-[750px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex-col md:flex-row border border-slate-100 dark:border-slate-800">
        
        {/* Lado Izquierdo: Branding n8n */}
        <div className="hidden md:flex md:w-5/12 bg-slate-950 relative overflow-hidden flex-col justify-between p-12 text-white">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#4848e5_1px,transparent_1px)] [background-size:20px_20px]"></div>
          </div>
          <div className="relative z-10 flex items-center gap-3">
             <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white">hub</span>
             </div>
             <h2 className="text-xl font-bold tracking-tight">SmartTitan API</h2>
          </div>
          
          <div className="relative z-10 space-y-6">
            <h1 className="text-4xl font-black leading-tight">Gestión de Usuarios Centralizada</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tus datos son procesados mediante flujos de automatización seguros que garantizan la integridad en PostgreSQL.
            </p>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4">
               <div className="size-10 bg-success/20 text-success rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">shield_check</span>
               </div>
               <div className="text-[11px]">
                  <p className="font-bold text-white uppercase">Conexión Encriptada</p>
                  <p className="text-slate-500">HTTPS via n8n.smarttitan.pro</p>
               </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10">
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">PostgreSQL v15 + n8n Cluster</p>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="w-full md:w-7/12 flex flex-col justify-center px-8 py-10 md:px-16 lg:px-20 overflow-y-auto">
          <div className="max-w-[450px] w-full mx-auto">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight mb-2">Crear Cuenta</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Registra un nuevo usuario en la infraestructura remota.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <form className="grid grid-cols-1 gap-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-900 dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  className="flex w-full rounded-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-12 px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" 
                  placeholder="Juan Pérez"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-900 dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">Email</label>
                <input 
                  className="flex w-full rounded-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-12 px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" 
                  placeholder="email@ejemplo.com"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-900 dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">Contraseña</label>
                  <input 
                    className="flex w-full rounded-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-12 px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-900 dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">Rol (Rool)</label>
                  <select 
                    className="flex w-full rounded-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-12 px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    disabled={isLoading}
                  >
                    <option value="Analyst">Analista</option>
                    <option value="Manager">Gerente</option>
                    <option value="Admin">Administrador</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`flex flex-col w-full items-center justify-center rounded-2xl min-h-16 bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 transition-all ${isLoading ? 'opacity-90 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center py-2 animate-in fade-in">
                     <div className="flex items-center gap-2 mb-1">
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Verificando...</span>
                     </div>
                     <span className="text-[10px] font-medium opacity-90 px-4 text-center">{statusMsg}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-white">login</span>
                    Registrar y Entrar
                  </div>
                )}
              </button>

              <p className="text-center text-xs text-slate-500 mt-4">
                ¿Ya tienes cuenta? <button type="button" onClick={onNavigateToLogin} className="text-primary font-bold hover:underline" disabled={isLoading}>Inicia sesión</button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
