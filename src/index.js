import "core-js/stable";
import "regenerator-runtime/runtime";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");

try {
  const root = createRoot(container);
  root.render(<App />);
} catch (e) {
  console.error(e);
}
