// js/app.js
// Router simple por hash + arranque de la app.
// La lógica de cada módulo (venta, deudas, reposición, dashboard) se irá
// agregando en archivos propios (js/ventas.js, js/deudas.js, etc.) en
// próximas sesiones e importándose aquí.

import { db } from "./firebase-config.js";

const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll(".nav-btn");

function showView(name) {
  views.forEach(v => v.classList.toggle("active", v.dataset.view === name));
  navButtons.forEach(b => b.classList.toggle("active", b.dataset.view === name));
  window.location.hash = name;
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

// Restaurar vista desde el hash de la URL (o "vender" por default)
const initial = window.location.hash.replace("#", "") || "vender";
showView(initial);

// Registrar Service Worker (offline shell)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(err => {
      console.warn("No se pudo registrar el Service Worker:", err);
    });
  });
}

// Sanity check de conexión a Firestore (se reemplazará por listeners reales)
console.log("Firestore listo:", db.app.options.projectId);
