# Auth híbrido: Keycloak + token SUMA (b-sso)

## Objetivo

Pasar el portal a **Keycloak** como SIAN (`sfj-mfi-fiscalizacion-front`) y SIGRAT (`sfj-mat-sigrat-front`), **sin romper** los módulos que hoy dependen del **token de sesión SUMA** generado por `b-sso`.

## Dos credenciales

| Capa | Origen | Uso |
|------|--------|-----|
| **Keycloak** | `keycloak-js` / `@aduana/an-core` | Identidad, roles (`user_info` en ID token), `Authorization: Bearer` hacia APIs nuevas |
| **Token SUMA** | `b-sso` (`TokenBean.token` + opcional `jwt`) | Listener del portal, menús legacy, APIs que aún leen cookie/`Auth-Token` / path `…/{token}` |

El login UI (slice Externo/Interno, captcha, no habituales) puede vivir en Angular; detrás hay que **mantener la generación del token SUMA** aunque Keycloak sea el front de autenticación.

## Flujo propuesto

1. Usuario elige **Externo / Interno** (y captcha si aplica).
2. Autenticación en **Keycloak** (realm `login`, client tipo `app-inicio` / portal).
3. Tras OK de Keycloak, el BFF o `b-sso` **emite/renueva el token SUMA** (misma forma que `autenticar-captcha/portal` → `{ token, url, jwt }`), usando identidad Keycloak + `typeUser` EXTERNO|INTERNO.
4. El shell Angular guarda:
   - sesión Keycloak (Bearer),
   - `suma.token` (y cookie `token` si hace falta) para microfrontends / listener legacy.
5. APIs nuevas: Bearer KC. APIs SUMA viejas: token SUMA hasta migrarlas.

## Referencias

- SIGRAT: Keycloak-only + Bearer (sin b-sso en login).
- SIAN: Keycloak principal + resto residual `b-sso` / `Auth-Token` en notificaciones SUMA → patrón más cercano a este portal.
- SSO actual: `POST …/b-sso/rest/autenticar-captcha/portal` + cookie `typeUser`.

## Estado en este repo

- `SsoAuthService`: mock / llamada a `autenticar-captcha` (token SUMA).
- Pendiente: `KeyCloakAuthModule` / init como SIAN + **puente** post-login que genere el token SUMA sin descartar Keycloak.
