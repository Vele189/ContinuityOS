// Injects the server-rendered page into dist/index.html. Runs after both
// `vite build` (client) and `vite build --ssr` (dist-ssr/entry-server.js).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "dist/index.html");
const { render } = await import(pathToFileURL(path.join(root, "dist-ssr/entry-server.js")).href);

const html = fs.readFileSync(indexPath, "utf8");
const marker = '<div id="root"></div>';
if (!html.includes(marker)) throw new Error(`prerender: ${marker} not found in dist/index.html`);

const app = render();
fs.writeFileSync(indexPath, html.replace(marker, `<div id="root">${app}</div>`));
fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`prerender: injected ${(app.length / 1024).toFixed(1)} kB of HTML into dist/index.html`);
