/** Menús / módulos del portal (mock alineado a proposal/menu-data.js). */

export type UserSessionKind = 'EXTERNO' | 'INTERNO' | 'NO_HABITUAL';

export interface MenuOption {
  opcionId: string;
  descripcion: string;
  url: string;
  icon?: string;
  moduleId?: string;
}

export interface MenuItem {
  menuId: string;
  titulo: string;
  url: string;
  icon?: string;
  opciones: MenuOption[];
}

export interface PortalModule {
  id: string;
  grupo: string;
  titulo: string;
  desc: string;
  code: string;
  badge: string;
  ruta: string;
  favDefault?: boolean;
}

export interface GroupMeta {
  id: string;
  label: string;
  hint: string;
}

export const GROUP_ORDER: GroupMeta[] = [
  { id: 'operaciones', label: 'Operaciones de comercio', hint: 'Ingreso, salida, declaraciones y aforo' },
  { id: 'padron', label: 'Padrón OCE', hint: 'Datos y habilitación del operador' },
  { id: 'servicios', label: 'Pagos y servicios', hint: 'Obligaciones, firma y notificaciones' },
  { id: 'consultas', label: 'Consultas y soporte', hint: 'Seguimiento y ayuda operativa' },
  { id: 'interno', label: 'Gestión interna AN', hint: 'Bandejas y herramientas del funcionario' },
];

/** Menú lateral — operador habitual externo (OCE) */
export const MENU_EXTERNO: MenuItem[] = [
  { menuId: '10', titulo: 'Inicio', url: '/portal', icon: 'home', opciones: [] },
  {
    menuId: '20',
    titulo: 'GESTION OCE',
    url: '#',
    icon: 'oce',
    opciones: [
      { opcionId: '21', descripcion: 'Actualizar datos del operador', url: '#padron-act', moduleId: 'oce' },
      { opcionId: '22', descripcion: 'Consulta estado operador', url: '#padron-est', moduleId: 'estado-operador' },
      { opcionId: '23', descripcion: 'Estado de trámite de registro', url: '#padron-tr', moduleId: 'tramites' },
    ],
  },
  {
    menuId: '30',
    titulo: 'Operaciones',
    url: '#',
    icon: 'ops',
    opciones: [
      { opcionId: '31', descripcion: 'Ingreso de Mercancías', url: '#ingreso', moduleId: 'ingreso' },
      { opcionId: '32', descripcion: 'Salida de Mercancías', url: '#salida', moduleId: 'salida' },
      { opcionId: '33', descripcion: 'Declaraciones DAM / DIM', url: '#dam', moduleId: 'declaraciones' },
      { opcionId: '34', descripcion: 'Aforo', url: '#aforo', moduleId: 'aforo' },
      { opcionId: '35', descripcion: 'Tránsito', url: '#transito', moduleId: 'ingreso' },
      { opcionId: '36', descripcion: 'Depósito', url: '#deposito', moduleId: 'aforo' },
    ],
  },
  {
    menuId: '40',
    titulo: 'Pagos y servicios',
    url: '#',
    icon: 'pagos',
    opciones: [
      { opcionId: '41', descripcion: 'Pagos aduaneros', url: '#pagos', moduleId: 'pagos' },
      { opcionId: '42', descripcion: 'Pagos Diferidos', url: '#pagos-dif', moduleId: 'pagos' },
      { opcionId: '43', descripcion: 'Comprobantes / QR', url: '#pagos-qr', moduleId: 'pagos' },
    ],
  },
  {
    menuId: '50',
    titulo: 'Notificaciones',
    url: '#notif',
    icon: 'notif',
    opciones: [
      { opcionId: '51', descripcion: 'Bandeja de notificaciones', url: '#notif-bandeja', moduleId: 'notificacion' },
      { opcionId: '52', descripcion: 'Registro notificación electrónica', url: '#notif-reg', moduleId: 'notificacion' },
    ],
  },
  {
    menuId: '70',
    titulo: 'Herramientas',
    url: '#',
    icon: 'tools',
    opciones: [
      { opcionId: '71', descripcion: 'Firma Digital', url: '#firma', moduleId: 'firma' },
      { opcionId: '72', descripcion: 'Verificar documento firmado', url: '#firma-ver', moduleId: 'firma' },
    ],
  },
  {
    menuId: '80',
    titulo: 'Consultas',
    url: '#',
    icon: 'consultas',
    opciones: [
      { opcionId: '81', descripcion: 'Consulta DAM', url: '#consulta-dam', moduleId: 'consulta-dam' },
      { opcionId: '82', descripcion: 'Instructivos de llenado', url: '#instructivos', moduleId: 'instructivos' },
    ],
  },
];

