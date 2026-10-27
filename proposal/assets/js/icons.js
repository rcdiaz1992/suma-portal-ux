/**
 * Iconos SVG del prototipo SUMA (menú + configuración).
 */
(function () {
  const SVG = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/></svg>',
    ops: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h13v2H3v-2zm1-6h16l1 4H4l1-4zm2.5-5h9l1.5 3h-12L6.5 6zM7 8.5h2v1H7v-1zm8 0h2v1h-2v-1z"/></svg>',
    ingreso: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M5 19h14"/></svg>',
    salida: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9m0 0-4 4m4-4 4 4M5 5h14"/></svg>',
    dam: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l4 4v14H7V3zm8 0v4h4M9 12h8M9 16h6"/></svg>',
    aforo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M7 16l3-8 3 5 2-3 2 6"/></svg>',
    dims: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5V5zm3 4h8M8 12h8M8 15h5"/></svg>',
    oce: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 9a7 7 0 0 1 14 0"/></svg>',
    estado: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/></svg>',
    tramite: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v3H8V4zm-2 5h12v11H6V9zm3 3h6M9 15h4"/></svg>',
    pagos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4V7zm0 3h16M8 14h3"/></svg>',
    qr: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 3h2v2h-2v-2zm3-3h4v4h-2v-2h-2v-2zm0 5h2v2h-2v-2z"/></svg>',
    notif: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12l-1.2-1.5A6 6 0 0 1 15 11V9a3 3 0 0 0-6 0v2a6 6 0 0 1-1.8 4.5L6 17zm4.2 2a2 2 0 0 0 3.6 0"/></svg>',
    bandeja: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4V6zm0 4 8 5 8-5"/></svg>',
    registro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11l3 3v13H5V4zm11 0v3h3M8 12h8M8 16h5"/></svg>',
    consultas: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>',
    instructivo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16H7V4zm3 4h4M10 12h4M10 16h3"/></svg>',
    tools: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5z"/></svg>',
    firma: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18c2.5-4 5-6 8-6s4.5 1 6 3M8 10c.8-2 2.2-3.5 4-3.5S15 8 15.5 9.5"/></svg>',
    verify: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 5 3.2 8.5 7 10 3.8-1.5 7-5 7-10V6l-7-3zm-1 12-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6z"/></svg>',
    side: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4V5zm6 0v14M7 9h1.5M7 12h1.5M7 15h1.5"/></svg>',
    launcher: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h6v6H5V5zm8 0h6v6h-6V5zM5 13h6v6H5v-6zm8 0h6v6h-6v-6z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M19 13.5A7.5 7.5 0 1 1 10.5 5 6 6 0 0 0 19 13.5z"/></svg>',
    dot: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/></svg>',
  };

  function icon(key) {
    const body = SVG[key] || SVG.dot;
    return '<span class="ico" data-ico="' + key + '">' + body + "</span>";
  }

  window.SUMA_ICON = icon;
  window.SUMA_ICONS = SVG;
})();
