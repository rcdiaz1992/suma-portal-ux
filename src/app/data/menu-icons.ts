/** Iconos Tabler grandes según el trabajo del menú (no abreviaturas). */

const RULES: Array<{ re: RegExp; icon: string }> = [
  { re: /notif|mensaje|correo|mail|bandeja/i, icon: 'ti ti-mail-filled' },
  { re: /whatsapp|chat|comunic/i, icon: 'ti ti-message-circle-2-filled' },
  { re: /ingreso|import|manif|embarque/i, icon: 'ti ti-package-import' },
  { re: /salida|export|reexport/i, icon: 'ti ti-package-export' },
  { re: /tr[aá]nsito|ruta|viaje/i, icon: 'ti ti-road' },
  { re: /dep[oó]sito|almac[eé]n|bodega/i, icon: 'ti ti-building-warehouse' },
  { re: /aforo|valoraci[oó]n|tasaci[oó]n/i, icon: 'ti ti-scale' },
  { re: /declaraci[oó]n|\bdam\b|\bdim\b|ddjj/i, icon: 'ti ti-file-description' },
  { re: /pago|liquid|tribut|obligaci/i, icon: 'ti ti-cash' },
  { re: /factura|qr|comprobante/i, icon: 'ti ti-receipt' },
  { re: /firma|certific|pki|digital/i, icon: 'ti ti-certificate' },
  { re: /oce|padr[oó]n|operador|registro/i, icon: 'ti ti-id-badge-2' },
  { re: /consulta|buscar|seguimiento|estado/i, icon: 'ti ti-search' },
  { re: /instructiv|ayuda|manual|gu[ií]a/i, icon: 'ti ti-book-2' },
  { re: /soporte|ticket|mesa/i, icon: 'ti ti-headset' },
  { re: /usuario|perfil|cuenta/i, icon: 'ti ti-user-filled' },
  { re: /admin|gesti[oó]n|config|herramient/i, icon: 'ti ti-settings-filled' },
  { re: /operaci|comercio|aduana/i, icon: 'ti ti-ship' },
  { re: /tr[aá]mite|expediente/i, icon: 'ti ti-folders' },
  { re: /reporte|estad[ií]st|dashboard/i, icon: 'ti ti-chart-histogram' },
  { re: /seguridad|acceso|rol|permiso/i, icon: 'ti ti-shield-lock-filled' },
  { re: /calendario|agenda|cita/i, icon: 'ti ti-calendar-event' },
  { re: /vehiculo|camion|transporte/i, icon: 'ti ti-truck' },
  { re: /inicio|home|principal/i, icon: 'ti ti-home-filled' },
];

const DEFAULT_ICON = 'ti ti-layout-grid-filled';

export function menuIconClass(titulo: string, descripcion = ''): string {
  const text = `${titulo || ''} ${descripcion || ''}`.trim();
  for (const rule of RULES) {
    if (rule.re.test(text)) return rule.icon;
  }
  return DEFAULT_ICON;
}
