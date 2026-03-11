
import { Page } from '../App';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  id_subcuenta?: string; // Variable crítica para filtrado en n8n
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  userAvatar?: string;
  date: string;
  endDate: string; 
  rawDate: string; 
  startTime: string;
  endTime: string;
  rawEndTime?: string;
  duration: string;
  seconds: number;
  status: string;
  isInProgress: boolean;
  color: string;
  comment_start?: string;
  comment_end?: string;
  latitude?: number;
  longitude?: number;
  latitude_end?: number;
  longitude_end?: number;
}

const AUTH_KEY = 'shifttrack_auth_user';
const ACTIVE_SESSION_KEY = 'shifttrack_active_session_v1';

const WEBHOOKS = {
  REGISTRO: 'https://n8n.smarttitan.pro/webhook/ShiftTrack-registro',
  LOGIN: 'https://n8n.smarttitan.pro/webhook/ShiftTrack-login',
  INFO_USUARIO: 'https://n8n.smarttitan.pro/webhook/shifttytrack-miperfil',
  INICIO_TURNO: 'https://n8n.smarttitan.pro/webhook/ShiftTrack-horadeinicio',
  FIN_TURNO: 'https://n8n.smarttitan.pro/webhook/ShiftTrack-horafinal',
  HISTORIAL_DATOS: 'https://n8n.smarttitan.pro/webhook/ShiftTrack-cargadedatos',
  MIS_DATOS: 'https://n8n.smarttitan.pro/webhook/shiftTrack-carga_mis_dedatos',
  CARGAR_USUARIOS: 'https://n8n.smarttitan.pro/webhook/ShiftTrack-cargarusuario',
  ELIMINAR_USUARIO: 'https://n8n.smarttitan.pro/webhook/ShiftTrack-eliminarusuario',
  EDITAR_USUARIO: 'https://n8n.smarttitan.pro/webhook/ShiftTrack-editarusuario',
  ESTADO_ACTIVO: 'https://n8n.smarttitan.pro/webhook/shiftTrack-estadoactivo',
  ZONA_HORARIA: 'https://n8n.smarttitan.pro/webhook/shiftTrack-zonahoraria',
  ZONA_HORARIA_ACTUALIZAR: 'https://n8n.smarttitan.pro/webhook/shiftTrack-zonahoraria-actualizar'
};

const normalizeListResponse = (rawData: any): any[] => {
  if (!rawData) return [];
  if (Array.isArray(rawData)) {
    return rawData.map(item => item.json || item);
  }
  const keys = ['data', 'rows', 'users', 'shifts', 'items', 'output', 'user', 'body'];
  for (const key of keys) {
    if (Array.isArray(rawData[key])) return rawData[key].map((item: any) => item.json || item);
    if (typeof rawData[key] === 'object' && rawData[key] !== null) return [rawData[key].json || rawData[key]];
  }
  if (typeof rawData === 'object' && rawData.status !== 'error' && rawData.error !== true) {
      return [rawData];
  }
  return [];
};

