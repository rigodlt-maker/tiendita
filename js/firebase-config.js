// js/firebase-config.js
// Inicialización de Firebase (App + Firestore) vía CDN modular — sin build step.
// Import ESM directo desde gstatic, compatible con GitHub Pages tal cual.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Config del proyecto "tiendindi15"
const firebaseConfig = {
  apiKey: "AIzaSyBjQoyd1Sv-dEDzE2cOCfNt2si67tZ8ET8",
  authDomain: "tiendindi15.firebaseapp.com",
  projectId: "tiendindi15",
  storageBucket: "tiendindi15.firebasestorage.app",
  messagingSenderId: "444197066069",
  appId: "1:444197066069:web:76c1749e15130bcd79cbdc"
};

// Inicializar app y exportar la instancia de Firestore
// para que el resto de módulos (app.js, ventas.js, etc.) la importen.
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
