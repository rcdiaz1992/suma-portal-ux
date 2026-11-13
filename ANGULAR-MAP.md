# De la maqueta HTML → Angular (`sen-ng-demo` / `@aduana/an-core`)

**Alcance unificado (SSO + OCE + shell):** ver [`docs/PORTAL-UNIFICADO.md`](docs/PORTAL-UNIFICADO.md) y la regla Cursor `.cursor/rules/portal-unificado.mdc`.

Stack objetivo del monorepo: **Angular 16** + **an-core** + menú vía `MenuService.downloadMenu` (fuente real: API SSO; mock local mientras tanto).

## Shell del portal (equivalente a `portal.html`)

```html
<an-app title="Portal SUMA" [disableFluid]="false" [version]="_appVersion">
  <app-toolbar-option></app-toolbar-option>
  <an-notificacion></an-notificacion>
  <an-menu menu></an-menu>
  <router-outlet></router-outlet>
</an-app>
```

En `app.component.ts` (como en `sen-ng-demo`):

```ts
this.menuService.downloadMenu(usuarioId, 'SUMA_PORTAL');
```

El JSON del menú del prototipo (`proposal/assets/js/portal-data.js` → `menu`) es el contrato visual; el backend/SSO sigue entregando `IFindMenuDto[]`.

## Home de módulos

Nueva ruta `''` → `PortalHomeComponent`:

- Lista de módulos desde API (o mock).
- Filtro por texto + grupo + favoritos (localStorage / API).
- Cada módulo navega a la URL del microfrontend o ruta Angular correspondiente.

Plantilla conceptual:

```html
<an-page>
  <an-page-header title="Mis módulos"></an-page-header>
  <an-page-content title="Catálogo">
    <!-- buscador + chips de filtro -->
    <!-- grid de módulos (sin cards pesadas: borde sutil + hover) -->
  </an-page-content>
</an-page>
```

## Acceso (`indexOce`)

Puede quedar como:

1. **Página Angular pública** (sin Keycloak) con los 4 caminos, o  
2. **HTML estático** servido por nginx delante del SSO, enlazando a Keycloak / `indexLogin`.

La maqueta `proposal/index.html` define la IA de información; el estilo se porta a SCSS del tema Modernize con las variables `--an-*` del CSS de la propuesta.

## Próximo paso de implementación

1. ✅ App Angular en la raíz de este repo (clon de `sen-ng-demo`).
2. ✅ Login `/login` + hub registro `/login/registro` (5 accesos, mismo diseño).
3. Copiar tokens de `proposal/assets/css/portal.css` a `styles.scss` / overrides.
4. Implementar shell `an-app` + `PortalHomeComponent` y cablear `MenuService`.
5. Auth híbrido (ver `docs/AUTH-HIBRIDO.md`): **Keycloak** (como SIAN/SIGRAT) **+** seguir generando el **token SUMA** de `b-sso` para lo que aún depende de él.
6. Conectar `SsoAuthService` / puente post-Keycloak a `autenticar-captcha/portal` o endpoint de canje (`useMockAuth: false`).