export const ApiService = {
  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  getSubaccountId: (): string => {
    const user = ApiService.getCurrentUser();
    return user?.id_subcuenta || "";
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  },

  loginUser: async (credentials: { email: string; password: string; subaccountId?: string }): Promise<User> => {
    const initialId = credentials.subaccountId || "";
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(WEBHOOKS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: credentials.email, 
          password: credentials.password, 
          id_subcuenta: initialId 
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`);
      }

      const rawData = await response.json();

      if (rawData.status === 'error' || rawData.error === true) {
        throw new Error(rawData.message || "Credenciales inválidas.");
      }

      const list = normalizeListResponse(rawData);
      if (list.length === 0) {
        throw new Error("No se encontraron datos del usuario tras el login.");
      }

      const data = list[0];
      const finalSubaccount = data.id_subcuenta || data.subaccount_id || data.id_sub || data.subcuenta || initialId;

      const user: User = {
        id: (data.id || data.user_id || Date.now().toString()).toString(),
        name: data.nombre || data.name || data.user_name || credentials.email.split('@')[0],
        email: data.email || data.user_email || credentials.email,
        role: data.rol || data.role || 'User',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nombre || data.name || 'User')}&background=random`,
        timezone: data.timezone || data.zona_horaria || 'America/New_York',
        id_subcuenta: finalSubaccount 
      };

      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        throw new Error("La solicitud tardó demasiado tiempo. El servidor n8n no está respondiendo.");
      }
      throw e;
    }
  },

  registerUserReal: async (userData: any): Promise<User> => {
    const currentUser = ApiService.getCurrentUser();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(WEBHOOKS.REGISTRO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...userData, 
          id_subcuenta: ApiService.getSubaccountId(),
          requester_email: currentUser?.email || "",
          requester_id: currentUser?.id || ""
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`);
      }

      const rawData = await response.json();
      const list = normalizeListResponse(rawData);
      const data = list[0] || rawData;
      
      const user: User = {
        id: (data.id || data.user_id || Date.now().toString()).toString(),
        name: data.nombre || data.name || data.user_name || userData.name || 'Usuario',
        email: data.email || userData.email,
        role: data.rol || data.role || userData.role || 'User',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nombre || userData.name || 'User')}&background=random`,
        id_subcuenta: data.id_subcuenta || data.subaccount_id || ApiService.getSubaccountId()
      };
      
      if (!localStorage.getItem(AUTH_KEY)) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      }
      return user;
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        throw new Error("La solicitud de registro tardó demasiado tiempo.");
      }
      throw e;
    }
  },

  startShift: async (user: User, locationData?: { lat: number; lng: number }, comment?: string, timezoneOverride?: string) => {
    const now = new Date();
    const userTz = timezoneOverride || user.timezone || 'America/New_York';
    await fetch(WEBHOOKS.INICIO_TURNO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        timestamp_start: now.toISOString(),
        id_subcuenta: ApiService.getSubaccountId(),
        latitude: locationData?.lat || null,
        longitude: locationData?.lng || null,
        comentario_inicio: comment || "",
        timezone: userTz
      }),
    });
    const result = { 
      iso: now.toISOString(), 
      displayTime: now.toLocaleTimeString("en-US", { timeZone: userTz, hour12: false }), 
      displayDate: now.toLocaleDateString("en-US", { timeZone: userTz }) 
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(result));
    return { ...result, miamiDisplayTime: result.displayTime, miamiDisplayDate: result.displayDate, iso: now };
  },

  getActiveSession: () => {
    const data = localStorage.getItem(ACTIVE_SESSION_KEY);
    try { return data ? JSON.parse(data) : null; } catch (e) { return null; }
  },

  clearActiveSession: () => {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  },

  checkActiveShift: async (user: User, timezoneOverride?: string) => {
    try {
      const response = await fetch(WEBHOOKS.ESTADO_ACTIVO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          id_subcuenta: ApiService.getSubaccountId()
        })
      });
      if (!response.ok) return null;
      const data = await response.json();
      
      // Si el estado es activo o inicio, devolvemos los datos para cargar la vista
      if (data.estado === 'activo' || data.status === 'activo' || data.status === 'inicio') {
        const startRaw = data.timestamp_start || data.start_time || data.fecha;
        if (!startRaw) return null;
        
        const d = new Date(startRaw);
        const userTz = timezoneOverride || user.timezone || 'America/New_York';
        const result = {
          iso: d.toISOString(),
          displayTime: d.toLocaleTimeString("en-US", { timeZone: userTz, hour12: false }),
          displayDate: d.toLocaleDateString("en-US", { timeZone: userTz })
        };
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(result));
        return result;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  endShift: async (shiftData: any, locationData?: { lat: number; lng: number }, commentEnd?: string) => {
    const user = ApiService.getCurrentUser();
    const userTz = user?.timezone || 'America/New_York';
    await fetch(WEBHOOKS.FIN_TURNO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...shiftData, 
        latitude_end: locationData?.lat || null,
        longitude_end: locationData?.lng || null,
        comentario_final: commentEnd || "",
        id_subcuenta: ApiService.getSubaccountId(),
        timezone: userTz
      }),
    });
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    return true;
  },

  fetchAllReports: async (timezoneOverride?: string): Promise<Shift[]> => {
    try {
      const user = ApiService.getCurrentUser();
      const subaccount = ApiService.getSubaccountId();
      const userTz = timezoneOverride || user?.timezone || 'America/New_York';
      
      const response = await fetch(WEBHOOKS.HISTORIAL_DATOS, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            request: 'get_all', 
            id_subcuenta: subaccount,
            user_id: user?.id || "",
            email: user?.email || "",
            role: user?.role || ""
        }) 
      });
      const rawData = await response.json();
      const list = normalizeListResponse(rawData);
      
      return list.map((data: any) => {
         const startRaw = data.start_time || data.timestamp_start || data.fecha;
         const endRaw = data.end_time || data.timestamp_end || null;
         const status = data.status || "";
         const isCerrado = status.toLowerCase() === 'cerrado' || status.toLowerCase() === 'completed';

         const formatTime = (val: any) => {
            if (!val || val === "0" || val === "") return "";
            if (typeof val === 'string' && /^\d{2}:\d{2}/.test(val) && val.length < 10) return val.substring(0, 5);
            const d = new Date(val);
            if (isNaN(d.getTime())) {
                const match = String(val).match(/\d{2}:\d{2}/);
                return match ? match[0] : "";
            }
            return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: userTz });
         };

         const name = data.user_name || data.nombre || data.name || 'Sin nombre';

         // Función auxiliar para coordenadas: busca en múltiples posibles nombres de campo
         const parseCoord = (val: any) => {
            if (val === null || val === undefined || val === "" || val === "null") return undefined;
            const cleaned = String(val).trim();
            const n = parseFloat(cleaned);
            if (isNaN(n)) return undefined;
            return n;
         };

         // Calculate duration if missing or zero
         let duration = data.duration || '00:00:00';
         let seconds = Number(data.seconds) || 0;

         if ((!duration || duration === '00:00:00' || seconds === 0) && startRaw && endRaw && isCerrado) {
            const startD = new Date(startRaw);
            const endD = new Date(endRaw);
            if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
                const diffMs = endD.getTime() - startD.getTime();
                if (diffMs > 0) {
                    seconds = Math.floor(diffMs / 1000);
                    const hrs = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    const secs = Math.floor(seconds % 60);
                    duration = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                }
            }
         }

         return {
            id: (data.id || Math.random().toString(36).substr(2, 9)).toString(),
            userId: (data.user_id || '').toString(),
            userName: name,
            userRole: data.user_role || data.rol || data.role || 'Sin rol',
            userEmail: data.user_email || data.email || '',
            userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            date: data.fecha || '---',
            endDate: isCerrado ? (data.fecha_fin || '---') : '---',
            rawDate: startRaw, 
            startTime: formatTime(startRaw),
            endTime: (isCerrado && isNaN(Number(endRaw))) ? formatTime(endRaw) : (isCerrado ? "Cerrado" : ""),
            rawEndTime: endRaw,
            duration: duration,
            seconds: seconds,
            status: status,
            isInProgress: !isCerrado,
            color: 'bg-primary/10 text-primary',
            comment_start: data.comentario_inicio || data.comentario_entrada || data.check_in_comment || "",
            comment_end: data.comentario_fin || data.comentario_final || data.comentario_salida || data.check_out_comment || "",
            latitude: parseCoord(data.latidude ?? data.latitude ?? data.lat ?? data.latitud ?? data.start_lat ?? data.ubicacion_inicio_lat),
            longitude: parseCoord(data.longitude ?? data.lng ?? data.longitud ?? data.start_lng ?? data.ubicacion_inicio_lng),
            latitude_end: parseCoord(data.latidude_final ?? data.latitude_end ?? data.lat_end ?? data.latitud_fin ?? data.end_lat ?? data.ubicacion_fin_lat),
            longitude_end: parseCoord(data.longitude_final ?? data.longitude_end ?? data.lng_end ?? data.longitud_fin ?? data.end_lng ?? data.ubicacion_fin_lng)
         };
      });
    } catch (e) { 
        return []; 
    }
  },

  fetchMyReports: async (timezoneOverride?: string): Promise<Shift[]> => {
    try {
      const user = ApiService.getCurrentUser();
      const subaccount = ApiService.getSubaccountId();
      const userTz = timezoneOverride || user?.timezone || 'America/New_York';
      
      const bodyParams = new URLSearchParams();
      bodyParams.append('request', 'get_my_reports');
      bodyParams.append('id_subcuenta', subaccount);
      bodyParams.append('user_id', user?.id || "");
      bodyParams.append('email', user?.email || "");
      bodyParams.append('role', user?.role || "");

      const response = await fetch(WEBHOOKS.MIS_DATOS, {
        method: 'POST', 
        body: bodyParams
      });
      
      if (!response.ok) return [];

      const rawData = await response.json();
      const list = normalizeListResponse(rawData);
      
      return list.map((data: any) => {
         const startRaw = data.start_time || data.timestamp_start || data.fecha;
         const endRaw = data.end_time || data.timestamp_end || null;
         const status = data.status || "";
         const isCerrado = status.toLowerCase() === 'cerrado' || status.toLowerCase() === 'completed';

         const formatTime = (val: any) => {
            if (!val || val === "0" || val === "") return "";
            if (typeof val === 'string' && /^\d{2}:\d{2}/.test(val) && val.length < 10) return val.substring(0, 5);
            const d = new Date(val);
            if (isNaN(d.getTime())) {
                const match = String(val).match(/\d{2}:\d{2}/);
                return match ? match[0] : "";
            }
            return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: userTz });
         };

         const name = data.user_name || data.nombre || data.name || 'Sin nombre';

         const parseCoord = (val: any) => {
            if (val === null || val === undefined || val === "" || val === "null") return undefined;
            const cleaned = String(val).trim();
            const n = parseFloat(cleaned);
            if (isNaN(n)) return undefined;
            return n;
         };

         // Calculate duration if missing or zero
         let duration = data.duration || '00:00:00';
         let seconds = Number(data.seconds) || 0;

         if ((!duration || duration === '00:00:00' || seconds === 0) && startRaw && endRaw && isCerrado) {
            const startD = new Date(startRaw);
            const endD = new Date(endRaw);
            if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
                const diffMs = endD.getTime() - startD.getTime();
                if (diffMs > 0) {
                    seconds = Math.floor(diffMs / 1000);
                    const hrs = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    const secs = Math.floor(seconds % 60);
                    duration = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                }
            }
         }

         return {
            id: (data.id || Math.random().toString(36).substr(2, 9)).toString(),
            userId: (data.user_id || '').toString(),
            userName: name,
            userRole: data.user_role || data.rol || data.role || 'Sin rol',
            userEmail: data.user_email || data.email || '',
            userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            date: data.fecha || '---',
            endDate: isCerrado ? (data.fecha_fin || '---') : '---',
            rawDate: startRaw, 
            startTime: formatTime(startRaw),
            endTime: (isCerrado && isNaN(Number(endRaw))) ? formatTime(endRaw) : (isCerrado ? "Cerrado" : ""),
            rawEndTime: endRaw,
            duration: duration,
            seconds: seconds,
            status: status,
            isInProgress: !isCerrado,
            color: 'bg-primary/10 text-primary',
            comment_start: data.comentario_inicio || data.comentario_entrada || data.check_in_comment || "",
            comment_end: data.comentario_fin || data.comentario_final || data.comentario_salida || data.check_out_comment || "",
            latitude: parseCoord(data.latidude ?? data.latitude ?? data.lat ?? data.latitud ?? data.start_lat ?? data.ubicacion_inicio_lat),
            longitude: parseCoord(data.longitude ?? data.lng ?? data.longitud ?? data.start_lng ?? data.ubicacion_inicio_lng),
            latitude_end: parseCoord(data.latidude_final ?? data.latitude_end ?? data.lat_end ?? data.latitud_fin ?? data.end_lat ?? data.ubicacion_fin_lat),
            longitude_end: parseCoord(data.longitude_final ?? data.longitude_end ?? data.lng_end ?? data.longitud_fin ?? data.end_lng ?? data.ubicacion_fin_lng)
         };
      });
    } catch (e) { 
        return []; 
    }
  },

  fetchUsers: async (): Promise<User[]> => {
     try {
       const user = ApiService.getCurrentUser();
       const response = await fetch(WEBHOOKS.CARGAR_USUARIOS, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
            request: 'get_all_users', 
            id_subcuenta: ApiService.getSubaccountId(),
            user_id: user?.id || "",
            email: user?.email || "",
            role: user?.role || ""
         })
       });
       const rawData = await response.json();
       const list = normalizeListResponse(rawData);
       return list.map((data: any, index: number) => {
         const name = data.nombre || data.name || data.user_name || data.email || `Usuario ${index + 1}`;
         return {
            id: (data.id || data.user_id || `u-${index}`).toString(),
            name,
            email: data.email || data.user_email || '',
            role: data.rol || data.role || 'Analyst',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            id_subcuenta: data.id_subcuenta || data.subaccount_id || ApiService.getSubaccountId()
         };
       });
     } catch (e) { return []; }
  },

  deleteUser: async (userToDelete: User): Promise<boolean> => {
    try {
      const currentUser = ApiService.getCurrentUser();
      const response = await fetch(WEBHOOKS.ELIMINAR_USUARIO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...userToDelete, 
          action: 'delete', 
          id_subcuenta: ApiService.getSubaccountId(),
          requester_id: currentUser?.id || "",
          requester_email: currentUser?.email || ""
        })
      });
      return response.ok;
    } catch (error) { return false; }
  },

  updateUser: async (userToUpdate: User, newValues: any): Promise<boolean> => {
    try {
      const currentUser = ApiService.getCurrentUser();
      const response = await fetch(WEBHOOKS.EDITAR_USUARIO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: userToUpdate.id,
          user_id: userToUpdate.id,
          ...newValues, 
          id_subcuenta: ApiService.getSubaccountId(),
          requester_id: currentUser?.id || "",
          requester_email: currentUser?.email || ""
        })
      });
      
      if (response.ok && currentUser?.id === userToUpdate.id) {
        // If we updated our own profile, update the local AUTH_KEY
        const updatedUser = { ...currentUser, ...newValues };
        // Map common fields if they use different names in newValues
        if (newValues.nombre) updatedUser.name = newValues.nombre;
        localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
      }

      return response.ok;
    } catch (error) { return false; }
  },

  getUserProfile: async (userOrEmail: User | string): Promise<Partial<User>> => {
    try {
      const isUser = typeof userOrEmail === 'object';
      const email = isUser ? userOrEmail.email : userOrEmail;
      const user_id = isUser ? userOrEmail.id : undefined;
      const id_subcuenta = isUser ? userOrEmail.id_subcuenta : ApiService.getSubaccountId();

      const response = await fetch(WEBHOOKS.INFO_USUARIO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            user_id,
            id_subcuenta: id_subcuenta || ApiService.getSubaccountId() 
        })
      });
      const rawData = await response.json();
      const list = normalizeListResponse(rawData);
      const data = list[0] || rawData;
      return {
        id: (data.id || data.user_id || '').toString(),
        name: data.nombre || data.name || data.user_name,
        email: data.email || email,
        role: data.rol || data.role,
        avatar: data.avatar,
        phone: data.phone || data.telefono,
        timezone: data.timezone || data.zona_horaria || 'America/New_York',
        id_subcuenta: data.id_subcuenta || data.subaccount_id || data.id_sub || data.subcuenta
      };
    } catch (e) { return {}; }
  },

  getUserTimezone: async (user: User): Promise<string> => {
    try {
      const response = await fetch(WEBHOOKS.ZONA_HORARIA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id,
          id_subcuenta: user.id_subcuenta || ApiService.getSubaccountId(),
          email: user.email
        })
      });
      const data = await response.json();
      const list = normalizeListResponse(data);
      if (list.length > 0) {
        // El usuario especificó que la variable se llama "zona"
        return list[0].zona || list[0].timezone || list[0].zona_horaria || 'America/New_York';
      }
      return 'America/New_York';
    } catch (e) { 
      return 'America/New_York'; 
    }
  },

  updateUserTimezone: async (email: string, timezone: string): Promise<boolean> => {
    try {
      const response = await fetch(WEBHOOKS.ZONA_HORARIA_ACTUALIZAR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            timezone,
            id_subcuenta: ApiService.getSubaccountId() 
        })
      });
      return response.ok;
    } catch (e) { 
      return false; 
    }
  },

  getEndpoints: () => WEBHOOKS
};
