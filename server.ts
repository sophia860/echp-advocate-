import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { askNavigator, analyzeDocument, scanProvision, getNextSteps } from "./src/lib/gemini.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Proxy for Gemini AI API (keeps GEMINI_API_KEY server-side)
  app.post("/api/ai", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured on server" });
    }

    const { action, prompt, history, docContent, docType, appCase } = req.body;

    try {
      let result: string;
      switch (action) {
        case "askNavigator":
          result = await askNavigator(prompt ?? "", history ?? []);
          break;
        case "analyzeDocument":
          result = await analyzeDocument(docContent ?? "", docType ?? "");
          break;
        case "scanProvision":
          result = await scanProvision(docContent ?? "");
          break;
        case "getNextSteps":
          result = await getNextSteps(appCase ?? {});
          break;
        default:
          return res.status(400).json({ error: "Unknown AI action" });
      }
      res.json({ result });
    } catch (error) {
      console.error("AI proxy error:", error);
      res.status(500).json({ error: "AI request failed" });
    }
  });

  // Proxy for Encodian Flowr API
  app.post("/api/flowr/*", async (req, res) => {
    const endpoint = req.params[0];
    const apiKey = process.env.ENCODIAN_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Encodian API key not configured on server" });
    }

    try {
      const response = await fetch(`https://api.apps-encodian.com/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": apiKey,
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).send(errorText);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Server proxy error:", error);
      res.status(500).json({ error: "Failed to proxy request to Encodian" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
