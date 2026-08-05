// js/productos.js
// Lectura de productos por código escaneado + alta rápida cuando el
// código no existe todavía en el catálogo.

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

/** Busca un producto por su id (código EAN/QR). Devuelve null si no existe. */
export async function getProducto(idProducto) {
  const ref = doc(db, "productos", idProducto);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Alta rápida de un producto nuevo detectado por el escáner.
 * (Alta completa / edición posterior queda pendiente para el módulo de Reposición.)
 */
export async function crearProductoRapido(idProducto, { nombre, costo_unitario_actual, precio_venta, stock_actual, alerta_stock }) {
  const ref = doc(db, "productos", idProducto);
  const data = {
    id_producto: idProducto,
    nombre,
    costo_unitario_actual: Number(costo_unitario_actual) || 0,
    precio_venta: Number(precio_venta) || 0,
    stock_actual: Number(stock_actual) || 0,
    alerta_stock: Number(alerta_stock) || 5
  };
  await setDoc(ref, data);
  return { id: idProducto, ...data };
}
