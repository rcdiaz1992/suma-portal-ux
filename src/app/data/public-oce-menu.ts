/**
 * Árbol público indexOce → 4 cubos (Registro / Ops NH / Consultas / Utilitarios).
 * 2 niveles → lateral al entrar en la sección.
 * 3 niveles → lateral solo en el 3.er nivel (hijos hoja).
 */

export type PublicAction =
  | { kind: 'route'; path: string; query?: Record<string, string> }
  | { kind: 'panel'; panel: string }
  | { kind: 'download'; path: string }
  | { kind: 'external'; url: string }
  | { kind: 'ssoNotificacion' };

export interface PublicMenuNode {
  id: string;
  titulo: string;
  descripcion: string;
  opciones: PublicMenuNode[];
  action?: PublicAction;
}

const DOC = 'Documento + tipo · ingreso SSO';

export const PUBLIC_OCE_MENU: PublicMenuNode[] = [
  {
    id: 'registro',
    titulo: 'Registro nuevos operadores',
    descripcion: 'Alta de operadores en el padrón SUMA',
    opciones: [
      {
        id: 'reg-habituales',
        titulo: 'Importadores / Exportadores Habituales',
        descripcion: 'Login canal OPE2 · usuario y clave',
        opciones: [],
        action: { kind: 'route', path: '/login', query: { canal: 'OPE2' } },
      },
      {
        id: 'reg-nh',
        titulo: 'Importadores / Exportadores No Habituales',
        descripcion: 'Sin usuario · captcha e ingreso',
        opciones: [],
        action: { kind: 'route', path: '/login/no-habituales' },
      },
      {
        id: 'reg-otros',
        titulo: 'Otros Operadores de Comercio',
        descripcion: 'Login canal OPE3',
        opciones: [],
        action: { kind: 'route', path: '/login', query: { canal: 'OPE3' } },
      },
      {
        id: 'reg-orf',
        titulo: 'Usuario Organizador Ferial',
        descripcion: 'Login canal ORF (OPE8)',
        opciones: [],
        action: { kind: 'route', path: '/login', query: { canal: 'OPE8' } },
      },
      {
        id: 'reg-charter',
        titulo: 'Registro de Empresas Charter',
        descripcion: 'Captcha e ingreso Charter',
        opciones: [],
        action: { kind: 'route', path: '/login/charter' },
      },
    ],
  },
  {
    id: 'ops',
    titulo: 'Operaciones no habituales',
    descripcion: 'Importación y exportación simplificada',
    opciones: [
      {
        id: 'ops-imp',
        titulo: 'Importación',
        descripcion: 'DIMS, OCA, impresión, notificación y más',
        opciones: [
          {
            id: 'imp-dims',
            titulo: 'Importadores No Habituales',
            descripcion: 'DIMS · menor cuantía / equipaje',
            opciones: [],
            action: { kind: 'panel', panel: 'imp-dims' },
          },
          {
            id: 'imp-oca',
            titulo: 'Empresas de transporte extranjeras con permiso ocasional',
            descripcion: 'Manifiestos y documentos de embarque',
            opciones: [],
            action: { kind: 'panel', panel: 'imp-oca' },
          },
          {
            id: 'imp-print',
            titulo: 'Imprimir documento',
            descripcion: 'DEX / CRT / MIC',
            opciones: [],
            action: { kind: 'panel', panel: 'imp-print' },
          },
          {
            id: 'imp-notif',
            titulo: 'Registro de Personas Naturales para Notificación Electrónica',
            descripcion: 'Alta para notificaciones',
            opciones: [],
            action: { kind: 'ssoNotificacion' },
          },
          {
            id: 'imp-mmc',
            titulo: 'Registro Agencia Marítima',
            descripcion: DOC,
            opciones: [],
            action: { kind: 'panel', panel: 'imp-mmc' },
          },
          {
            id: 'imp-air',
            titulo: 'Empresas de transporte extranjeras con permiso ocasional Aéreas',
            descripcion: 'Manifiestos y embarque aéreos',
            opciones: [],
            action: { kind: 'panel', panel: 'imp-air' },
          },
          {
            id: 'imp-valija',
            titulo: 'Valija diplomática',
            descripcion: 'Retiro de valija diplomática',
            opciones: [],
            action: { kind: 'panel', panel: 'imp-valija' },
          },
          {
            id: 'imp-socorro',
            titulo: 'Envíos de socorro',
            descripcion: 'Captcha e ingreso',
            opciones: [],
            action: { kind: 'panel', panel: 'imp-socorro' },
          },
        ],
      },
      {
        id: 'ops-exp',
        titulo: 'Exportación',
        descripcion: 'Exportación simplificada y operaciones afines',
        opciones: [
          {
            id: 'exp-nh',
            titulo: 'Exportadores No Habituales',
            descripcion: 'Declaración de exportación simplificada',
            opciones: [],
            action: { kind: 'panel', panel: 'exp-nh' },
          },
          {
            id: 'exp-oca',
            titulo: 'Empresas de transporte extranjeras con permiso ocasional',
            descripcion: 'Manifiestos y documentos de embarque',
            opciones: [],
            action: { kind: 'panel', panel: 'exp-oca' },
          },
          {
            id: 'exp-print',
            titulo: 'Imprimir documento',
            descripcion: 'DEX / CRT / MIC',
            opciones: [],
            action: { kind: 'panel', panel: 'exp-print' },
          },
          {
            id: 'exp-notif',
            titulo: 'Registro de Personas Naturales para Notificación Electrónica',
            descripcion: 'Alta para notificaciones',
            opciones: [],
            action: { kind: 'ssoNotificacion' },
          },
          {
            id: 'exp-mmc',
            titulo: 'Registro Agencia Marítima',
            descripcion: DOC,
            opciones: [],
            action: { kind: 'panel', panel: 'exp-mmc' },
          },
          {
            id: 'exp-air',
            titulo: 'Empresas de transporte extranjeras con permiso ocasional Aéreas',
            descripcion: 'Manifiestos y embarque aéreos',
            opciones: [],
            action: { kind: 'panel', panel: 'exp-air' },
          },
          {
            id: 'exp-valija',
            titulo: 'Valija diplomática',
            descripcion: 'Retiro de valija diplomática',
            opciones: [],
            action: { kind: 'panel', panel: 'exp-valija' },
          },
          {
            id: 'exp-socorro',
            titulo: 'Envíos de socorro',
            descripcion: 'Captcha e ingreso',
            opciones: [],
            action: { kind: 'panel', panel: 'exp-socorro' },
          },
        ],
      },
    ],
  },
  {
    id: 'consultas',
    titulo: 'Consultas públicas',
    descripcion: 'OCE, importación y manifiestos autorizados',
    opciones: [
      {
        id: 'con-oce',
        titulo: 'OCE',
        descripcion: 'Estado, datos y trámites de operadores',
        opciones: [
          {
            id: 'oce-estado',
            titulo: 'Consulta Estado del Operador',
            descripcion: 'Suspensión / estado por documento',
            opciones: [],
            action: { kind: 'panel', panel: 'oce-estado' },
          },
          {
            id: 'oce-datos',
            titulo: 'Datos del Operador de Comercio',
            descripcion: 'Reporte datos generales',
            opciones: [],
            action: { kind: 'panel', panel: 'oce-datos' },
          },
          {
            id: 'oce-medios',
            titulo: 'Datos Medios de Transporte',
            descripcion: 'Consulta por placa',
            opciones: [],
            action: { kind: 'panel', panel: 'oce-medios' },
          },
          {
            id: 'oce-agencias',
            titulo: 'Lista Agencias Despachantes',
            descripcion: 'Reporte con captcha',
            opciones: [],
            action: { kind: 'panel', panel: 'oce-agencias' },
          },
          {
            id: 'oce-tramite',
            titulo: 'Consulte el estado de su trámite de Registro',
            descripcion: 'Seguimiento de trámite',
            opciones: [],
            action: { kind: 'panel', panel: 'oce-tramite' },
          },
        ],
      },
      {
        id: 'con-imp',
        titulo: 'Importación',
        descripcion: 'DAM, DIM y PRM',
        opciones: [
          {
            id: 'imp-dam',
            titulo: 'Consulta DAM',
            descripcion: 'Declaración de mercancías',
            opciones: [],
            action: { kind: 'panel', panel: 'con-dam' },
          },
          {
            id: 'imp-dim',
            titulo: 'Consulta DIM',
            descripcion: 'Declaración simplificada',
            opciones: [],
            action: { kind: 'panel', panel: 'con-dim' },
          },
          {
            id: 'imp-prm',
            titulo: 'Consulta PRM',
            descripcion: 'Ingreso a módulo depósito',
            opciones: [],
            action: { kind: 'panel', panel: 'con-prm' },
          },
        ],
      },
      {
        id: 'con-man',
        titulo: 'Manifiestos autorizados',
        descripcion: 'Consulta MIC',
        opciones: [
          {
            id: 'man-mic',
            titulo: 'Consulta MIC',
            descripcion: 'Manifiesto internacional de carga',
            opciones: [],
            action: { kind: 'panel', panel: 'con-mic' },
          },
        ],
      },
    ],
  },
  {
    id: 'utilitarios',
    titulo: 'Utilitarios',
    descripcion: 'Descargas offline y videos demostrativos',
    opciones: [
      {
        id: 'ut-dam',
        titulo: 'Descargar DAM offline',
        descripcion: 'Archivo Zip · Excel v.2.11',
        opciones: [],
        action: { kind: 'download', path: '/ingreso/offline/DAM-offline_v2.11_27102026.zip' },
      },
      {
        id: 'ut-dex',
        titulo: 'Descargar DEX offline',
        descripcion: 'Archivo Zip · Excel v.1.0',
        opciones: [],
        action: {
          kind: 'download',
          path: '/salida/offline/20180808_ANB_DEX-offline_v1-0.zip',
        },
      },
      {
        id: 'ut-dim',
        titulo: 'Descargar DIM offline',
        descripcion: 'Archivo Zip · Excel v.1.11',
        opciones: [],
        action: { kind: 'download', path: '/ingreso/offline/DIM-offline_v1.11_28102026.zip' },
      },
      {
        id: 'ut-guia-aerea',
        titulo: 'Descargar GUÍA AÉREA offline',
        descripcion: 'Archivo Zip',
        opciones: [],
        action: { kind: 'download', path: '/ingreso/offline/V1_0_guiaCorta.zip' },
      },
      {
        id: 'ut-guia-courier',
        titulo: 'Descargar GUÍA COURIER offline',
        descripcion: 'Archivo Zip',
        opciones: [],
        action: { kind: 'download', path: '/ingreso/offline/guiaInicialCourrier.zip' },
      },
      {
        id: 'ut-videos',
        titulo: 'Videos demostrativos',
        descripcion: 'Ingreso de mercancías · InfoSUMA',
        opciones: [],
        action: {
          kind: 'external',
          url: 'http://www.aduana.gob.bo/infosuma/videos.php?filtro=3-Ingreso de mercancías',
        },
      },
    ],
  },
];

export function findPublicNode(
  id: string,
  nodes: PublicMenuNode[] = PUBLIC_OCE_MENU
): PublicMenuNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findPublicNode(id, n.opciones || []);
    if (hit) return hit;
  }
  return null;
}
