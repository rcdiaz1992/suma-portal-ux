# Portal SUMA unificado — alcance y repos

Documento de trabajo para este front Angular (raíz del repo).  
Objetivo: unificar login, registro de operadores y barra de menú SUMA.

**Entrada del portal = `/login`** (ya no `indexOce` / `indexLogin`). Ver [`ENTRADA-PORTAL.md`](ENTRADA-PORTAL.md).

## Alcance

1. Login usuarios **internos** y **externos** (un solo `/login`).
2. Registro / accesos especiales **separados** (5 caminos, mismo diseño).
3. Barra / árbol de menú SUMA post-login (según perfil).

## Modelo de acceso

```
/login                         → login (usuario + clave + captcha si aplica)
/login/olvidar-clave           → recuperación (pantalla completa · API changePassword)
/login/registro/habituales     → registro nuevo usuario (pantalla completa · OPE2)
/login/registro                → hub otros accesos (otros, ORF, NP, charter)
/login/registro/otros|orf      → altas OPE3/OPE8 (pantalla completa)
/login/no-habituales           → MFA
/login/charter                 → Charter
/portal                        → shell + menú
```
Enlaces del login (como SSO): ¿Olvidó su contraseña? · Registrar nuevo usuario.
Sin links a indexLogin.


| Acceso | Separado | UI |
|---|---|---|
| Login operadores/técnicos | Sí | `/login` |
| 1 Habituales | Sí | formulario en este repo |
| 2 No habituales | Sí | mismo diseño |
| 3 Otros | Sí | formulario en este repo |
| 4 ORF | Sí | formulario en este repo |
| 5 Charter | Sí | mismo diseño |

No se abre `indexLogin` del SSO. Solo se consume la API `POST /b-sso/rest/usuario/new/{OPE*}`.

## Repos necesarios

| Proyecto | Path | Para qué |
|---|---|---|
| **SSO** | `/home/roberto/git/suma_gitnuevo/sso/` | Auth, menú, token, formularios de alta legacy |
| **OCE** | `/home/roberto/git/suma_gitnuevo/oce/` | Operadores / NP / Charter |
| **UX Angular** | este repo (`suma-portal-ux`) | Shell + diseño unificado |

## Rutas actuales

| Ruta | Función |
|---|---|
| `/login` | Login unificado |
| `/login/registro` | Hub 5 accesos |
| `/login/registro/habituales` | Alta habituales |
| `/login/registro/otros` | Alta otros operadores |
| `/login/registro/orf` | Alta ORF |
| `/login/no-habituales` | MFA no habituales |
| `/login/charter` | Charter |
| `/hub/no-habituales` | Cubos post-MFA |
| `/portal` | Shell post-login |

Docs: `ANGULAR-MAP.md`, `docs/AUTH-HIBRIDO.md`.
