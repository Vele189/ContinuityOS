import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Production HTML is prerendered (scripts/prerender.mjs), so attach to it; `vite dev` serves an empty root
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
