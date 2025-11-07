import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { serveApiDocs, serveApiDocsJson } from './middleware/docs';

// import { createClient } from "@supabase/supabase-js";

import authRoutes from "./routes/auth";
import invitationRoutes from "./routes/invitations";
import confirmationRoutes from "./routes/confirmations";
import debugRoutes from "./routes/debug";

interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_SECRET: string;
  API_DOMAIN: string;
}

const app = new Hono<{ Bindings: CloudflareEnv }>();

// Middleware
app.use(logger());
app.use(
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(prettyJSON());

// API Documentation routes
app.get('/docs', serveApiDocs)
app.get('/api-docs-json', serveApiDocsJson)

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/invitations", invitationRoutes);
app.route("/api/confirmations", confirmationRoutes);
app.route("/api/debug", debugRoutes);

export default app;
