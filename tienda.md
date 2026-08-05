# 🍬 Tienda Indi — Bitácora del Proyecto

> **Versión:** v1.0
> **Última actualización:** Sesión 1 — Setup inicial
> **Stack:** JavaScript Vanilla (ES Modules) + Firebase Firestore + PWA + GitHub Pages

---

## 1. Modelo de negocio (resumen para no perder contexto entre sesiones)

Tienda de snacks/dulces dentro de una oficina. Ventaja competitiva: **conveniencia + micro-crédito ("fiado")**.
El capital del negocio se mueve en tres estados que el Dashboard debe mostrar siempre por separado:

1. **Capital Invertido**: dinero puesto en stock que aún no se ha recuperado en ventas.
2. **Capital Recuperado**: dinero ya cobrado (efectivo o deudas liquidadas), listo para reinvertir en reposición.
3. **Utilidad Generada**: la ganancia neta acumulada, separada del capital de reinversión.

El fiado es una venta con `estatus_pago: "Pendiente"` asociada a un compañero, que se liquida después sin alterar el histórico de precios/costos de esa venta.

---

## 2. Arquitectura de la Base de Datos (Firestore)

### Colección `productos`
| Campo | Tipo | Notas |
|---|---|---|
| `id_producto` | String (doc ID) | Código EAN o QR escaneado |
| `nombre` | String | |
| `costo_unitario_actual` | Number | Se recalcula en cada reposición (promedio ponderado) |
| `precio_venta` | Number | |
| `stock_actual` | Number | Se decrementa en cada venta, se incrementa en cada reposición |
| `alerta_stock` | Number | Umbral para aviso de stock bajo |

### Colección `companeros`
| Campo | Tipo | Notas |
|---|---|---|
| `id_companero` | String (doc ID) | |
| `nombre` | String | |
| `saldo_pendiente` | Number | Suma de ventas con estatus "Pendiente" |

### Colección `ventas`
| Campo | Tipo | Notas |
|---|---|---|
| `id_venta` | String (doc ID) | |
| `fecha_hora` | Timestamp | |
| `id_companero` | String \| null | `null` = pagado en efectivo |
| `estatus_pago` | String | `"Pagado"` \| `"Pendiente"` |
| `total_venta` | Number | |
| `utilidad_venta` | Number | `total_venta - Σ costo_historico` |
| `detalle_productos` | Array\<Object\> | `{ id_producto, cantidad, precio_historico, costo_historico }` — histórico congelado, inmune a cambios futuros de precio/costo |

### Colección `reposiciones`
| Campo | Tipo | Notas |
|---|---|---|
| `id_reposicion` | String (doc ID) | |
| `fecha` | Timestamp | |
| `id_producto` | String | |
| `costo_total_paquete` | Number | |
| `piezas_entrantes` | Number | |
| `nuevo_costo_unitario` | Number | Promedio ponderado contra stock/costo previo |

**Regla de integridad clave:** ninguna escritura en `ventas` o `reposiciones` debe mutar campos de ventas pasadas. Todo histórico vive dentro del documento de venta mismo (`detalle_productos`), nunca por referencia externa a `productos`.

---

## 3. Dependencias / Librerías

| Librería | Vía | Uso |
|---|---|---|
| Firebase (App + Firestore) v10 | CDN ESM (`gstatic.com/firebasejs`) | Base de datos en tiempo real, sin build step |
| html5-qrcode | CDN (`unpkg.com/html5-qrcode`) | Escaneo de cámara para EAN/QR (pendiente de integrar) |
| Google Fonts: Baloo 2 / Inter / Space Grotesk | CDN | Sistema tipográfico (ver Diseño) |
| Ninguna otra dependencia — JS Vanilla puro, sin frameworks ni bundler | — | Compatible 1:1 con GitHub Pages |

---

## 4. Sistema de diseño (fijado en v1.0, no cambiar sin razón)

- **Paleta:**
  - `--ink: #1B1B2F` (fondo oscuro / texto principal)
  - `--paper: #F5F7F2` (fondo claro)
  - `--mango: #FF8A3D` (acento primario — acción de venta)
  - `--fiado: #0EA5A0` (acento secundario — todo lo relacionado a crédito/deuda)
  - `--ok: #2FAE60` (pagado / positivo)
  - `--alerta: #E5484D` (deuda vencida / stock bajo)
