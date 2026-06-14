import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router";
import App from "./App";
import { initGlobalLogging, logger } from "./lib/logger";
import "./i18n";
import "./index.css";

initGlobalLogging();
void logger.info("app.startup", "Passwall Desktop frontend started", {
  href: window.location.href,
  origin: window.location.origin,
  is_dev: import.meta.env.DEV,
  is_tauri_runtime:
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
