# De la maqueta HTML → Angular (`sen-ng-demo` / `@aduana/an-core`)

Stack objetivo del monorepo: **Angular 16** + **an-core** + menú vía `MenuService.downloadMenu`.

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

1. Generar app con `@aduana/cli` o clonar `sen-ng-demo` como `suma-portal-shell`.  
2. Copiar tokens de `proposal/assets/css/portal.css` a `styles.scss` / overrides.  
3. Implementar `PortalHomeComponent` y cablear `MenuService`.  
4. Mantener Keycloak para login (la maqueta `login.html` es solo referencia visual).
