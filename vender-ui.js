// js/vender-ui.js
// Conecta scanner.js + productos.js + ventas.js con el DOM de la vista "Vender".

import { getProducto, crearProductoRapido } from "./productos.js";
import { subscribeCart, addToCart, cambiarCantidad, totalCarrito, cerrarVenta, carritoVacio } from "./ventas.js";
import { iniciarEscaner, detenerEscaner, escanerActivo } from "./scanner.js";
import { subscribeCompaneros } from "./companeros.js";

const $ = (sel) => document.querySelector(sel);

let companerosCache = [];

function fmt(n) {
  return `$${Number(n).toFixed(2)}`;
}

function toast(msg, tipo = "ok") {
  const el = document.createElement("div");
  el.className = `toast toast-${tipo}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 2200);
}

/* ---------- Render del carrito ---------- */
function renderCart(cart) {
  const list = $("#cartList");
  const pill = $("#cartPill");
  const pillTotal = $("#cartTotal");
  const emptyMsg = $("#cartEmpty");

  list.innerHTML = "";

  if (cart.length === 0) {
    emptyMsg.style.display = "block";
    pill.classList.remove("show");
    return;
  }
  emptyMsg.style.display = "none";

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-row-info">
        <div class="cart-row-nombre">${item.nombre}</div>
        <div class="cart-row-precio num">${fmt(item.precio_venta)} c/u</div>
      </div>
      <div class="qty-control">
        <button data-action="menos" data-id="${item.id}" aria-label="Quitar uno">−</button>
        <span class="num">${item.cantidad}</span>
        <button data-action="mas" data-id="${item.id}" aria-label="Agregar uno">+</button>
      </div>
      <div class="cart-row-subtotal num">${fmt(item.precio_venta * item.cantidad)}</div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const delta = btn.dataset.action === "mas" ? 1 : -1;
      cambiarCantidad(btn.dataset.id, delta);
    });
  });

  pillTotal.textContent = fmt(totalCarrito());
  pill.classList.add("show");
}

/* ---------- Alta rápida de producto no encontrado ---------- */
function pedirAltaRapida(codigo) {
  return new Promise((resolve) => {
    const modal = $("#modalAlta");
    modal.classList.add("show");
    $("#altaCodigo").textContent = codigo;
    const form = $("#formAlta");

    function limpiar() {
      modal.classList.remove("show");
      form.removeEventListener("submit", onSubmit);
      $("#btnCancelarAlta").removeEventListener("click", onCancel);
    }
    function onSubmit(e) {
      e.preventDefault();
      const datos = {
        nombre: $("#altaNombre").value.trim(),
        costo_unitario_actual: $("#altaCosto").value,
        precio_venta: $("#altaPrecio").value,
        stock_actual: $("#altaStock").value,
        alerta_stock: 5
      };
      limpiar();
      resolve(datos);
    }
    function onCancel() {
      limpiar();
      resolve(null);
    }
    form.addEventListener("submit", onSubmit);
    $("#btnCancelarAlta").addEventListener("click", onCancel);
  });
}

/* ---------- Manejo de un código escaneado ---------- */
async function manejarCodigo(codigo) {
  let producto = await getProducto(codigo);

  if (!producto) {
    const datos = await pedirAltaRapida(codigo);
    if (!datos) return; // el usuario canceló el alta
    if (!datos.nombre) {
      toast("El producto necesita un nombre.", "alerta");
      return;
    }
    producto = await crearProductoRapido(codigo, datos);
    toast(`"${producto.nombre}" agregado al catálogo`, "ok");
  }

  if (producto.stock_actual <= 0) {
    toast(`Sin stock de "${producto.nombre}"`, "alerta");
    return;
  }

  const res = addToCart(producto);
  if (!res.ok) {
    toast("No hay más stock disponible", "alerta");
  } else {
    toast(`+ ${producto.nombre}`, "ok");
  }
}

/* ---------- Escáner ---------- */
async function toggleEscaner() {
  const btn = $("#btnEscanear");
  const contenedor = $("#readerBox");

  if (escanerActivo()) {
    await detenerEscaner();
    contenedor.classList.remove("show");
    btn.textContent = "📷 Escanear producto";
    return;
  }

  contenedor.classList.add("show");
  btn.textContent = "⏹ Detener cámara";
  try {
    await iniciarEscaner("readerBox", manejarCodigo);
  } catch (err) {
    toast("No se pudo acceder a la cámara. Revisa permisos.", "alerta");
    contenedor.classList.remove("show");
    btn.textContent = "📷 Escanear producto";
    console.error(err);
  }
}

/* ---------- Checkout ---------- */
function abrirCheckout() {
  if (carritoVacio()) {
    toast("El carrito está vacío", "alerta");
    return;
  }
  $("#checkoutTotal").textContent = fmt(totalCarrito());
  $("#modalCheckout").classList.add("show");
  $("#selectorCompanero").classList.remove("show");
}

function cerrarCheckout() {
  $("#modalCheckout").classList.remove("show");
}

function renderSelectorCompaneros() {
  const cont = $("#listaCompaneros");
  cont.innerHTML = "";
  companerosCache.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "companero-btn";
    btn.innerHTML = `<span>${c.nombre}</span>${
      c.saldo_pendiente > 0 ? `<span class="num saldo-chip">${fmt(c.saldo_pendiente)}</span>` : ""
    }`;
    btn.addEventListener("click", () => confirmarCierre("fiado", c.id));
    cont.appendChild(btn);
  });
}

async function confirmarCierre(tipo, companeroId) {
  try {
    const res = await cerrarVenta({ tipo, companeroId });
    cerrarCheckout();
    toast(`Venta cerrada — ${fmt(res.total_venta)}`, "ok");
  } catch (err) {
    toast(err.message || "Error al cerrar la venta", "alerta");
    console.error(err);
  }
}

/* ---------- Inicialización del módulo ---------- */
export function initVenderUI() {
  subscribeCart(renderCart);
  subscribeCompaneros(lista => { companerosCache = lista; });

  $("#btnEscanear").addEventListener("click", toggleEscaner);
  $("#cartPill").addEventListener("click", abrirCheckout);
  $("#btnAbrirCheckout").addEventListener("click", abrirCheckout);
  $("#btnCerrarCheckout").addEventListener("click", cerrarCheckout);

  $("#btnPagadoEfectivo").addEventListener("click", () => confirmarCierre("efectivo"));
  $("#btnALaCuenta").addEventListener("click", () => {
    renderSelectorCompaneros();
    $("#selectorCompanero").classList.add("show");
  });
}
