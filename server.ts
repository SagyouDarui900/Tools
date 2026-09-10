import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Utility: SSRF Protection
  function isSafeUrl(urlString: string): boolean {
    try {
      const parsed = new URL(urlString);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      // Block localhost, private IPs, loopback, and cloud metadata
      if (
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname === "0.0.0.0" ||
        hostname === "169.254.169.254" ||
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // API 1: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API 2: Short URL Expander
  app.post("/api/expand-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "有効なURLを指定してください" });
      }

      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }

      if (!isSafeUrl(targetUrl)) {
        return res.status(400).json({ error: "無効または制限されたURLです" });
      }

      const chain: string[] = [];
      let currentUrl = targetUrl;
      let depth = 0;
      const maxRedirects = 10;

      while (depth < maxRedirects) {
        if (!isSafeUrl(currentUrl)) {
          break;
        }

        chain.push(currentUrl);

        try {
          // HEAD request first for fast redirect checking
          let response = await fetch(currentUrl, {
            method: "HEAD",
            redirect: "manual",
            signal: AbortSignal.timeout(6000),
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });

          // Fallback to GET if HEAD is forbidden or not allowed
          if (response.status === 405 || response.status === 403 || response.status === 501) {
            response = await fetch(currentUrl, {
              method: "GET",
              redirect: "manual",
              signal: AbortSignal.timeout(6000),
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
          }

          const location = response.headers.get("location");
          if (response.status >= 300 && response.status < 400 && location) {
            const nextUrl = new URL(location, currentUrl).href;
            if (chain.includes(nextUrl)) {
              // Prevent infinite redirect loop
              chain.push(nextUrl);
              break;
            }
            currentUrl = nextUrl;
            depth++;
          } else {
            break;
          }
        } catch (err) {
          break;
        }
      }

      return res.json({
        originalUrl: targetUrl,
        finalUrl: currentUrl,
        redirectCount: chain.length - 1,
        chain,
        status: "success",
      });
    } catch (error: any) {
      return res.status(500).json({ error: "短縮URLの解析に失敗しました: " + (error.message || "") });
    }
  });

  // API 3: Safe Image Proxy (for CORS-free downloads & canvas exports)
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const targetUrl = req.query.url;
      if (!targetUrl || typeof targetUrl !== "string") {
        return res.status(400).send("URL parameter is required");
      }

      if (!isSafeUrl(targetUrl)) {
        return res.status(400).send("Invalid or restricted URL");
      }

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch image");
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      if (!contentType.startsWith("image/")) {
        return res.status(400).send("Requested resource is not an image");
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(buffer);
    } catch (error: any) {
      return res.status(500).send("Error proxying image: " + error.message);
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
