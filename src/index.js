import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const tg = window?.Telegram?.WebApp;
if (tg && tg.ready) tg.ready();

const root = createRoot(document.getElementById("root"));

createRoot(document.getElementById("root")).render(<App />);
