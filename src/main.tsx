import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { createWebProfileRepository, generateId } from "./platform/webProfileRepository";
import "./styles.css";

const repository = createWebProfileRepository();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App repository={repository} newId={generateId} />
  </StrictMode>,
);

if (import.meta.env.PROD) registerSW({ immediate: true });
