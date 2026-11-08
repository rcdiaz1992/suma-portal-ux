# SUMA Portal UX (Angular)

App Angular 16 basada en `sen-ng-demo`. Alcance unificado: **login + registro + menú**  
→ ver [`docs/PORTAL-UNIFICADO.md`](docs/PORTAL-UNIFICADO.md) (repos SSO + OCE).

## Flujo

| Ruta | Descripción |
|------|-------------|
| `/login` | Slice **Externo / Interno** + usuario/clave (+ captcha interno) |
| `/login/no-habituales` | Doble factor (código) para operadores no habituales |
| `/hub/no-habituales` | 2 cubos: registro + operaciones |
| `/portal` | Shell post-login + menú (mock por perfil; API SSO después) |

Lógica alineada al SSO actual (`indexLogin` / `indexOce` + `typeUser`):

- **EXTERNO**: usuario OCE corto
- **INTERNO**: usuario corto; backend resuelve `@aduana.gob.bo`
- Enlace inferior → MFA no habituales → hub

Auth mock en `SsoAuthService` (`environment.useMockAuth`). API real: `POST {ssoApi}/autenticar-captcha/portal`.

## Arranque

```bash
npm install
npm start
```

Abre http://localhost:4200/login

Este directorio es el workspace Angular (`angular.json`). `ng serve` se corre aquí.
