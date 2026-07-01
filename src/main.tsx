import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { migrateLegacyStorage } from "./lib/storage";
import "./index.css";

migrateLegacyStorage();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}