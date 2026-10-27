/**
 * IA operativa SUMA / Aduana Nacional Bolivia (propuesta).
 *
 * Lateral = menú parametrizado (equivalente MenuService / IFindMenuDto).
 * Home   = lanzador de módulos operativos (atajos), no duplica el árbol.
 *
 * Orden de grupos: ciclo operativo aduanero
 *   1) Operaciones (ingreso/salida/declaraciones/aforo)
 *   2) Padrón OCE
 *   3) Obligaciones y servicios (pagos, firma, notificaciones)
 *   4) Consultas y soporte
 */
window.SUMA_IA = {
  sistema: "SUMA_PORTAL",
  perfilDemo: "Importador / Exportador habitual",
  soporte: {
    linea: "800-10-5001",
    whatsapp: "715-51800",
    correo: "soportesuma@aduana.gob.bo",
  },
};

/** Menú lateral — fuente de verdad (mock alineado a operación SUMA) */
window.SUMA_MENU = [
  {
    menuId: "10",
    titulo: "Inicio",
    url: "portal.html",
    icon: "IN",
    orden: "10",
    opciones: [],
  },
  {
    menuId: "20",
    titulo: "Operaciones",
    url: "#",
    icon: "OP",
    orden: "20",
    opciones: [
      { opcionId: "21", descripcion: "Ingreso / Manifiestos", url: "#ingreso", icon: "IG", orden: "21" },
      { opcionId: "22", descripcion: "Salida / Exportación", url: "#salida", icon: "SL", orden: "22" },
      { opcionId: "23", descripcion: "Declaraciones DAM / DIM", url: "#dam", icon: "DM", orden: "23" },
      { opcionId: "24", descripcion: "Aforo", url: "#aforo", icon: "AF", orden: "24" },
      { opcionId: "25", descripcion: "Declaración simplificada", url: "#dims", icon: "DS", orden: "25" },
    ],
  },
  {
    menuId: "30",
    titulo: "Padrón OCE",
    url: "#",
    icon: "OC",
    orden: "30",
    opciones: [
      { opcionId: "31", descripcion: "Actualizar datos del operador", url: "#padron-act", icon: "AC", orden: "31" },
      { opcionId: "32", descripcion: "Consulta estado operador", url: "#padron-est", icon: "ES", orden: "32" },
      { opcionId: "33", descripcion: "Estado de trámite de registro", url: "#padron-tr", icon: "TR", orden: "33" },
    ],
  },
  {
    menuId: "40",
    titulo: "Pagos y obligaciones",
    url: "#",
    icon: "PG",
    orden: "40",
    opciones: [
      { opcionId: "41", descripcion: "Pagos aduaneros", url: "#pagos", icon: "PA", orden: "41" },
      { opcionId: "42", descripcion: "Comprobantes / QR", url: "#pagos-qr", icon: "QR", orden: "42" },
    ],
  },
  {
    menuId: "50",
    titulo: "Notificaciones",
    url: "#notif",
    icon: "NO",
    orden: "50",
    opciones: [
      { opcionId: "51", descripcion: "Bandeja de notificaciones", url: "#notif-bandeja", icon: "BJ", orden: "51" },
      { opcionId: "52", descripcion: "Registro notificación electrónica", url: "#notif-reg", icon: "RE", orden: "52" },
    ],
  },
  {
    menuId: "60",
    titulo: "Consultas",
    url: "#",
    icon: "CO",
    orden: "60",
    opciones: [
      { opcionId: "61", descripcion: "Consulta DAM", url: "#consulta-dam", icon: "DA", orden: "61" },
      { opcionId: "62", descripcion: "Estado de trámite", url: "#consulta-tr", icon: "ET", orden: "62" },
      { opcionId: "63", descripcion: "Instructivos de llenado", url: "#instructivos", icon: "IN", orden: "63" },
    ],
  },
  {
    menuId: "70",
    titulo: "Herramientas",
    url: "#",
    icon: "HZ",
    orden: "70",
    opciones: [
      { opcionId: "71", descripcion: "Firma digital", url: "#firma", icon: "FD", orden: "71" },
      { opcionId: "72", descripcion: "Verificar documento firmado", url: "#firma-ver", icon: "VF", orden: "72" },
    ],
  },
];

/**
 * Grupos del home (lanzador) — ciclo operativo, no organigrama.
 * Coincide con filtros del segmented control.
 */