- **Tipografía:** Display `Baloo 2` (rótulos, títulos — carácter "snack/dulce" redondeado), Body `Inter` (texto general), Numérica `Space Grotesk` (precios, saldos, dashboard — para que las cifras de dinero tengan identidad propia).
- **Layout:** app-shell mobile-first con **barra de navegación inferior** (convención de app nativa, pulgar-friendly) de 4 pestañas: Vender · Deudas · Reposición · Dashboard.
- **Elemento de firma:** el total del carrito vive en una "píldora" flotante ámbar sobre la barra inferior mientras se escanea, como un dulce/wrapper — se expande al pagar.

---

## 5. Funcionalidades completadas ✅

- [x] Estructura de carpetas del proyecto (`/css`, `/js`, `/icons`)
- [x] `index.html`: app-shell con navegación inferior de 4 vistas (Vender, Deudas, Reposición, Dashboard) y router simple por hash
- [x] Inicialización de Firebase (App + Firestore) vía ESM/CDN con la config del proyecto `tiendindi15`
- [x] `manifest.json` + registro de Service Worker básico (offline shell)
- [x] Sistema de diseño (tokens CSS) aplicado

## 6. To-Do (próximas sesiones) 📋

- [ ] Integrar `html5-qrcode`: lectura de cámara → búsqueda en `productos` → agregar a carrito
- [ ] Lógica de carrito en memoria + render dinámico
- [ ] Botones de cierre de venta: `[PAGADO EN EFECTIVO]` vs `[A LA CUENTA DE...]` (selector de `companeros`)
- [ ] Escritura transaccional en Firestore: crear `venta`, decrementar `stock_actual`, incrementar `saldo_pendiente` si aplica
- [ ] Vista de Deudas: listado por compañero, detalle expandible de productos/fecha, botón "Liquidar deuda" (batch update de ventas pendientes → "Pagado" + reset de `saldo_pendiente`)
- [ ] Módulo de Reposición: form de costo total + piezas → cálculo de costo promedio ponderado → update de `productos` + registro en `reposiciones`
- [ ] Dashboard: cálculo en tiempo real de Capital Invertido / Recuperado / Utilidad (queries agregadas sobre `ventas` y `reposiciones`)
- [ ] Alta de productos nuevos (cuando el escáner no encuentra el EAN)
- [ ] Alta/edición de compañeros
- [ ] Reglas de seguridad de Firestore (`firestore.rules`)
- [ ] Íconos PWA reales (192x192 / 512x512) — placeholders pendientes
- [ ] Manejo de estado de conexión (offline queue para ventas sin señal)

---

## 7. Instrucciones de despliegue y conexión a Firebase

### 7.1 Firebase Console
1. En [console.firebase.google.com](https://console.firebase.google.com), proyecto `tiendindi15` → **Build → Firestore Database → Crear base de datos** (modo producción, región cercana, ej. `us-central`).
2. Crear manualmente las 4 colecciones la primera vez (`productos`, `companeros`, `ventas`, `reposiciones`) o dejar que se creen solas al primer `setDoc`.
3. **Reglas de seguridad temporales para desarrollo** (Firestore → Reglas) — *ajustar antes de producción real*:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // ⚠️ solo para desarrollo interno
       }
     }
   }
   ```

### 7.2 GitHub Pages
1. Crear repositorio (ej. `tienda-indi`), subir todo el contenido de esta carpeta a la raíz (o a `/docs` si prefieres).
2. Repositorio → **Settings → Pages** → Source: rama `main`, carpeta `/ (root)` o `/docs` según donde subiste.
3. La URL quedará como `https://<tu-usuario>.github.io/tienda-indi/`.
4. **Importante:** la cámara (`getUserMedia`) solo funciona en **HTTPS** o `localhost` — GitHub Pages sirve en HTTPS por defecto, así que el escáner funcionará sin configuración extra.

### 7.3 Pruebas locales
- No se puede abrir `index.html` con doble clic (los módulos ES + la cámara requieren un servidor). Usar, por ejemplo:
  ```
  npx serve .
  ```
  o la extensión "Live Server" de VS Code, y entrar por `http://localhost:...`.

---

## 8. Config de Firebase en uso

Proyecto: **tiendindi15** — configuración ya integrada en `js/firebase-config.js` (ver archivo, no se repite aquí por seguridad de mantenimiento centralizado).
