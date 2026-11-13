# SUMA Portal UX (Angular)

App Angular 16. **La entrada del portal es el login** (`/login`).  
Backend: API SSO existente (`b-sso`). Docs: [`docs/PORTAL-UNIFICADO.md`](docs/PORTAL-UNIFICADO.md), [`docs/ENTRADA-PORTAL.md`](docs/ENTRADA-PORTAL.md).

## Flujo

| Ruta | Descripción |
|------|-------------|
| `/` → `/login` | Puerta del portal (operadores y técnicos) |
| `/login/registro` | Accesos 1·3·4 (login con canal) · 2 MFA · 5 Charter |
| `/login/olvidar-clave` | Recuperación de clave |
| `/login/reset/...` | Nueva clave (token del correo) |
| `/portal` | Shell post-login + menú |

## Arranque local

```bash
npm install
npm start
```

Abre http://localhost:4200 → redirige a `/login`.

Proxy API: `proxy.conf.js` / `proxy.conf.json` → `b-sso` en suma-dev.
