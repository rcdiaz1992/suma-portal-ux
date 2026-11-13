/**
 * Proxy local → suma-dev.
 *
 * Los módulos SUMA (OCE, DIM/Pagos Diferidos, firma, etc.) asumen mismo origen:
 * listener + APIs (/b-*, /ssu-*, /n-*) en el mismo host que el iframe.
 */
const DEV = 'https://suma-dev.aduana.gob.bo';
/** API FRVMR real (andesjboss:8463/wsfrvmr está caído / 404; prod usa anapp). */
const FRVMR_API = 'https://anapp.aduana.gob.bo:8443';

const FRONT_PREFIXES = [
  '/oce',
  '/notificacion',
  '/salida',
  '/salida2', // DJRR / affidavit (menú Salida)
  '/ingreso',
  '/aforo',
  '/bandeja',
  // /portal: NO listar solo — choca con la ruta Angular /portal (shell nuevo).
  // Solo se proxea /portal/... (listener.html, src/, index.html legacy).
  '/sso',
  '/sgaLibs',
  '/firmaDigital',
  '/firmador',
  '/frvmr',
  '/infosuma',
  '/pki', // menú Firma Digital (en DEV a veces 404; pathRewrite → oce/certificado)
  '/sipoea', // Programa OEA
  '/bctpsuma', // BCTP (si el front está desplegado en DEV)
];

/** Rutas del shell Angular: nunca mandarlas al portal SUMA viejo. */
function isAngularShellPath(pathname) {
  if (!pathname) return false;
  if (pathname === '/' || pathname === '/index.html') return true;
  if (pathname === '/portal' || pathname === '/portal/') return true;
  if (pathname === '/login' || pathname.startsWith('/login/')) return true;
  if (pathname === '/hub' || pathname.startsWith('/hub/')) return true;
  if (pathname.startsWith('/no-habituales')) return true;
  return false;
}

function shouldProxy(pathname) {
  if (!pathname) return false;
  if (isAngularShellPath(pathname)) return false;
  if (
    pathname.startsWith('/b-') ||
    pathname.startsWith('/ssu-') ||
    pathname.startsWith('/n-') ||
    pathname.startsWith('/s-pki') ||
    pathname.startsWith('/sk-')
  ) {
    return true;
  }
  // Portal legacy solo bajo /portal/archivo (no /portal SPA)
  if (pathname.startsWith('/portal/')) return true;
  return FRONT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );
}

function rewriteSetCookie(raw) {
  const list = !raw ? [] : Array.isArray(raw) ? raw : [raw];
  return list.map((c) =>
    String(c)
      .replace(/;\s*Secure/gi, '')
      .replace(/;\s*Domain=[^;]*/gi, '')
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
  );
}

function isPdfMagic(buf) {
  return Buffer.isBuffer(buf) && buf.length >= 4 && buf.slice(0, 4).toString('ascii') === '%PDF';
}

function isBinaryContentType(contentType) {
  return /application\/pdf|octet-stream|image\/|video\/|audio\/|font\/|zip|wasm|protobuf/i.test(
    contentType || ''
  );
}

function shouldRewriteBody(contentType, buf) {
  if (isPdfMagic(buf) || isBinaryContentType(contentType)) return false;
  return /text\/|javascript|json|xml|css/i.test(contentType || '');
}

function localOrigin(req) {
  const hostRaw = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:4200';
  const host = String(hostRaw).split(',')[0].trim();
  const protoRaw = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const proto = String(protoRaw).split(',')[0].trim() || 'http';
  return `${proto}://${host}`;
}

function rewriteAbsoluteDev(body, req) {
  const origin = localOrigin(req);
  return body
    .replace(/https:\/\/suma-dev\.aduana\.gob\.bo/gi, origin)
    .replace(/http:\/\/suma-dev\.aduana\.gob\.bo/gi, origin);
}

/**
 * FRVMR (y utilidades) hardcodean andesjboss/anapp absolutos → CORS + 404 en local.
 * Reescribimos a mismo origen para pasar por el proxy /wsfrvmr|/wsutilidades.
 */
