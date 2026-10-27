# SUMA Portal UX — propuesta

Prototipo visual del acceso y home del Portal SUMA (Aduana Nacional), alineado a la nueva arquitectura Angular (`@aduana/an-core`, menú parametrizado).

## Ver la maqueta

Abrir en el navegador:

```bash
# desde esta carpeta
xdg-open proposal/index.html
# o servir estático
npx --yes serve proposal -p 5173
```

Páginas:

| Archivo | Qué muestra |
|---|---|
| `proposal/index.html` | Landing / indexOce simplificado por perfil |
| `proposal/login.html` | Login tipo Keycloak + MFA (correo / WhatsApp / QR) → portal |
| `proposal/portal.html` | Shell: menú parametrizado + catálogo de módulos |

### Login MFA (demo)

1. Usuario + contraseña → Continuar  
2. Elegir **Correo**, **WhatsApp** o **QR**  
3. OTP demo: **`123456`** (o “Simular escaneo” en QR)

### Efecto Digital Network (tsParticles)

Usa [tsparticles](https://github.com/tsparticles/tsparticles) (bundle local en `assets/vendor/`).

```html
<script src="assets/vendor/tsparticles.bundle.min.js"></script>
<script src="assets/js/particles-bg.js"></script>
<div data-particles data-density="1.1" data-color="#c9a227"></div>
```

En Angular: `npm i tsparticles @tsparticles/angular` (o engine + slim).

## Orden y fluidez

- Recorrido fijo **1 Acceso → 2 Login → 3 Portal**.
- **Estándar app shell:** lateral = menú parametrizado; home = búsqueda + favoritos + recientes + lanzador.
- Ciclo operativo SUMA: **Operaciones → Padrón OCE → Pagos/servicios → Consultas**.
- Datos en `proposal/assets/js/menu-data.js` (mock alineado a operación AN; sustituir por `MenuService` real).

## Relación con Angular (esta carpeta `frontend/`)

- Plantilla oficial: `../sen-ng-demo` (`<an-app>`, `MenuService.downloadMenu`).
- El JSON de `proposal/assets/js/menu-data.js` imita `IFindMenuDto`.
- Implementación sugerida: página `HomeModules` dentro de un shell SSO/portal que ya use `an-core`, sin reemplazar el menú lateral parametrizado.

## Siguiente paso

Scaffold Angular 16 (mismo stack que `sen-ng-demo`) con rutas `acceso`, `login`, `home` y consumo real del menú.