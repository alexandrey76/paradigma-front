import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "core-js/stable";
import "regenerator-runtime/runtime";


const container = document.getElementById("root");

try {
  createRoot(container).render(<App />);
} catch (e) {
  // дубль-страховка: если упало на старом движке
  const el = document.createElement('pre');
  el.style.cssText = "color:#f66;padding:10px;font:12px monospace";
  el.textContent = 'Mount error: ' + (e && e.message ? e.message : e);
  document.body.appendChild(el);
  throw e;
}
