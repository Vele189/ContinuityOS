import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/** Serves api/*.ts handlers during `vite dev` so the contact form works locally. */
function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      // Make .env values (e.g. RESEND_API_KEY) visible to the handler as process.env, like on Vercel
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const [key, value] of Object.entries(env)) process.env[key] ??= value;

      server.middlewares.use("/api/contact", async (req, res) => {
        const { POST } = await server.ssrLoadModule("/api/contact.ts");
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const response: Response = await POST(
          new Request(`http://localhost${req.originalUrl}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks),
          }),
        );
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    // One copy of each, or R3F hooks lose the Canvas context.
    dedupe: ["react", "react-dom", "three", "@react-three/fiber"],
  },
  optimizeDeps: {
    include: ["@react-three/fiber", "@react-three/drei", "@react-three/postprocessing", "postprocessing", "three", "@shadergradient/react", "simplex-noise", "maath"],
  },
});
