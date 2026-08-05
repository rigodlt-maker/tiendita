// js/ventas.js
// Estado del carrito en memoria + cierre de venta transaccional en Firestore.
//
// Al cerrar una venta se escriben en un solo batch atómico:
//   1) el documento en `ventas` (con detalle_productos histórico congelado)
//   2) el decremento de stock_actual de cada producto vendido
//   3) si es fiado: el incremento de saldo_pendiente del compañero

import { db } from "./firebase-config.js";
import {
  collection, doc, writeBatch, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

let cart = [];
const listeners = new Set();

function notify() {
  listeners.forEach(cb => cb(cart));
}

/** Se suscribe a cambios del carrito. Devuelve función para desuscribirse. */
export function subscribeCart(callback) {
  listeners.add(callback);
  callback(cart);
  return () => listeners.delete(callback);
}

/** Agrega un producto (o suma 1 si ya está) respetando el stock disponible. */
export function addToCart(producto) {
  const enCarrito = cart.find(i => i.id === producto.id);
  const cantidadActual = enCarrito ? enCarrito.cantidad : 0;

  if (cantidadActual + 1 > producto.stock_actual) {
    return { ok: false, motivo: "sin_stock" };
  }

  if (enCarrito) {
    enCarrito.cantidad += 1;
  } else {
    cart.push({
      id: producto.id,
      nombre: producto.nombre,
      precio_venta: producto.precio_venta,
      costo_unitario_actual: producto.costo_unitario_actual,
      stock_actual: producto.stock_actual,
      cantidad: 1
    });
  }
  notify();
  return { ok: true };
}

export function cambiarCantidad(idProducto, delta) {
  const item = cart.find(i => i.id === idProducto);
  if (!item) return;
  const nueva = item.cantidad + delta;
  if (nueva <= 0) {
    cart = cart.filter(i => i.id !== idProducto);
  } else if (nueva <= item.stock_actual) {
    item.cantidad = nueva;
  }
  notify();
}

export function limpiarCarrito() {
  cart = [];
  notify();
}

export function totalCarrito() {
  return cart.reduce((sum, i) => sum + i.precio_venta * i.cantidad, 0);
}

function utilidadCarrito() {
  return cart.reduce((sum, i) => sum + (i.precio_venta - i.costo_unitario_actual) * i.cantidad, 0);
}

export function carritoVacio() {
  return cart.length === 0;
}

/**
 * Cierra la venta actual.
 * @param {{tipo: 'efectivo'|'fiado', companeroId?: string}} opciones
 */
export async function cerrarVenta({ tipo, companeroId }) {
  if (carritoVacio()) throw new Error("El carrito está vacío.");
  if (tipo === "fiado" && !companeroId) throw new Error("Falta seleccionar compañero.");

  const batch = writeBatch(db);

  const detalle_productos = cart.map(i => ({
    id_producto: i.id,
    cantidad: i.cantidad,
    precio_historico: i.precio_venta,
    costo_historico: i.costo_unitario_actual
  }));

  const total_venta = totalCarrito();
  const utilidad_venta = utilidadCarrito();

  const ventaRef = doc(collection(db, "ventas"));
  batch.set(ventaRef, {
    id_venta: ventaRef.id,
    fecha_hora: serverTimestamp(),
    id_companero: tipo === "fiado" ? companeroId : null,
    estatus_pago: tipo === "fiado" ? "Pendiente" : "Pagado",
    total_venta,
    utilidad_venta,
    detalle_productos
  });

  // Decrementar stock de cada producto vendido
  cart.forEach(i => {
    const prodRef = doc(db, "productos", i.id);
    batch.update(prodRef, { stock_actual: increment(-i.cantidad) });
  });

  // Si fue fiado, sumar al saldo del compañero
  if (tipo === "fiado") {
    const companeroRef = doc(db, "companeros", companeroId);
    batch.update(companeroRef, { saldo_pendiente: increment(total_venta) });
  }

  await batch.commit();
  limpiarCarrito();
  return { id: ventaRef.id, total_venta };
}
