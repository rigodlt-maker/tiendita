// js/companeros.js
// Alta inicial (seed) de compañeros y utilidades de lectura.
// El seed es idempotente: solo crea lo que falte, nunca pisa saldos existentes.

import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

export const NOMBRES_INICIALES = [
  "Eusebio", "Ángel", "Román", "Miguel", "Luis", "Cassandra", "José",
  "Alberto", "Edwin", "Saúl", "Eliseo", "Sergio", "Alejandra", "Aranza", "Salvador"
];

function slugify(nombre) {
  return nombre
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Crea en Firestore los compañeros que aún no existan.
 * Se puede llamar en cada arranque de la app sin riesgo: no duplica ni resetea saldos.
 */
export async function seedCompaneros() {
  const snap = await getDocs(collection(db, "companeros"));
  const existentes = new Set(snap.docs.map(d => d.id));

  const faltantes = NOMBRES_INICIALES
    .map(nombre => ({ id: slugify(nombre), nombre }))
    .filter(c => !existentes.has(c.id));

  await Promise.all(
    faltantes.map(c =>
      setDoc(doc(db, "companeros", c.id), {
        id_companero: c.id,
        nombre: c.nombre,
        saldo_pendiente: 0
      })
    )
  );

  if (faltantes.length) {
    console.log(`Compañeros creados: ${faltantes.map(c => c.nombre).join(", ")}`);
  }
}

/**
 * Suscripción en tiempo real a la lista de compañeros, ordenada por nombre.
 * callback recibe un array de { id, nombre, saldo_pendiente }.
 */
export function subscribeCompaneros(callback) {
  return onSnapshot(collection(db, "companeros"), (snap) => {
    const lista = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    callback(lista);
  });
}
