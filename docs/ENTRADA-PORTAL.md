# Entrada del Portal SUMA = Login Angular

A partir de ahora el portal de la Aduana **empieza en el login** de este proyecto (`suma-portal-ux`), no en `indexOce` / `indexLogin` del SSO.

## Flujo

```
Usuario abre el portal
        │
        ▼
   /login          ← puerta única (operadores y técnicos)
        │
        ├─ Accesos de operadores → /login/registro (1·3·4 con canal, 2 MFA, 5 Charter)
        ├─ Olvidé clave          → /login/olvidar-clave
        └─ Login OK              → /portal (menú)
```

Backend: sigue siendo **b-sso** (`sso/backEnd`). Solo cambia el front.

## En este repo (ya cableado)

| Pieza | Comportamiento |
|---|---|
| `app-routing` | `''` y `**` → `login` |
| Guard / logout | vuelven a `/login` |
| `nginx.conf` | `/` → `302 /login`; SPA `try_files` → `index.html` |
| Local | `npm start` → http://localhost:4200/login |

## Qué cambiar fuera de este repo (corte real)

1. **Link “Ingresar a SUMA / Portal”** (web Aduana, intranet, favoritos)  
   De: `…/sso/indexOce.html` o `…/sso/indexLogin.html`  
   A: URL de este front, p. ej. `https://suma-dev.aduana.gob.bo/` o la ruta donde se despliegue el Angular  
   (debe resolver a `/login`).

2. **Nginx / gateway del ambiente**  
   Publicar este contenedor/build y, si hace falta, redirect:
   ```nginx
   location = /sso/indexOce.html { return 302 /login; }
   location = /sso/indexLogin.html { return 302 /login; }
   ```

3. **Correos (después)**  
   `aplicacion.url` / `ChangePassword.java` para que el link de reset abra  
   `/login/reset/{user}/{token}/portal` en este front.

## Orden sugerido

1. Probar local: `http://localhost:4200` → cae en `/login`.  
2. Desplegar Angular en DESA.  
3. Cambiar el link de entrada del portal Aduana a esa URL.  
4. Luego mails de reset/activación.
