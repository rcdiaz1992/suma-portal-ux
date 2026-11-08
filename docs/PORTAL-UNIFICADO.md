# Portal SUMA unificado — alcance y repos

Documento de trabajo para este front Angular (raíz del repo).  
Objetivo: unificar login, registro de operadores y barra de menú SUMA.

## Alcance

1. Login usuarios **internos** y **externos** (un solo login con selector).
2. Registro de nuevos operadores **habituales** y **no habituales**.
3. Barra / árbol de menú SUMA post-login (según perfil).

## Repos necesarios

| Proyecto | Path | Para qué |
|---|---|---|
| **SSO** | `/home/roberto/git/suma_gitnuevo/sso/` | Login INTERNO/EXTERNO, MFA/no habituales, landing `indexOce`, **menú** (API), token SUMA |
| **OCE** | `/home/roberto/git/suma_gitnuevo/oce/` | Registro / administración de operadores; apps que entran por listener + token |
| **UX Angular** | este repo (`suma-portal-ux`) | Shell unificado nuevo |

### Opcionales

- **`regpad/`** — si el padrón/registro “duro” sigue ahí y no solo en OCE.
- **Keycloak / an-core** — login híbrido (identidad KC + token SUMA residual).

### No requeridos aún para el shell

`ingreso`, `salida`, `aforo`, `notificacion`, etc. Se enlazan desde el menú; no hace falta rehacerlos para unificar acceso + menú + registro.

## Conceptos

| Término | Significado |
|---|---|
| **Portal SUMA** | Sistema de la Aduana (acceso + shell + módulos) |
| **OCE** | Operador de Comercio Exterior (perfil/módulo), no el portal entero |
| **SSO** | Autenticación y puerta de entrada (`indexOce`, menú, token) |
| **INTERNO** | Funcionario AN (`typeUser`) |
| **EXTERNO** | Operador habitual OCE |
| **NO_HABITUAL** | MFA + hub de cubos (registro / operaciones simplificadas) |

## Orden de implementación (Angular)

1. Shell + login en este repo → API **SSO** (`useMockAuth: false` cuando haya PRE/DESA).
2. Menú desde API SSO (reemplazar mock `src/app/data/portal-menu.ts`).
3. Registro habitual / no habitual → UI del shell → **OCE** (+ regpad si aplica).
4. Ítems del menú → módulos legacy (listener / URL / token SUMA).
5. Híbrido Keycloak + token SUMA — ver `docs/AUTH-HIBRIDO.md`.

## Rutas actuales

| Ruta | Función |
|---|---|
| `/login` | Slice Externo / Interno |
| `/login/no-habituales` | MFA no habituales |
| `/hub/no-habituales` | 2 cubos: registro + operaciones |
| `/hub/no-habituales/registro` | Alta importador no habitual (prototipo) |
| `/hub/no-habituales/ops` | Opciones tipo profile SSO |
| `/portal` | Shell + menú post-login |

## Referencias UX / legacy

- SSO live: `https://suma-pre.aduana.gob.bo/sso/indexOce.html#/profile`
- Mapa Angular: `ANGULAR-MAP.md`
