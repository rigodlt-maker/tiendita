# 🍬 Tienda Indi — Bitácora del Proyecto

> **Versión:** v1.1
> **Última actualización:** Sesión 2 — Módulo Vender (escáner + carrito + cierre de venta)
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
| Firebase (App + Firestore) v10.13.2 | CDN ESM (`gstatic.com/firebasejs`) | Base de datos en tiempo real, sin build step |
| html5-qrcode v2.3.8 | CDN (`unpkg.com/html5-qrcode`) — script clásico, expone `window.Html5Qrcode` | Escaneo de cámara para EAN-13/8, UPC-A/E, CODE128 y QR |
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
- [x] Íconos PWA reales (192×192 / 512×512), generados con la identidad de marca (moneda + signo de pesos)
- [x] **Alta inicial de compañeros** (`js/companeros.js`): seed idempotente de los 15 nombres reales al arrancar la app, sin pisar saldos existentes
- [x] **Escáner de cámara** (`js/scanner.js`): wrapper de `html5-qrcode`, soporta EAN-13/8, UPC-A/E, CODE128 y QR, con debounce para no duplicar lecturas
- [x] **Carrito de venta** (`js/ventas.js`): agregar/quitar productos, validación de stock disponible, cálculo de total y utilidad
- [x] **Alta rápida de producto** (`js/productos.js` + modal): si el código escaneado no existe en `productos`, se pide nombre/costo/precio/stock inicial y se crea al vuelo
- [x] **Cierre de venta** (checkout): botones `[PAGADO EN EFECTIVO]` y `[A LA CUENTA DE...]` con selector de compañero (muestra su saldo actual como referencia)
- [x] **Escritura transaccional en Firestore**: `writeBatch` que en una sola operación atómica crea la `venta` (con `detalle_productos` histórico), decrementa `stock_actual` de cada producto y, si es fiado, incrementa `saldo_pendiente` del compañero
- [x] UI de módulo Vender completa: botón de escaneo, lector embebido, lista de carrito con +/-, píldora flotante de total, toasts de feedback

## 6. To-Do (próximas sesiones) 📋

- [ ] Vista de Deudas: listado por compañero, detalle expandible de productos/fecha, botón "Liquidar deuda" (batch update de ventas pendientes → "Pagado" + reset de `saldo_pendiente`)
- [ ] Módulo de Reposición: form de costo total + piezas → cálculo de costo promedio ponderado → update de `productos` + registro en `reposiciones`
- [ ] Dashboard: cálculo en tiempo real de Capital Invertido / Recuperado / Utilidad (queries agregadas sobre `ventas` y `reposiciones`)
- [ ] Alta/edición manual de compañeros (por ahora solo vía seed inicial)
- [ ] Edición de productos existentes desde una vista de catálogo (hoy solo se crean por alta rápida al escanear)
- [ ] Reglas de seguridad de Firestore (`firestore.rules`) — hoy están abiertas para desarrollo
- [ ] Manejo de estado de conexión (offline queue para ventas sin señal — Firestore ya cachea lecturas, falta UX de "venta pendiente de sincronizar")
- [ ] Alerta visual de stock bajo (`alerta_stock`) en el catálogo

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

### 7.3 Estructura de archivos (nota de nombres)
La app "real" vive en **`tienda.html`** (no `index.html`), para que sea fácil de distinguir de otras apps en tu editor/pestañas. Se dejó un `index.html` mínimo en la raíz que solo redirige a `tienda.html`, porque GitHub Pages siempre busca `index.html` como punto de entrada del dominio. Resultado: entras a la URL raíz normal y caes en `tienda.html` automáticamente — no necesitas escribir el nombre completo.

### 7.4 Pruebas locales
- No se puede abrir `index.html` con doble clic (los módulos ES + la cámara requieren un servidor). Usar, por ejemplo:
  ```
  npx serve .
  ```
  o la extensión "Live Server" de VS Code, y entrar por `http://localhost:...`.

---

## 8. Config de Firebase en uso

Proyecto: **tiendindi15** — configuración ya integrada en `js/firebase-config.js` (ver archivo, no se repite aquí por seguridad de mantenimiento centralizado).