/** Menú lateral — usuario interno AN */
export const MENU_INTERNO: MenuItem[] = [
  { menuId: '10', titulo: 'Inicio', url: '/portal', icon: 'home', opciones: [] },
  {
    menuId: '20',
    titulo: 'Bandejas',
    url: '#',
    icon: 'ops',
    opciones: [
      { opcionId: '21', descripcion: 'Bandeja de aforo', url: '#aforo', moduleId: 'aforo' },
      { opcionId: '22', descripcion: 'Bandeja de trámites', url: '#tramites', moduleId: 'tramites' },
      { opcionId: '23', descripcion: 'Notificaciones internas', url: '#notif', moduleId: 'notificacion' },
    ],
  },
  {
    menuId: '30',
    titulo: 'Operaciones',
    url: '#',
    icon: 'ops',
    opciones: [
      { opcionId: '31', descripcion: 'Ingreso de Mercancías', url: '#ingreso', moduleId: 'ingreso' },
      { opcionId: '32', descripcion: 'Salida de Mercancías', url: '#salida', moduleId: 'salida' },
      { opcionId: '33', descripcion: 'Declaraciones DAM / DIM', url: '#dam', moduleId: 'declaraciones' },
      { opcionId: '34', descripcion: 'Tránsito / depósito', url: '#transito', moduleId: 'ingreso' },
    ],
  },
  {
    menuId: '40',
    titulo: 'Padrón y OCE',
    url: '#',
    icon: 'oce',
    opciones: [
      { opcionId: '41', descripcion: 'Consulta estado operador', url: '#padron-est', moduleId: 'estado-operador' },
      { opcionId: '42', descripcion: 'Gestión padrón', url: '#padron', moduleId: 'oce' },
    ],
  },
  {
    menuId: '50',
    titulo: 'Consultas',
    url: '#',
    icon: 'consultas',
    opciones: [
      { opcionId: '51', descripcion: 'Consulta DAM', url: '#consulta-dam', moduleId: 'consulta-dam' },
      { opcionId: '52', descripcion: 'Estado de trámite', url: '#tramite', moduleId: 'tramites' },
      { opcionId: '53', descripcion: 'Instructivos', url: '#instructivos', moduleId: 'instructivos' },
    ],
  },
  {
    menuId: '60',
    titulo: 'Soporte AN',
    url: '#',
    icon: 'tools',
    opciones: [
      { opcionId: '61', descripcion: 'SOPORTE', url: '#soporte', moduleId: 'instructivos' },
      { opcionId: '62', descripcion: 'GESTION ADUANA', url: '#gestion', moduleId: 'tramites' },
    ],
  },
];

export const MODULES_EXTERNO: PortalModule[] = [
  { id: 'ingreso', grupo: 'operaciones', titulo: 'Ingreso de Mercancías', desc: 'Documentos de embarque, manifiestos y control de ingreso.', code: 'ING', badge: 'Operativo', ruta: '/ingreso', favDefault: true },
  { id: 'salida', grupo: 'operaciones', titulo: 'Salida de Mercancías', desc: 'DAM de exportación, reexportación y operaciones de salida.', code: 'SAL', badge: 'Operativo', ruta: '/salida', favDefault: true },
  { id: 'declaraciones', grupo: 'operaciones', titulo: 'Declaraciones DAM / DIM', desc: 'Registro y gestión de declaraciones de mercancías.', code: 'DAM', badge: 'Operativo', ruta: '/declaraciones' },
  { id: 'aforo', grupo: 'operaciones', titulo: 'Aforo', desc: 'Bandejas y gestión de aforo según perfil habilitado.', code: 'AFO', badge: 'Perfil', ruta: '/aforo' },
  { id: 'oce', grupo: 'padron', titulo: 'GESTION OCE', desc: 'Actualización de datos del OCE ante la Aduana Nacional.', code: 'OCE', badge: 'Obligatorio', ruta: '/oce', favDefault: true },
  { id: 'estado-operador', grupo: 'padron', titulo: 'Estado del operador', desc: 'Consulta de habilitación y situación en el padrón OCE.', code: 'EST', badge: 'Consulta', ruta: '/oce/estado' },
  { id: 'pagos', grupo: 'servicios', titulo: 'Pagos aduaneros', desc: 'Liquidaciones, obligaciones y pagos diferidos SUMA.', code: 'PAG', badge: 'Operativo', ruta: '/pagos', favDefault: true },
  { id: 'notificacion', grupo: 'servicios', titulo: 'Notificaciones', desc: 'Bandeja electrónica y acuses de notificación de la AN.', code: 'NOT', badge: '3 nuevas', ruta: '/notificacion', favDefault: true },
  { id: 'firma', grupo: 'servicios', titulo: 'Firma Digital', desc: 'Firmado y verificación de documentos en el ecosistema SUMA.', code: 'FIR', badge: 'Herramienta', ruta: '/firma' },
  { id: 'consulta-dam', grupo: 'consultas', titulo: 'Consulta DAM', desc: 'Estado y detalle de declaraciones de mercancías.', code: 'CDA', badge: 'Consulta', ruta: '/consultas/dam' },
  { id: 'tramites', grupo: 'consultas', titulo: 'Estado de trámite', desc: 'Seguimiento de registros y gestiones ante Aduana Nacional.', code: 'TRM', badge: 'Consulta', ruta: '/consultas/tramite' },
  { id: 'instructivos', grupo: 'consultas', titulo: 'Instructivos', desc: 'Guías de llenado DAM, DIM, Carta Porte, manifiestos y formularios.', code: 'INS', badge: 'Ayuda', ruta: '/ayuda/instructivos' },
];

