import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { askNavigator, analyzeDocument, scanProvision, getNextSteps } from "./src/lib/gemini.js";
import { runSwarm } from "./src/lib/agents/orchestrator.js";

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

    const { action, prompt, history, docContent, docType, appCase, task, context, priorLessons } = req.body;

    try {
      // The runSwarm action returns a structured payload (result + trace +
      // usage), not a single string, so it short-circuits the switch below.
      if (action === "runSwarm") {
        if (typeof task !== "string" || !task.trim()) {
          return res.status(400).json({ error: "runSwarm requires a non-empty task string" });
        }
        if (context !== undefined && typeof context !== "string") {
          return res.status(400).json({ error: "runSwarm context must be a string when provided" });
        }
        if (priorLessons !== undefined && !Array.isArray(priorLessons)) {
          return res.status(400).json({ error: "runSwarm priorLessons must be an array when provided" });
        }
        const swarm = await runSwarm(task, {
          context: typeof context === "string" ? context : undefined,
          priorLessons: Array.isArray(priorLessons)
            ? priorLessons.filter((l: unknown): l is string => typeof l === "string")
            : undefined,
        });
        return res.json(swarm);
      }

      let result: string;
      switch (action) {
        case "askNavigator":
          if (typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({ error: "askNavigator requires a non-empty prompt string" });
          }
          result = await askNavigator(prompt, Array.isArray(history) ? history : []);
          break;
        case "analyzeDocument":
          if (typeof docContent !== "string" || !docContent.trim()) {
            return res.status(400).json({ error: "analyzeDocument requires a non-empty docContent string" });
          }
          if (typeof docType !== "string" || !docType.trim()) {
            return res.status(400).json({ error: "analyzeDocument requires a non-empty docType string" });
          }
          result = await analyzeDocument(docContent, docType);
          break;
        case "scanProvision":
          if (typeof docContent !== "string" || !docContent.trim()) {
            return res.status(400).json({ error: "scanProvision requires a non-empty docContent string" });
          }
          result = await scanProvision(docContent);
          break;
        case "getNextSteps":
          if (!appCase || typeof appCase !== "object") {
            return res.status(400).json({ error: "getNextSteps requires an appCase object" });
          }
          result = await getNextSteps(appCase);
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
