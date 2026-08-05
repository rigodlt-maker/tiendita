// js/scanner.js
// Wrapper delgado sobre la librería global Html5Qrcode (cargada por CDN
// como script clásico en index.html, por eso se referencia como window.Html5Qrcode).

let instancia = null;
let activo = false;

/**
 * Arranca la cámara dentro del elemento con id `elementId` y llama a
 * onDecode(textoDecodificado) cada vez que detecta un código.
 * Ignora lecturas repetidas dentro de `debounceMs` para no duplicar
 * un mismo producto por frames consecutivos.
 */
export async function iniciarEscaner(elementId, onDecode, debounceMs = 1200) {
  if (activo) return;
  if (!window.Html5Qrcode) {
    throw new Error("html5-qrcode no está cargado (revisa el <script> en index.html)");
  }

  instancia = new window.Html5Qrcode(elementId, /* verbose= */ false);
  let ultimo = { texto: null, ts: 0 };

  const config = {
    fps: 12,
    qrbox: { width: 240, height: 160 },
    // EAN/UPC (barras) + QR — cubre tanto dulces empaquetados como QR propios.
    formatsToSupport: window.Html5QrcodeSupportedFormats
      ? [
          window.Html5QrcodeSupportedFormats.QR_CODE,
          window.Html5QrcodeSupportedFormats.EAN_13,
          window.Html5QrcodeSupportedFormats.EAN_8,
          window.Html5QrcodeSupportedFormats.UPC_A,
          window.Html5QrcodeSupportedFormats.UPC_E,
          window.Html5QrcodeSupportedFormats.CODE_128
        ]
      : undefined
  };

  await instancia.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      const ahora = Date.now();
      if (decodedText === ultimo.texto && ahora - ultimo.ts < debounceMs) return;
      ultimo = { texto: decodedText, ts: ahora };
      onDecode(decodedText);
    },
    () => { /* frame sin detección: no hacer nada, es normal y muy frecuente */ }
  );

  activo = true;
}

export async function detenerEscaner() {
  if (!activo || !instancia) return;
  try {
    await instancia.stop();
    await instancia.clear();
  } catch (e) {
    console.warn("Error al detener el escáner:", e);
  } finally {
    activo = false;
    instancia = null;
  }
}

export function escanerActivo() {
  return activo;
}
