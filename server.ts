import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./src/server/api";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const PORT = 3000;

async function startServer() {
  // Vite middleware / Static Asset serving
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Executando em modo de DESENVOLVIMENTO local com Vite.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Executando em modo de PRODUÇÃO.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
