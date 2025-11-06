import dotenv from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";

// Load environment variables
dotenv.config();

const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  // For production, use specific origin instead of wildcard when credentials are included
  const origin = process.env.NODE_ENV === "production" 
    ? req.get('Origin') || '*'
    : '*';
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Remove credentials header to avoid CORS issues
  // res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Create the Express app and register routes
let cachedServer: Promise<any> | null = null;

async function createServer() {
  if (!cachedServer) {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Application error:", err);
      res.status(status).json({ message });
    });

    // Importantly, setup vite/static serving AFTER registering routes
    // so that API routes are handled before static file serving
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    cachedServer = Promise.resolve(server);
  }
  return cachedServer;
}

// Vercel serverless function handler
export default async function handler(req: Request, res: Response) {
  try {
    const server = await createServer();
    return app(req, res);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// For production server (Render)
if (process.env.NODE_ENV === "production") {
  (async () => {
    const server = await createServer();
    
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      // Use "0.0.0.0" for better compatibility across environments
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}

// For local development
if (process.env.NODE_ENV === "development") {
  (async () => {
    const server = await createServer();
    
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      // Use "0.0.0.0" for better compatibility across environments
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}