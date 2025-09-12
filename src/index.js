// 1) Полифиллы для старых WebView (Android/iOS)
import "core-js/stable";
import "regenerator-runtime/runtime";

// 2) Базовый React 18 + строгая ловушка ошибок при монтировании
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// маленькая плашка-логгер поверх, чтобы видеть статус прямо в TWA
function logOverlay(msg, color = "#0f0") {
  let box = document.getElementById("__diag_box__");
  if (!box) {
    box = document.createElement("div");
    box.id = "__diag_box__";
    box.style.cssText =
      "position:fixed;left:8px;top:8px;z-index:999999;background:#111;color:#0f0;padding:6px 8px;font:12px/1.2 monospace;border-radius:6px;max-width:90vw;word-break:break-word";
    document.body.appendChild(box);
  }
  box.style.color = color;
  box.textContent = msg;
}

window.addEventListener("error", (e) => {
  logOverlay("JS error: " + (e.message || e), "#ff6");
});
window.addEventListener("unhandledrejection", (e) => {
  logOverlay(
    "Promise reject: " + (e.reason && (e.reason.message || e.reason)),
    "#ff6"
  );
});

const container = document.getElementById("root");

try {
  const root = createRoot(container);
  root.render(<App />);
  logOverlay("React mounted OK", "#0f0"); // УВИДИМ ЭТО — значит монтирование прошло
} catch (e) {
  logOverlay("Mount error: " + (e?.message || e), "#f66");
  throw e;
}