function rewriteFrvmrApis(body, req) {
  const origin = localOrigin(req);
  return body
    .replace(/https?:\/\/andesjboss\.aduana\.gob\.bo:8463\/wsfrvmr\//gi, `${origin}/wsfrvmr/`)
    .replace(/https?:\/\/andesjboss\.aduana\.gob\.bo:8463\/wsutilidades\//gi, `${origin}/wsutilidades/`)
    .replace(/https?:\/\/anapp\.aduana\.gob\.bo:8443\/wsfrvmr\//gi, `${origin}/wsfrvmr/`)
    .replace(/https?:\/\/anapp\.aduana\.gob\.bo:8443\/wsutilidades\//gi, `${origin}/wsutilidades/`);
}

/**
 * FRVMR bandeja:
 * - formControl null → HttpParams manda "codSolicitud=undefined"
 * - nroDocumento hardcodeado 123456789 (demo) → usar sesión real
 * - fechas en solicitud pero no en el form → Buscar no valida
 * - XHR fallido (andesjboss caído) sin error handler → tabla vacía silenciosa
 */
function patchFrvmrBundle(body, url) {
  if (!/\/frvmr\/.*\.js/i.test(url || '')) return body;
  let out = body;
  // Listener: sessionStorage.clear() borra suma.token del shell (mismo origen) → “desconexión”.
  if (!out.includes('/*suma-frvmr-keep-shell*/')) {
    out = out.replace(
      /const e=sessionStorage\.getItem\("jwt"\)\|\|localStorage\.getItem\("jwt"\);sessionStorage\.clear\(\),localStorage\.clear\(\),e&&\(localStorage\.setItem\("jwt",e\),sessionStorage\.setItem\("jwt",e\)\)/,
      [
        '/*suma-frvmr-keep-shell*/',
        'const e=sessionStorage.getItem("jwt")||localStorage.getItem("jwt");',
        '(function(){',
        'var keep={};',
        'for(var i=0;i<sessionStorage.length;i++){var k=sessionStorage.key(i);if(k&&k.indexOf("suma.")===0)keep[k]=sessionStorage.getItem(k);}',
        'var keepL={};',
        'for(var j=0;j<localStorage.length;j++){var k2=localStorage.key(j);if(k2&&k2.indexOf("suma.")===0)keepL[k2]=localStorage.getItem(k2);}',
        'sessionStorage.clear();localStorage.clear();',
        'Object.keys(keep).forEach(function(k){sessionStorage.setItem(k,keep[k]);});',
        'Object.keys(keepL).forEach(function(k){localStorage.setItem(k,keepL[k]);});',
        '})();',
        'e&&(localStorage.setItem("jwt",e),sessionStorage.setItem("jwt",e))',
      ].join('')
    );
  }
  if (!out.includes('/*suma-frvmr-codsol*/')) {
    out = out.replace(
      /this\.solicitud\.codSolicitud=this\.f\.codSolicitud\.value/g,
      '/*suma-frvmr-codsol*/this.solicitud.codSolicitud=(this.f.codSolicitud.value==null?"":this.f.codSolicitud.value)'
    );
  }
  if (!out.includes('/*suma-frvmr-bandeja*/')) {
    out = out.replace(
      /this\.dataService\.usuario\.nroDocumento="123456789"/g,
      '/*suma-frvmr-bandeja*/this.dataService.usuario.nroDocumento=(sessionStorage.getItem("nit")||sessionStorage.getItem("nroDocumento")||"")'
    );
    // Inicial: codSolicitud undefined + fechas solo en modelo → patch form + "" 
    out = out.replace(
      /this\.solicitud\.fechaFin=Ls\(new Date,"dd\/MM\/yyyy","es"\),this\.solicitud\.fechaInicio=Ls\(r,"dd\/MM\/yyyy","es"\),this\.solicitud\.tipoUsuario=this\.dataService\.usuario\.tipoUsuario,this\.solicitud\.numDocumento=this\.dataService\.usuario\.nroDocumento,this\.getListaSolicitudes\(this\.solicitud\)/g,
      [
        'this.solicitud.fechaFin=Ls(new Date,"dd/MM/yyyy","es"),',
        'this.solicitud.fechaInicio=Ls(r,"dd/MM/yyyy","es"),',
        'this.solicitud.codSolicitud="",',
        'this.bandejaForm.patchValue({fechaInicio:r,fechaFin:new Date,codSolicitud:""}),',
        'this.solicitud.tipoUsuario=this.dataService.usuario.tipoUsuario,',
        'this.solicitud.numDocumento=this.dataService.usuario.nroDocumento,',
        'this.getListaSolicitudes(this.solicitud)',
      ].join('')
    );
    // subscribe sin error → silencioso cuando CORS/404
    out = out.replace(
      /this\.bandejaService\.getListaSolicitud\(e\)\.subscribe\(i=>\{i\.success\?this\.listado=i\.result\.result:Tt\(\)\.fire\(\{title:"Error!",text:i\.message,icon:"error",confirmButtonText:"Ok"\}\)\}\)/g,
      'this.bandejaService.getListaSolicitud(e).subscribe(i=>{i.success?this.listado=i.result.result:Tt().fire({title:"Error!",text:i.message||"No se pudo listar solicitudes",icon:"error",confirmButtonText:"Ok"})},function(err){Tt().fire({title:"Error!",text:(err&&err.message)||"API FRVMR no disponible",icon:"error",confirmButtonText:"Ok"})})'
    );
  }
  return out;
}

/** Login / portal legacy → shell Angular (nunca indexOce ni portal/listener del SUMA viejo). */
function rewriteLoginTargets(body, req) {
  const origin = localOrigin(req);
  return body
    .replace(/['"]url_frontEnd_login['"]\s*:\s*['"][^'"]*['"]/g, `'url_frontEnd_login': '${origin}/login'`)
    .replace(/url_frontEnd_login\s*=\s*['"][^'"]*['"]/g, `url_frontEnd_login='${origin}/login'`)
    .replace(/['"]url_portal['"]\s*:\s*['"][^'"]*['"]/g, `'url_portal': '${origin}/portal'`)
    .replace(/url_portal\s*=\s*['"][^'"]*['"]/g, `url_portal='${origin}/portal'`);
}

/**
 * PDFs OCE (Mis Datos, Ver certificado, etc.): <embed src=blob> suele verse vacío
 * dentro del iframe del shell. Convertimos a <iframe src=blob>.
 */
function patchBlobPdfEmbeds(body) {
  if (!body || !/fileURL/.test(body)) return body;
  let out = body;

  // Mis Datos: nit vacío → reporte vacío
  if (/ReporteMisDatosController/i.test(out) && !out.includes('/*suma-misdatos-nit*/')) {
    out = out.replace(
      /parametros\s*=\s*\{\s*"numero"\s*:\s*\$cookies\.nit\s*\}/,
      '/*suma-misdatos-nit*/parametros = { "numero": ($cookies.nit || $cookies.nroDocumento || "") }'
    );
  }

  if (!/<embed/i.test(out)) return out;

  // Mis Datos (oce/reportes) — literal exacto del controller desplegado
  out = out.split(
    `$("#reporteMisDatos").append('<embed width="100%" height="800"  src="'+fileURL+'" type="application/pdf"></embed>')`
  ).join(
    `$("#reporteMisDatos").empty().append('<iframe id="reporteMisDatosPdf" title="Mis Datos" width="100%" height="800" style="border:0;background:#fff" src="'+fileURL+'"></iframe>')`
  );

  // Una línea genérica: $("#id").append('<embed ... src="'+fileURL+'" type="application/pdf"></embed>')
  out = out.replace(
    /\$\("#([^"]+)"\)\.append\(\s*'<embed[^']*src="'\s*\+\s*fileURL\s*\+\s*'" type="application\/pdf"><\/embed>'\s*\)/g,
    (_, id) =>
      `$("#${id}").empty().append('<iframe id="${id}Pdf" title="PDF" width="100%" height="800" style="border:0;background:#fff" src="'+fileURL+'"></iframe>')`
  );

  // Ver certificado: append('<embed...'+ //comentario + 'src='+fileURL+...</embed>')
  out = out.replace(
    /\$\("#certificado"\)\.append\('<embed width="100%" height="800"'[\s\S]*?fileURL\+'" type="application\/pdf"><\/embed>'\)/,
    [
      '$("#certificado").empty().append(',
      "'<iframe id=\"certificadoPdf\" title=\"Certificado OCE\" width=\"100%\" height=\"800\" ",
      "style=\"border:0;background:#fff\" src=\"'+fileURL+'\"></iframe>')",
    ].join('')
  );
  return out;
}

/**
 * Ver certificado OCE: tipodoc vacío en cookie → PDF vacío.
 * Tipodoc desde el formulario + iframe al blob (vía patchBlobPdfEmbeds).
 */
function patchOceCertificadoScript(body, url) {
  if (!/VerCertificado/i.test(url || '')) return body;
  let out = body.replace(
    /reportes\/oceCertificado\/'\+data\.result\.identificacionOperador\.nroDocumento\+'\/'\+\$cookies\.tipoDocumentoIdentificacion\+'\/'\+\$cookies\.username\+'\/'\+\$cookies\.token/g,
    "reportes/oceCertificado/'+data.result.identificacionOperador.nroDocumento+'/'+((data.result.identificacionOperador.tipoDocPersona&&data.result.identificacionOperador.tipoDocPersona.codigo)||$cookies.tipoDocumentoIdentificacion)+'/'+$cookies.username+'/'+$cookies.token"
  );
  // Primer GET listByNit: tipodoc/nit vacíos → pantalla en blanco.
  out = out.replace(
    /ENV\.url_backEnd_service\s*\+\s*"formulario\/update\/listByNit\/"\s*\+\s*\$cookies\.nit\s*\+\s*"\/"\s*\+\s*\$cookies\.tipoDocumentoIdentificacion/,
    'ENV.url_backEnd_service+"formulario/update/listByNit/"+($cookies.nit||$cookies.nroDocumento||"")+"/"+($cookies.tipoDocumentoIdentificacion||"NIT")'
  );
  return out;
}

/**
 * Listener OCE (reportes / administracion): persiste token/nit en cookie path=/ y
 * completa nit desde nroDocumento (si no, Mis Datos / certificado salen vacíos).
 */
function patchOceModuleListener(body, url) {
  if (!/\/oce\/[^/]+\/.*ListenerController\.js/i.test(url || '')) return body;
  if (body.includes('/*suma-oce-listener-cookies*/')) return body;
  if (!/window\.location\s*=\s*['"]index\.html#\/['"]\s*\+\s*menu/.test(body)) return body;
  return body.replace(
    /window\.location\s*=\s*['"]index\.html#\/['"]\s*\+\s*menu\s*;/,
    [
      '/*suma-oce-listener-cookies*/',
      'try {',
      "  var _pu = response.result.usuario && response.result.usuario.perfilUsuario;",
      "  var _nit = ($cookies.nit || (_pu && (_pu.nit || _pu.nroDocumento)) || $cookies.nroDocumento || '');",
      "  var _tip = ($cookies.tipoDocumentoIdentificacion || (_pu && (_pu.tipoDocumentoIdentificacion || _pu.tipoDocumento)) || 'NIT');",
      "  if (_nit) { $cookies.nit = _nit; }",
      "  if (_tip) { $cookies.tipoDocumentoIdentificacion = _tip; }",
      "  if (_pu && _pu.nroDocumento) { $cookies.nroDocumento = _pu.nroDocumento; }",
      "  var _exp = new Date(Date.now()+3600000).toUTCString();",
      "  ['/','/oce','/oce/','/oce/reportes','/oce/reportes/','/oce/administracion','/oce/administracion/'].forEach(function(p){",
      "    document.cookie='token='+encodeURIComponent($cookies.token||'')+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    if($cookies.username) document.cookie='username='+encodeURIComponent($cookies.username)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    if($cookies.nit) document.cookie='nit='+encodeURIComponent($cookies.nit)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    if($cookies.tipoDocumentoIdentificacion) document.cookie='tipoDocumentoIdentificacion='+encodeURIComponent($cookies.tipoDocumentoIdentificacion)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    if($cookies.usuarioperfil) document.cookie='usuarioperfil='+encodeURIComponent($cookies.usuarioperfil)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "  });",
      "  $http.defaults.headers.common['Auth-Token']=$cookies.token;",
      "  $http.defaults.headers.common['User']=$cookies.username||'';",
      "  $http.defaults.headers.common['charset']='UTF-8';",
      '} catch(_e) {}',
      "window.location.replace('index.html#/' + menu);",
    ].join('\n')
  );
}

/** app.run OCE: rehidratar Auth-Token/nit desde document.cookie tras el reload del listener. */
function patchOceAppRunHeaders(body, url) {
  if (!/\/oce\/[^/]+\/.*app\.js/i.test(url || '')) return body;
  if (body.includes('/*suma-oce-seed-headers*/')) return body;
  if (!/\$http\.defaults\.headers\.common\['Auth-Token'\]\s*=\s*\$cookies\.token/.test(body)) {
    return body;
  }
  return body.replace(
    /\$http\.defaults\.headers\.common\['Auth-Token'\]\s*=\s*\$cookies\.token\s*;/,
    [
      '/*suma-oce-seed-headers*/',
      "(function(){function _ck(n){try{var m=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):'';}catch(e){return '';}}",
      "var _tok=$cookies.token||_ck('token'); var _user=$cookies.username||_ck('username');",
      "var _nit=$cookies.nit||_ck('nit'); var _tip=$cookies.tipoDocumentoIdentificacion||_ck('tipoDocumentoIdentificacion');",
      "var _rol=$cookies.usuarioperfil||_ck('usuarioperfil')||_ck('role');",
      "if(_tok){$cookies.token=_tok;} if(_user){$cookies.username=_user;}",
      "if(_nit){$cookies.nit=_nit;} if(_tip){$cookies.tipoDocumentoIdentificacion=_tip;}",
      "if(_rol){$cookies.usuarioperfil=_rol;}",
      "$http.defaults.headers.common['Auth-Token']=_tok||$cookies.token;",
      '})();',
    ].join('')
  );
}

/**
 * OCE Charter/operadores: parent.hideScroll / showScroll + top con scroll del parent
 * rompen los modales Bootstrap dentro del iframe del portal (alertas no salen).
 */
function patchOceModals(body) {
  // Nunca lanzar si parent no tiene hideScroll/showScroll (portal Angular).
  return body
    .replace(
      /parent\.hideScroll\s*\(\s*(e|event)\s*\)/g,
      '(parent.hideScroll||window.hideScroll||function(){})($1)'
    )
    .replace(
      /parent\.showScroll\s*\(\s*(e|event)\s*\)/g,
      '(parent.showScroll||window.showScroll||function(){})($1)'
    )
    .replace(
      /\$\(\s*(['"])\.modal-central\1\s*\)\.css\(\s*(['"])top\2\s*,\s*\$\(\s*window\.parent\s*\)\.scrollTop\(\s*\)\s*\+\s*(['"])px\3\s*\)/g,
      '$(".modal-central").css("top","0px")'
    )
    .replace(
      /\$\(\s*(['"])\.modal-central\1\s*\)\.css\(\s*(['"])top\2\s*,\s*\$\(window\.parent\)\.scrollTop\(\)\s*\+\s*(['"])px\3\s*\)/g,
      '$(".modal-central").css("top","0px")'
    );
}

/** Polyfill al inicio de cada JS OCE (sirve aunque el browser tenga controller cacheado). */
function prependOceScrollPolyfill(body, url) {
  if (!/\/oce\/.*\.js(\?|$)/i.test(url || '')) return body;
  if (body.includes('/*suma-oce-scroll-polyfill*/')) return body;
  return (
    '/*suma-oce-scroll-polyfill*/(function(){var n=function(){};try{window.hideScroll=window.hideScroll||n;window.showScroll=window.showScroll||n;var p=window.parent;if(p){p.hideScroll=p.hideScroll||n;p.showScroll=p.showScroll||n;}}catch(e){}})();\n' +
    body
  );
}

/**
 * oceCharter index: bustear ?ver= fijo de controllers (si no, Chrome reusa el JS viejo
 * con parent.hideScroll sin fallback y las alertas mueren).
 */
function patchOceCharterIndex(body, url) {
  if (!/\/oce\/oceCharter\/(?:index\.html)?(?:\?|$)/i.test(url || '')) return body;
  if (body.includes('/*suma-oce-ver-bust*/')) return body;
  let out = body.replace(
    /\?ver="\s*\+\s*version\s*\+\s*"/g,
    '?ver=" + version + "&_sp=" + Date.now() + "'
  );
  // Estilos + hook jQuery para que el modal siempre se vea en el iframe.
  const boot = `<script>/*suma-oce-ver-bust*/(function(){var n=function(){};try{window.hideScroll=window.hideScroll||n;window.showScroll=window.showScroll||n;var p=window.parent;if(p){p.hideScroll=p.hideScroll||n;p.showScroll=p.showScroll||n;}}catch(e){}function wire(){try{if(!window.jQuery)return;jQuery(document).off("show.bs.modal.sumaPortal").on("show.bs.modal.sumaPortal",".modal",function(){try{var p=window.parent;if(p){p.hideScroll=p.hideScroll||n;p.showScroll=p.showScroll||n;}window.hideScroll=window.hideScroll||n;}catch(e){}jQuery(this).css({top:"0px",left:"0px",right:"0px",bottom:"0px","z-index":10050});});}catch(e){}}if(window.jQuery)wire();else{var t=setInterval(function(){if(window.jQuery){clearInterval(t);wire();}},50);setTimeout(function(){clearInterval(t);},15000);}})();</script>
<style id="suma-oce-modal-fix">.modal,.modal.modal-central{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;overflow:auto!important;z-index:10050!important}.modal-dialog,.modal-dialog-s{margin:12vh auto!important;max-width:600px;position:relative;z-index:10051!important}.modal-backdrop{z-index:10040!important}</style>`;
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, boot + '</head>');
  } else {
    out = boot + out;
  }
  return out;
}

/**
 * Evitar que el legacy saque el portal a suma-dev/indexOce:
 * - top/parent.location → location (iframe)
 * - redirects a url_frontEnd_login → postMessage al shell
 */
function patchTopBreakout(body) {
  const loginMsg =
    "try{window.parent.postMessage({type:'SUMA_LEGACY_LOGIN'},'*');}catch(e){}";
  return body
    .replace(/window\.top\.location\.href\s*=\s*ENV\.url_frontEnd_login\s*;?/g, loginMsg)
    .replace(/window\.top\.location\s*=\s*ENV\.url_frontEnd_login\s*;?/g, loginMsg)
    .replace(/window\.parent\.location\.href\s*=\s*ENV\.url_frontEnd_login\s*;?/g, loginMsg)
    .replace(/window\.parent\.location\s*=\s*ENV\.url_frontEnd_login\s*;?/g, loginMsg)
    .replace(/window\.location\.href\s*=\s*ENV\.url_frontEnd_login\s*;?/g, loginMsg)
    .replace(/window\.location\s*=\s*ENV\.url_frontEnd_login\s*;?/g, loginMsg)
    .replace(/([^.\w])top\.location\.href\s*=\s*ENV\.url_frontEnd_login\s*;?/g, `$1${loginMsg}`)
    .replace(/([^.\w])top\.location\s*=\s*ENV\.url_frontEnd_login\s*;?/g, `$1${loginMsg}`)
    // Salida Charter a portal legacy: mantener top real (no atrapar en iframe).
    .replace(
      /window\.top\.location\.href\s*=\s*([^;]+);/g,
      (full, rhs) => {
        if (/portal\/index\.html|sumaPortalHomeUrl/i.test(String(rhs))) {
          return full;
        }
        return `window.location.href=${rhs};`;
      }
    )
    .replace(/window\.top\.location\s*=/g, 'window.location=')
    .replace(/window\.parent\.location\.href\s*=/g, 'window.location.href=')
    .replace(/window\.parent\.location\s*=/g, 'window.location=')
    .replace(/([^.\w])top\.location\.href\s*=/g, '$1window.location.href=')
    .replace(/([^.\w])top\.location\s*=/g, '$1window.location=')
    .replace(/target\s*=\s*(["'])_top\1/gi, 'target="_self"')
    .replace(/window\.open\(([^,]+),\s*['"]_top['"]/g, 'window.open($1,["_self"]');
}

function patchSsoAdminListener(body, url) {
  if (!/\/sso\/.*ListenerController\.js/i.test(url || '')) return body;
  return body.replace(
    /window\.location\s*=\s*['"]admin\.html#\/['"]\s*\+\s*menu\s*;/,
    [
      "try {",
      "  var _exp = new Date(Date.now()+3600000).toUTCString();",
      "  ['/','/sso','/sso/'].forEach(function(p){",
      "    document.cookie='token='+encodeURIComponent($cookies.token||'')+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    if($cookies.username) document.cookie='username='+encodeURIComponent($cookies.username)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    if($cookies.nit) document.cookie='nit='+encodeURIComponent($cookies.nit)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    if($cookies.tipoDocumentoIdentificacion) document.cookie='tipoDocumentoIdentificacion='+encodeURIComponent($cookies.tipoDocumentoIdentificacion)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    if($cookies.role) document.cookie='role='+encodeURIComponent($cookies.role)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "  });",
      "} catch(e) {}",
      // nit a veces viene solo como nroDocumento; sin eso formularioOce revienta el resolve.
      "try{",
      "  var _pu=response.result.usuario&&response.result.usuario.perfilUsuario;",
      "  if(_pu){",
      "    var _nit=_pu.nit||_pu.nroDocumento||'';",
      "    var _tip=_pu.tipoDocumentoIdentificacion||_pu.tipoDocumento||$cookies.tipoDocumentoIdentificacion||'';",
      "    if(_nit){$cookies.nit=_nit;}",
      "    if(_tip){$cookies.tipoDocumentoIdentificacion=_tip;}",
      "    ['/','/sso','/sso/'].forEach(function(p){",
      "      if(_nit)document.cookie='nit='+encodeURIComponent(_nit)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "      if(_tip)document.cookie='tipoDocumentoIdentificacion='+encodeURIComponent(_tip)+'; path='+p+'; expires='+_exp+'; SameSite=Lax';",
      "    });",
      "  }",
      "}catch(_e){}",
      // Alias menú viejo → ruta real de appAdmin (si no, otherwise manda a /login/portal).
      "if(menu==='gestionUsuarios'){menu='gestion-usuarios';}",
      // Misma navegación que el SSO original, pero en el iframe (no top).
      "window.location.replace('admin.html#/' + menu);",
    ].join(' ')
  );
}

/**
 * formularioOce usa nit/tipoDocumento; si el HTTP falla el resolve tumba toda la vista
 * (solo se ve el breadcrumb ADMINISTRACION…). Tolerar error y nit vacío → [].
 */

function patchUsuarioOceListaSafe(body, url) {
  if (!/\/sso\/.*UsuarioOceFactory\.js/i.test(url || '')) return body;
  if (body.includes('/*suma-lista-oce-safe*/')) return body;
  // Solo el primer .then de lista(): agrega handler de error para no tumbar el resolve.
  return body.replace(
    /interfaz\.lista = function\(\) \{\s*console\.info\('usuarioOceFactory: lista'\);/,
    "interfaz.lista = function() {/*suma-lista-oce-safe*/\n        console.info('usuarioOceFactory: lista');"
  ).replace(
    /(interfaz\.lista = function\(\) \{\/\*suma-lista-oce-safe\*\/[\s\S]*?return \$http\(request\)\s*\.then\(function\(response\) \{\s*return response\.data;\s*\})(\);)/,
    '$1, function() { return { success: false, result: [] }; }$2'
  );
}

function patchHelperFactoryOce(body, url) {
  if (!/\/sso\/.*HelperFactory\.js/i.test(url || '')) return body;
  if (body.includes('/*suma-formularioOce-safe*/')) return body;
  return body.replace(
    /interfaz\.formularioOce\s*=\s*function\s*\(\)\s*\{[\s\S]*?return \$http\.get\(url\)\s*\.then\(function\(response\)\s*\{[\s\S]*?\}\);/,
    [
      'interfaz.formularioOce = function() {/*suma-formularioOce-safe*/',
      'console.info("helperFactory.formularioOce");',
      "var _nit = $cookies.nit || $cookies.nroDocumento || '';",
      "var _tip = $cookies.tipoDocumentoIdentificacion || '';",
      "var _tok = $cookies.token || ($cookies.get && $cookies.get('token')) || '';",
      'if (!_nit) { return $http.get(ENV.url_backEnd_service + "autenticar/verificar/" + (_tok||"x")).then(function(){return [];}, function(){return [];}); }',
      "var url = ENV.url_backEnd_service_oce + 'formulario/actual/listByNroDocumento/' + _nit + '/' + _tip;",
      "return $http.get(url, { headers: { 'Auth-Token': _tok, 'codigoModulo': 'sso_admin', 'User': $cookies.username || '', 'charset': 'UTF-8' } }).then(function(response) {",
      'if (response.data && response.data.success) { return response.data.result; }',
      'console.error("helperFactory.formularioOce: ", response.data && response.data.result);',
      'return [];',
      '}, function() { return []; });',
    ].join('\n')
  );
}

/** Evita otherwise → /login/portal (ruta inexistente) que tumba Gestión de Usuarios en el iframe. */
function patchSsoAppAdminOtherwise(body, url) {
  if (!/\/sso\/.*appAdmin\.js/i.test(url || '')) return body;
  return body.replace(
    /otherwise\(\s*\{\s*redirectTo:\s*['"]\/login\/portal['"]\s*\}\s*\)/,
    "otherwise({ template: '<div style=\'padding:1rem\'>Opción no disponible en este módulo.</div>' })"
  );
}

function patchSsoAppAdmin(body, url) {
  if (!/\/sso\/.*appAdmin\.js/i.test(url || '')) return body;
  if (body.includes('/*suma-portal-seed-headers*/')) return body;
  return body.replace(
    /appAdmin\.run\(function\(\$rootScope,\s*auth,\s*\$http,\s*\$cookies\)\s*\{/,
    [
      'appAdmin.run(function($rootScope, auth, $http, $cookies) {',
      '/*suma-portal-seed-headers*/',
      '(function(){',
      "function _ck(n){try{var m=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));return m?decodeURIComponent(m[1]):'';}catch(e){return '';}}",
      "var _tok=$cookies.token||($cookies.get&&$cookies.get('token'))||_ck('token');",
      "var _user=$cookies.username||($cookies.get&&$cookies.get('username'))||_ck('username');",
      "var _rol=$cookies.role||$cookies.usuarioperfil||($cookies.get&&($cookies.get('role')||$cookies.get('usuarioperfil')))||_ck('role')||_ck('usuarioperfil');",
      'if(_tok){',
      "if(!$cookies.token){try{$cookies.token=_tok;}catch(e){}try{$cookies.put&&$cookies.put('token',_tok);}catch(e){}}",
      "if(_user&&!$cookies.username){try{$cookies.username=_user;}catch(e){}}",
      "$http.defaults.headers.common['Auth-Token']=_tok;",
      "$http.defaults.headers.common['codigoModulo']='sso_admin';",
      "$http.defaults.headers.common['rol']=_rol||'';",
      "$http.defaults.headers.common['User']=_user||'';",
      "$http.defaults.headers.common['charset']='UTF-8';",
      '}',
      '})();',
    ].join('')
  );
}

/**
 * Guard en HTML: solo reescribe `top` → self (evita sacar el shell).
 * NO tocar `parent`: OCE usa parent.hideScroll / parent.showScroll / postMessage
 * para modales y volver al login Angular; si parent===self se rompen alertas y el wizard.
 */
function injectFrameGuard(body, url) {
  // No inyectar en partials Angular (src/views/*.html): rompe ng-view / resolve.
  if (/\/src\/views\//i.test(url || '')) return body;
  if (!/\/(sso|oce|portal|ingreso|frvmr)\//i.test(url || '')) return body;
  if (!/\.html/i.test(url || '')) return body;
  if (body.includes('/*suma-frame-guard*/')) return body;
  const guard = `<script>/*suma-frame-guard*/(function(){var noop=function(){};try{if(typeof window.hideScroll!=='function')window.hideScroll=noop;if(typeof window.showScroll!=='function')window.showScroll=noop;}catch(e){}try{var p=window.parent;if(p){if(typeof p.hideScroll!=='function')p.hideScroll=noop;if(typeof p.showScroll!=='function')p.showScroll=noop;}}catch(e){}if(window.self===window.top)return;var s=window.self;try{Object.defineProperty(window,'top',{configurable:true,get:function(){return s;}});}catch(e){}try{window.top=s;}catch(e){}})();</script>`;
  if (/<head[^>]*>/i.test(body)) {
    return body.replace(/<head[^>]*>/i, (m) => m + guard);
  }
  return guard + body;
}

/** Parsea Cookie header → { name: value }. */
function parseCookieHeader(raw) {
  const out = {};
  String(raw || '')
    .split(';')
    .forEach((part) => {
      const i = part.indexOf('=');
      if (i < 0) return;
      const k = part.slice(0, i).trim();
      const v = part.slice(i + 1).trim();
      if (!k) return;
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    });
  return out;
}

/** codigoModulo según el front que llama (Referer), no forzar siempre sso_admin. */
function codigoModuloFromReferer(referer) {
  const r = String(referer || '');
  if (/\/oce\/reportes/i.test(r)) return 'oce_reportes';
  if (/\/oce\/administracion/i.test(r)) return 'oce_admin';
  if (/\/oce\/certificado/i.test(r)) return 'oce_certificado';
  if (/\/oce\//i.test(r)) return 'oce_admin';
  if (/\/sso\//i.test(r)) return 'sso_admin';
  return 'sso_admin';
}

/**
 * b-oce (y demás backends) no autentican solo con cookie: exigen Auth-Token.
 * El admin legacy a veces no setea $http.defaults (p.ej. $cookies.token vacío al boot).
 */
function injectBackendAuthHeaders(proxyReq, req) {
  if (!req.url || !/^\/(b-|ssu-|n-|s-pki|sk-)/.test(req.url)) return;
  const cookies = parseCookieHeader(req.headers.cookie);
  const hdr = req.headers;
  const token = hdr['auth-token'] || cookies.token;
  if (token && !hdr['auth-token']) {
    proxyReq.setHeader('Auth-Token', token);
  }
  const user = hdr['user'] || cookies.username;
  if (user && !hdr['user']) {
    proxyReq.setHeader('User', user);
  }
  if (!hdr['codigomodulo']) {
    proxyReq.setHeader('codigoModulo', codigoModuloFromReferer(hdr.referer));
  }
  const rol = hdr['rol'] || cookies.role || cookies.usuarioperfil;
  if (rol && !hdr['rol']) {
    proxyReq.setHeader('rol', rol);
  }
  if (!hdr['charset']) {
    proxyReq.setHeader('charset', 'UTF-8');
  }
}

function onProxyReq(proxyReq, req) {
  proxyReq.setHeader('accept-encoding', 'identity');
  if (req.url && /^\/(b-|ssu-|n-|s-pki|sk-)/.test(req.url)) {
    proxyReq.setHeader('origin', DEV);
    proxyReq.setHeader('referer', DEV + '/');
    injectBackendAuthHeaders(proxyReq, req);
  }
}

function fixCorsHeaders(headers, req) {
  const origin = req.headers.origin || localOrigin(req);
  if (headers['access-control-allow-origin']) {
    headers['access-control-allow-origin'] = origin;
  }
  headers['access-control-allow-credentials'] = 'true';
}

function sendRaw(proxyRes, res, buf, req) {
  const headers = { ...proxyRes.headers };
  fixCorsHeaders(headers, req);
  if (buf && isPdfMagic(buf)) {
    headers['content-type'] = 'application/pdf';
  }
  // JS OCE con ?ver= fijo: sin esto el browser reusa el controller viejo (hideScroll).
  if (/\/oce\/.*\.(js|html)(\?|$)/i.test(req.url || '')) {
    headers['cache-control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    headers['pragma'] = 'no-cache';
    headers['expires'] = '0';
    delete headers['etag'];
    delete headers['last-modified'];
  }
  if (buf) headers['content-length'] = String(buf.length);
  res.writeHead(proxyRes.statusCode || 200, headers);
  if (buf) res.end(buf);
}

function onProxyRes(proxyRes, req, res) {
  const cookies = proxyRes.headers['set-cookie'];
  if (cookies) {
    proxyRes.headers['set-cookie'] = rewriteSetCookie(cookies);
  }
  delete proxyRes.headers['content-security-policy'];
  delete proxyRes.headers['content-security-policy-report-only'];
  delete proxyRes.headers['x-frame-options'];
  delete proxyRes.headers['content-encoding'];

  const ct = proxyRes.headers['content-type'] || '';
  const chunks = [];
  proxyRes.on('data', (chunk) => chunks.push(chunk));
  proxyRes.on('end', () => {
    const raw = Buffer.concat(chunks);
    // Solo APIs de reportes PDF (b-oce/rest/reportes/...), no el front /oce/reportes/*.js
    const isReportApi =
      /\/b-[^/]+\/rest\/reportes\//i.test(req.url || '') ||
      /\/rest\/reportes\//i.test(req.url || '');
    if (isReportApi || !shouldRewriteBody(ct, raw)) {
      sendRaw(proxyRes, res, raw, req);
      return;
    }
    let body = raw.toString('utf8');
    body = rewriteAbsoluteDev(body, req);
    body = rewriteFrvmrApis(body, req);
    body = rewriteLoginTargets(body, req);
    body = patchFrvmrBundle(body, req.url || '');
    body = patchOceCertificadoScript(body, req.url || '');
    body = patchBlobPdfEmbeds(body);
    body = patchOceModals(body);
    body = prependOceScrollPolyfill(body, req.url || '');
    body = patchOceCharterIndex(body, req.url || '');
    body = patchTopBreakout(body);
    body = patchOceModuleListener(body, req.url || '');
    body = patchOceAppRunHeaders(body, req.url || '');
    body = patchSsoAdminListener(body, req.url || '');
    body = patchSsoAppAdmin(body, req.url || '');
    body = patchSsoAppAdminOtherwise(body, req.url || '');
    body = patchHelperFactoryOce(body, req.url || '');
    body = patchUsuarioOceListaSafe(body, req.url || '');
    body = injectFrameGuard(body, req.url || '');
    sendRaw(proxyRes, res, Buffer.from(body, 'utf8'), req);
  });
}

function isFrvmrApiPath(pathname) {
  return (
    pathname === '/wsfrvmr' ||
    pathname.startsWith('/wsfrvmr/') ||
    pathname === '/wsutilidades' ||
    pathname.startsWith('/wsutilidades/')
  );
}

module.exports = [
  // Primero: APIs FRVMR → anapp (no existen en suma-dev ni en andesjboss:8463).
  {
    context: (pathname) => isFrvmrApiPath(pathname),
    target: FRVMR_API,
    secure: false,
    changeOrigin: true,
    logLevel: 'info',
    cookieDomainRewrite: 'localhost',
    onProxyReq(proxyReq, req) {
      proxyReq.setHeader('accept-encoding', 'identity');
      // El front FRVMR ya manda Authorization: Bearer <jwt> en same-origin.
      // Solo rellenamos Auth-Token SUMA si el browser no lo envió.
      const cookies = parseCookieHeader(req.headers.cookie);
      const token = req.headers['auth-token'] || cookies.token;
      if (token && !req.headers['auth-token']) {
        proxyReq.setHeader('Auth-Token', token);
      }
    },
  },
  {
    context: (pathname) => shouldProxy(pathname),
    target: DEV,
    secure: false,
    changeOrigin: true,
    logLevel: 'info',
    cookieDomainRewrite: 'localhost',
    selfHandleResponse: true,
    onProxyReq,
    onProxyRes,
    pathRewrite: {
      '^/oce/presencial': '/oce/administracion',
      // Menú Firma Digital apunta a /pki (no desplegado en suma-dev); el front vivo es oce/certificado.
      '^/pki': '/oce/certificado',
    },
  },
];