window.SUMA_GROUP_ORDER = [
  { id: "operaciones", label: "Operaciones de comercio", orden: 1, hint: "Ingreso, salida, declaraciones y aforo" },
  { id: "padron", label: "Padrón OCE", orden: 2, hint: "Datos y habilitación del operador" },
  { id: "servicios", label: "Pagos y servicios", orden: 3, hint: "Obligaciones, firma y notificaciones" },
  { id: "consultas", label: "Consultas y soporte", orden: 4, hint: "Seguimiento y ayuda operativa" },
];

/** Módulos del home (atajos a microfrontends / rutas SUMA) */
window.SUMA_MODULES = [
  {
    id: "ingreso",
    grupo: "operaciones",
    titulo: "Ingreso",
    desc: "Documentos de embarque, manifiestos y control de ingreso de mercancías.",
    code: "ING",
    badge: "Operativo",
    ruta: "/ingreso",
    favDefault: true,
  },
  {
    id: "salida",
    grupo: "operaciones",
    titulo: "Salida / Exportación",
    desc: "DAM de exportación, reexportación y operaciones de salida.",
    code: "SAL",
    badge: "Operativo",
    ruta: "/salida",
    favDefault: true,
  },
  {
    id: "declaraciones",
    grupo: "operaciones",
    titulo: "Declaraciones DAM / DIM",
    desc: "Registro y gestión de declaraciones de mercancías.",
    code: "DAM",
    badge: "Operativo",
    ruta: "/declaraciones",
    favDefault: false,
  },
  {
    id: "aforo",
    grupo: "operaciones",
    titulo: "Aforo",
    desc: "Bandejas y gestión de aforo según perfil habilitado.",
    code: "AFO",
    badge: "Perfil",
    ruta: "/aforo",
    favDefault: false,
  },
  {
    id: "simplificada",
    grupo: "operaciones",
    titulo: "Declaración simplificada",
    desc: "DIMS / exportación de menor cuantía (no habituales y casos habilitados).",
    code: "DIMS",
    badge: "Simplificado",
    ruta: "/simplificada",
    favDefault: false,
  },
  {
    id: "oce",
    grupo: "padron",
    titulo: "Padrón de Operadores",
    desc: "Actualización de datos del OCE ante la Aduana Nacional.",
    code: "OCE",
    badge: "Obligatorio",
    ruta: "/oce",
    favDefault: true,
  },
  {
    id: "estado-operador",
    grupo: "padron",
    titulo: "Estado del operador",
    desc: "Consulta de habilitación y situación en el padrón OCE.",
    code: "EST",
    badge: "Consulta",
    ruta: "/oce/estado",
    favDefault: false,
  },
  {
    id: "pagos",
    grupo: "servicios",
    titulo: "Pagos aduaneros",
    desc: "Liquidaciones, obligaciones y seguimiento de pagos SUMA.",
    code: "PAG",
    badge: "Operativo",
    ruta: "/pagos",
    favDefault: true,
  },
  {
    id: "notificacion",
    grupo: "servicios",
    titulo: "Notificaciones",
    desc: "Bandeja electrónica y acuses de notificación de la AN.",
    code: "NOT",
    badge: "3 nuevas",
    ruta: "/notificacion",
    favDefault: true,
  },
  {
    id: "firma",
    grupo: "servicios",
    titulo: "Firma digital",
    desc: "Firmado y verificación de documentos en el ecosistema SUMA.",
    code: "FIR",
    badge: "Herramienta",
    ruta: "/firma",
    favDefault: false,
  },
  {
    id: "consulta-dam",
    grupo: "consultas",
    titulo: "Consulta DAM",
    desc: "Estado y detalle de declaraciones de mercancías.",
    code: "CDA",
    badge: "Consulta",
    ruta: "/consultas/dam",
    favDefault: false,
  },
  {
    id: "tramites",
    grupo: "consultas",
    titulo: "Estado de trámite",
    desc: "Seguimiento de registros y gestiones ante Aduana Nacional.",
    code: "TRM",
    badge: "Consulta",
    ruta: "/consultas/tramite",
    favDefault: false,
  },
  {
    id: "instructivos",
    grupo: "consultas",
    titulo: "Instructivos",
    desc: "Guías de llenado DAM, DIM, Carta Porte, manifiestos y formularios.",
    code: "INS",
    badge: "Ayuda",
    ruta: "/ayuda/instructivos",
    favDefault: false,
  },
];
