
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navbar
    'nav.dashboard': 'Panel Principal',
    'nav.reports': 'Reportes',
    'nav.my_reports': 'Mis Reportes',
    'nav.users': 'Usuarios',
    'nav.profile': 'Mi Perfil',
    'nav.logout': 'Cerrar sesión',
    
    // Login
    'login.welcome': 'Bienvenido',
    'login.desc': 'Ingresa tus credenciales registradas en la plataforma.',
    'login.email': 'Email Corporativo',
    'login.pass': 'Contraseña',
    'login.button': 'Entrar al Sistema',
    'login.verifying': 'Verificando...',
    'login.footer': 'El acceso a esta plataforma está restringido. Si no tienes cuenta, contacta a tu Administrador.',
    'login.error_auth': 'Error de usuario y contraseña. Si no estás registrado, por favor habla con un administrador.',
    'login.error_generic': 'Error de conexión con el servidor.',
    
    // Dashboard
    'dash.terminal': 'Terminal de Asistencia',
    'dash.ready': 'Sistema listo para registro',
    'dash.hello': 'Hola',
    'dash.miami_time': 'Miami',
    'dash.start_q': '¿Comenzar Jornada?',
    'dash.start_desc': 'Se registrará la fecha y hora exacta de Miami.',
    'dash.note_label': 'Nota / Comentario de Entrada',
    'dash.note_placeholder': '¿Alguna observación para hoy?',
    'dash.btn_start': 'Registrar Entrada',
    'dash.btn_locating': 'Obteniendo Ubicación...',
    'dash.in_progress': 'Turno en Progreso',
    'dash.start_time': 'Inicio',
    'dash.date': 'Fecha',
    'dash.note_out': 'Nota / Comentario de Salida',
    'dash.note_out_placeholder': '¿Cómo fue tu jornada hoy? (Opcional)',
    'dash.btn_end': 'Finalizar Turno',
    'dash.success_title': '¡Registro Esitoso!',
    'dash.success_desc': 'Tu marca de tiempo ha sido sincronizada.',
    'dash.btn_back': 'Volver al Inicio',
    
    // Reports
    'rep.analysis': 'ANÁLISIS OPERATIVO',
    'rep.title': 'Reportes de Actividad',
    'rep.desc': 'Historial centralizado con geolocalización.',
    'rep.export': 'Exportar CSV',
    'rep.refresh': 'Actualizar',
    'rep.filter_employee': 'BUSCAR EMPLEADO',
    'rep.filter_status': 'ESTADO',
    'rep.all': 'TODOS',
    'rep.active': 'EN CURSO',
    'rep.completed': 'FINALIZADOS',
    'rep.clear': 'LIMPIAR FILTROS',
    'rep.from': 'DESDE LA FECHA',
    'rep.to': 'HASTA LA FECHA',
    'rep.table_name': 'NOMBRE / ROL',
    'rep.table_start': 'INICIO',
    'rep.table_end': 'FIN',
    'rep.table_duration': 'DURACIÓN TOTAL',
    'rep.table_comment': 'COMENTARIOS',
    'rep.table_status': 'ESTADO',
    'rep.loading': 'CARGANDO DATOS...',
    'rep.no_results': 'No se encontraron registros.',
    
    // Reports Modal
    'rep.modal_title': 'DETALLE DEL REGISTRO',
    'rep.modal_block1': 'BLOQUE 1 - FECHA Y HORA DE INICIO',
    'rep.modal_block2': 'BLOQUE 2 - FECHA Y HORA FINAL',
    'rep.modal_date_start': 'FECHA DE INICIO',
    'rep.modal_time_start': 'HORA DE INICIO',
    'rep.modal_loc_start': 'UBICACIÓN DE ENTRADA (MAPA)',
    'rep.modal_iso_start': 'ISO TIMESTAMP DE INICIO',
    'rep.modal_comm_start': 'COMENTARIO DE INICIO',
    'rep.modal_date_end': 'FECHA DE FINALIZACIÓN',
    'rep.modal_time_end': 'HORA FINAL',
    'rep.modal_loc_end': 'UBICACIÓN DE SALIDA (MAPA)',
    'rep.modal_iso_end': 'ISO TIMESTAMP DE FINALIZACIÓN',
    'rep.modal_comm_end': 'COMENTARIO FINAL',
    'rep.modal_in_progress_msg': 'ESTE TURNO SE ENCUENTRA EN CURSO ACTUALMENTE',
    'rep.modal_close_btn': 'CERRAR REGISTRO DETALLADO',
    
    // Users
    'user.access_mgmt': 'Gestión de Acceso',
    'user.title': 'Usuarios del Sistema',
    'user.desc': 'Crea, edita y gestiona los roles de los empleados.',
    'user.refresh': 'Actualizar Lista',
    'user.new': 'Nuevo Usuario',
    'user.register_db': 'Registrar en base de datos',
    'user.name_label': 'Nombre Completo',
    'user.email_label': 'Email Corporativo',
    'user.pass_label': 'Contraseña',
    'user.role_label': 'Rol Asignado',
    'user.create_btn': 'Crear Usuario',
    'user.directory': 'Directorio de Empleados',
    'user.members': 'Miembros',
    'user.actions': 'Acciones',
    'user.edit_title': 'Editar Usuario',
    'user.edit_pass_hint': 'Nueva Contraseña (Opcional)',
    'user.edit_pass_placeholder': 'Dejar en blanco para mantener la actual',
    'user.discard': 'Descartar',
    'user.save': 'Guardar Cambios',
    'user.delete_q': '¿Eliminar Usuario?',
    'user.delete_desc': 'Estás a punto de borrar a este usuario. Esta acción no se puede deshacer.',
    'user.confirm_del': 'Confirmar Eliminación',
    'user.cancel': 'Cancelar',
    
    // Profile
    'prof.title': 'Mi Perfil',
    'prof.desc': 'Gestiona tu información personal.',
    'prof.id': 'Empleado ID',
    'prof.general_info': 'Información General',
    'prof.details': 'Detalles Personales',
    'prof.name': 'Nombre Completo',
    'prof.email': 'Correo Electrónico',
    'prof.phone': 'Teléfono',
    'prof.role': 'Rol de Usuario',
    'prof.timezone': 'Zona Horaria',
    'prof.timezone_desc': 'Esta zona horaria se utilizará para registrar tus turnos y reportes.',
    'prof.edit': 'Editar Perfil',
    'prof.save': 'Guardar Cambios',
    'prof.cancel': 'Cancelar'
  },
  en: {
    // Navbar
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Reports',
    'nav.my_reports': 'My Reports',
    'nav.users': 'Users',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    
    // Login
    'login.welcome': 'Welcome',
    'login.desc': 'Enter your registered credentials to access the platform.',
    'login.email': 'Corporate Email',
    'login.pass': 'Password',
    'login.button': 'Sign In',
    'login.verifying': 'Verifying...',
    'login.footer': 'Access to this platform is restricted. If you do not have an account, contact your Administrator.',
    'login.error_auth': 'Invalid username or password. If you are not registered, please speak with an administrator.',
    'login.error_generic': 'Server connection error.',
    
    // Dashboard
    'dash.terminal': 'Attendance Terminal',
    'dash.ready': 'System ready for check-in',
    'dash.hello': 'Hello',
    'dash.miami_time': 'Miami',
    'dash.start_q': 'Start Shift?',
    'dash.start_desc': 'Exact Miami date and time will be recorded.',
    'dash.note_label': 'Check-in Note / Comment',
    'dash.note_placeholder': 'Any observations for today?',
    'dash.btn_start': 'Check In',
    'dash.btn_locating': 'Locating...',
    'dash.in_progress': 'Shift in Progress',
    'dash.start_time': 'Start',
    'dash.date': 'Date',
    'dash.note_out': 'Check-out Note / Comment',
    'dash.note_out_placeholder': 'How was your day? (Optional)',
    'dash.btn_end': 'Check Out',
    'dash.success_title': 'Sync Successful!',
    'dash.success_desc': 'Your timestamp has been synced with the server.',
    'dash.btn_back': 'Back to Home',
    
    // Reports
    'rep.analysis': 'OPERATIVE ANALYSIS',
    'rep.title': 'Activity Reports',
    'rep.desc': 'Centralized history with geolocation.',
    'rep.export': 'Export CSV',
    'rep.refresh': 'Refresh',
    'rep.filter_employee': 'SEARCH EMPLOYEE',
    'rep.filter_status': 'STATUS',
    'rep.all': 'ALL',
    'rep.active': 'IN PROGRESS',
    'rep.completed': 'COMPLETED',
    'rep.clear': 'CLEAR FILTERS',
    'rep.from': 'FROM DATE',
    'rep.to': 'TO DATE',
    'rep.table_name': 'NAME / ROLE',
    'rep.table_start': 'START',
    'rep.table_end': 'END',
    'rep.table_duration': 'TOTAL DURATION',
    'rep.table_comment': 'COMMENTS',
    'rep.table_status': 'STATUS',
    'rep.loading': 'LOADING DATA...',
    'rep.no_results': 'No matching records found.',
    
    // Reports Modal
    'rep.modal_title': 'SHIFT DETAILED VIEW',
    'rep.modal_block1': 'BLOCK 1 - START DATE & TIME',
    'rep.modal_block2': 'BLOCK 2 - END DATE & TIME',
    'rep.modal_date_start': 'START DATE',
    'rep.modal_time_start': 'START TIME',
    'rep.modal_loc_start': 'CHECK-IN LOCATION (MAP)',
    'rep.modal_iso_start': 'START ISO TIMESTAMP',
    'rep.modal_comm_start': 'CHECK-IN COMMENT',
    'rep.modal_date_end': 'END DATE',
    'rep.modal_time_end': 'END TIME',
    'rep.modal_loc_end': 'CHECK-OUT LOCATION (MAP)',
    'rep.modal_iso_end': 'END ISO TIMESTAMP',
    'rep.modal_comm_end': 'CHECK-OUT COMMENT',
    'rep.modal_in_progress_msg': 'THIS SHIFT IS CURRENTLY IN PROGRESS',
    'rep.modal_close_btn': 'CLOSE DETAILED VIEW',
    
    // Users
    'user.access_mgmt': 'Access Management',
    'user.title': 'System Users',
    'user.desc': 'Create, edit, and manage employee roles.',
    'user.refresh': 'Refresh List',
    'user.new': 'New User',
    'user.register_db': 'Register in Database',
    'user.name_label': 'Full Name',
    'user.email_label': 'Corporate Email',
    'user.pass_label': 'Password',
    'user.role_label': 'Assigned Role',
    'user.create_btn': 'Create User',
    'user.directory': 'Employee Directory',
    'user.members': 'Members',
    'user.actions': 'Actions',
    'user.edit_title': 'Edit User',
    'user.edit_pass_hint': 'New Password (Optional)',
    'user.edit_pass_placeholder': 'Leave blank to keep current',
    'user.discard': 'Discard',
    'user.save': 'Save Changes',
    'user.delete_q': 'Delete User?',
    'user.delete_desc': 'You are about to delete this user. This action cannot be undone.',
    'user.confirm_del': 'Confirm Deletion',
    'user.cancel': 'Cancel',
    
    // Profile
    'prof.title': 'My Profile',
    'prof.desc': 'Manage your personal information.',
    'prof.id': 'Employee ID',
    'prof.general_info': 'General Information',
    'prof.details': 'Personal Details',
    'prof.name': 'Full Name',
    'prof.email': 'Email Address',
    'prof.phone': 'Phone',
    'prof.role': 'User Role',
    'prof.timezone': 'Timezone',
    'prof.timezone_desc': 'This timezone will be used to record your shifts and reports.',
    'prof.edit': 'Edit Profile',
    'prof.save': 'Save Changes',
    'prof.cancel': 'Cancel'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('shifttrack_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('shifttrack_lang', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