export const MODULES_INTERNO: PortalModule[] = [
  { id: 'aforo', grupo: 'interno', titulo: 'Bandeja de aforo', desc: 'Asignación y resolución de aforos según administración.', code: 'AFO', badge: 'Interno', ruta: '/aforo', favDefault: true },
  { id: 'tramites', grupo: 'interno', titulo: 'Bandeja de trámites', desc: 'Trámites pendientes del funcionario AN.', code: 'TRM', badge: 'Interno', ruta: '/tramites', favDefault: true },
  { id: 'notificacion', grupo: 'interno', titulo: 'Notificaciones internas', desc: 'Avisos y comunicaciones del ecosistema SUMA.', code: 'NOT', badge: '2 nuevas', ruta: '/notificacion', favDefault: true },
  { id: 'ingreso', grupo: 'operaciones', titulo: 'Ingreso de Mercancías', desc: 'Control operativo de ingreso.', code: 'ING', badge: 'Operativo', ruta: '/ingreso' },
  { id: 'salida', grupo: 'operaciones', titulo: 'Salida de Mercancías', desc: 'Control operativo de salida.', code: 'SAL', badge: 'Operativo', ruta: '/salida' },
  { id: 'declaraciones', grupo: 'operaciones', titulo: 'Declaraciones DAM / DIM', desc: 'Consulta y gestión de declaraciones.', code: 'DAM', badge: 'Operativo', ruta: '/declaraciones', favDefault: true },
  { id: 'oce', grupo: 'padron', titulo: 'Gestión padrón OCE', desc: 'Consulta y actualización asistida del padrón.', code: 'OCE', badge: 'AN', ruta: '/oce' },
  { id: 'estado-operador', grupo: 'padron', titulo: 'Estado del operador', desc: 'Habilitación y situación del OCE.', code: 'EST', badge: 'Consulta', ruta: '/oce/estado' },
  { id: 'consulta-dam', grupo: 'consultas', titulo: 'Consulta DAM', desc: 'Búsqueda y detalle de DAM.', code: 'CDA', badge: 'Consulta', ruta: '/consultas/dam' },
  { id: 'instructivos', grupo: 'consultas', titulo: 'Instructivos', desc: 'Material de apoyo operativo.', code: 'INS', badge: 'Ayuda', ruta: '/ayuda/instructivos' },
];

export function menuFor(tipo: UserSessionKind): MenuItem[] {
  return tipo === 'INTERNO' ? MENU_INTERNO : MENU_EXTERNO;
}

export function modulesFor(tipo: UserSessionKind): PortalModule[] {
  return tipo === 'INTERNO' ? MODULES_INTERNO : MODULES_EXTERNO;
}

export function perfilLabel(tipo: UserSessionKind): string {
  if (tipo === 'INTERNO') return 'Funcionario AN (interno)';
  if (tipo === 'NO_HABITUAL') return 'Operaciones no habituales';
  return 'Importador / Exportador habitual (OCE)';
}
