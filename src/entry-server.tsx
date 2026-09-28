// Build-time only: renders the page to static HTML (scripts/prerender.mjs), so
// crawlers and link previews get real content without running JavaScript.
// Every three.js section mounts client-side (MountWhenNear / idle), so none of
// it is touched here.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App";

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
