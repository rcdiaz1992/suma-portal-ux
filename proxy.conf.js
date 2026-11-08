/**
 * Proxy local → suma-dev.
 *
 * Los módulos SUMA (OCE, DIM/Pagos Diferidos, firma, etc.) asumen mismo origen:
 * listener + APIs (/b-*, /ssu-*, /n-*) en el mismo host que el iframe.
 */
const DEV = 'https://suma-dev.aduana.gob.bo';

const FRONT_PREFIXES = [
  '/oce',
  '/notificacion',
  '/salida',
  '/salida2', // DJRR / affidavit (menú Salida)
  '/ingreso',
  '/aforo',
  '/bandeja',
  '/portal',
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

function shouldProxy(pathname) {
  if (!pathname) return false;
  if (
    pathname.startsWith('/b-') ||
    pathname.startsWith('/ssu-') ||
    pathname.startsWith('/n-') ||
    pathname.startsWith('/s-pki') ||
    pathname.startsWith('/sk-')
  ) {
    return true;
  }
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
  return `http://${req.headers.host || 'localhost:4200'}`;
}

function rewriteAbsoluteDev(body, req) {
  const origin = localOrigin(req);
  return body
    .replace(/https:\/\/suma-dev\.aduana\.gob\.bo/gi, origin)
    .replace(/http:\/\/suma-dev\.aduana\.gob\.bo/gi, origin);
}

/** Login legacy → login Angular del shell (nunca suma-dev absoluto). */
function rewriteLoginTargets(body, req) {
  const origin = localOrigin(req);
  return body
    .replace(/['"]url_frontEnd_login['"]\s*:\s*['"][^'"]*['"]/g, `'url_frontEnd_login': '${origin}/login'`)
    .replace(/url_frontEnd_login\s*=\s*['"][^'"]*['"]/g, `url_frontEnd_login='${origin}/login'`);
}

function patchOceCertificadoScript(body, url) {
  if (!/VerCertificado/i.test(url || '')) return body;
  return body.replace(
    /reportes\/oceCertificado\/'\+data\.result\.identificacionOperador\.nroDocumento\+'\/'\+\$cookies\.tipoDocumentoIdentificacion\+'\/'\+\$cookies\.username\+'\/'\+\$cookies\.token/g,
    "reportes/oceCertificado/'+data.result.identificacionOperador.nroDocumento+'/'+((data.result.identificacionOperador.tipoDocPersona&&data.result.identificacionOperador.tipoDocPersona.codigo)||$cookies.tipoDocumentoIdentificacion)+'/'+$cookies.username+'/'+$cookies.token"
  );
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
    .replace(/window\.top\.location\.href\s*=/g, 'window.location.href=')
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
      "window.location.hash = '#/' + menu;",
    ].join(' ')
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
      "if ($cookies.token) {",
      "$http.defaults.headers.common['Auth-Token'] = $cookies.token;",
      "$http.defaults.headers.common['codigoModulo'] = 'sso_admin';",
      "$http.defaults.headers.common['rol'] = $cookies.role || $cookies.usuarioperfil || '';",
      "$http.defaults.headers.common['User'] = $cookies.username || '';",
      "$http.defaults.headers.common['charset'] = 'UTF-8';",
      '}',
    ].join('')
  );
}

/** Guard en HTML: top apunta a self para que no puedan sacar el shell. */
function injectFrameGuard(body, url) {
  if (!/\.html(?:\?|$)/i.test(url || '') && !/text\/html/i.test(url || '')) {
    // also when path ends with /sso/admin.html without query in url param - url has query
  }
  if (!/\/(sso|oce|portal|ingreso|frvmr)\//i.test(url || '')) return body;
  if (!/\.html/i.test(url || '')) return body;
  if (body.includes('/*suma-frame-guard*/')) return body;
  const guard = `<script>/*suma-frame-guard*/(function(){if(window.self===window.top)return;try{Object.defineProperty(window,'top',{configurable:true,get:function(){return window.self;}});}catch(e){}window.addEventListener('message',function(){});})();</script>`;
  if (/<head[^>]*>/i.test(body)) {
    return body.replace(/<head[^>]*>/i, (m) => m + guard);
  }
  return guard + body;
}

function onProxyReq(proxyReq, req) {
  proxyReq.setHeader('accept-encoding', 'identity');
  if (req.url && /^\/(b-|ssu-|n-|s-pki|sk-)/.test(req.url)) {
    proxyReq.setHeader('origin', DEV);
    proxyReq.setHeader('referer', DEV + '/');
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
    if (/\/reportes\//i.test(req.url || '') || !shouldRewriteBody(ct, raw)) {
      sendRaw(proxyRes, res, raw, req);
      return;
    }
    let body = raw.toString('utf8');
    body = rewriteAbsoluteDev(body, req);
    body = rewriteLoginTargets(body, req);
    body = patchOceCertificadoScript(body, req.url || '');
    body = patchTopBreakout(body);
    body = patchSsoAdminListener(body, req.url || '');
    body = patchSsoAppAdmin(body, req.url || '');
    body = injectFrameGuard(body, req.url || '');
    sendRaw(proxyRes, res, Buffer.from(body, 'utf8'), req);
  });
}

module.exports = [
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
