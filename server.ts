import { resolve, normalize, join } from "path";

// --- Constants & Types ---

const PORT = 4455;
const DATA_FILE = "./data.json";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const VALID_DISPLAY_MODES = ["both", "rotate", "revenue", "costs", "counter"] as const;

type DisplayMode = (typeof VALID_DISPLAY_MODES)[number];

interface AppData {
  costTotal: number;
  costBudgetCap: number;
  displayMode: DisplayMode;
  rotationInterval: number;
  revenueGoal: number;
}

const DEFAULT_DATA: AppData = {
  costTotal: 0,
  costBudgetCap: 100,
  displayMode: "both",
  rotationInterval: 10,
  revenueGoal: 100,
};

let data: AppData;
let currentRevenue = 0; // placeholder for Phase 3 (Stripe)

// --- Data Helpers ---

async function loadData(): Promise<AppData> {
  const file = Bun.file(DATA_FILE);
  if (await file.exists()) {
    return (await file.json()) as AppData;
  }
  await saveData(DEFAULT_DATA);
  return { ...DEFAULT_DATA };
}

async function saveData(d: AppData): Promise<void> {
  await Bun.write(DATA_FILE, JSON.stringify(d, null, 2));
}

// --- Response Helpers ---

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// --- Static File Serving ---

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const PUBLIC_DIR = resolve("public");

async function serveStatic(filePath: string): Promise<Response> {
  const resolved = resolve(join("public", filePath));
  if (!resolved.startsWith(PUBLIC_DIR)) {
    return errorResponse("Forbidden", 403);
  }

  const file = Bun.file(resolved);
  if (!(await file.exists())) {
    return errorResponse("Not found", 404);
  }

  const ext = filePath.substring(filePath.lastIndexOf("."));
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return new Response(file, {
    headers: { "Content-Type": contentType },
  });
}

// --- Validation ---

function validateConfig(
  body: Record<string, unknown>
): { error: string } | { value: Partial<AppData> & { password: string } } {
  if (typeof body.password !== "string" || body.password.length === 0) {
    return { error: "password is required" };
  }

  const result: Partial<AppData> & { password: string } = {
    password: body.password,
  };

  if ("costTotal" in body) {
    if (typeof body.costTotal !== "number" || !isFinite(body.costTotal) || body.costTotal < 0) {
      return { error: "costTotal must be a finite number >= 0" };
    }
    result.costTotal = body.costTotal;
  }

  if ("costBudgetCap" in body) {
    if (typeof body.costBudgetCap !== "number" || !isFinite(body.costBudgetCap) || body.costBudgetCap <= 0) {
      return { error: "costBudgetCap must be a finite number > 0" };
    }
    result.costBudgetCap = body.costBudgetCap;
  }

  if ("displayMode" in body) {
    if (!VALID_DISPLAY_MODES.includes(body.displayMode as DisplayMode)) {
      return { error: `displayMode must be one of: ${VALID_DISPLAY_MODES.join(", ")}` };
    }
    result.displayMode = body.displayMode as DisplayMode;
  }

  if ("rotationInterval" in body) {
    if (typeof body.rotationInterval !== "number" || !isFinite(body.rotationInterval) || body.rotationInterval < 1) {
      return { error: "rotationInterval must be a finite number >= 1" };
    }
    result.rotationInterval = body.rotationInterval;
  }

  if ("revenueGoal" in body) {
    if (typeof body.revenueGoal !== "number" || !isFinite(body.revenueGoal) || body.revenueGoal <= 0) {
      return { error: "revenueGoal must be a finite number > 0" };
    }
    result.revenueGoal = body.revenueGoal;
  }

  return { value: result };
}

// --- Server ---

data = await loadData();

if (!ADMIN_PASSWORD) {
  console.warn("WARNING: ADMIN_PASSWORD is not set. POST /api/config will reject all requests.");
}

const server = Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",

  async fetch(req) {
    const url = new URL(req.url);
    const path = normalize(url.pathname);

    // GET /overlay
    if (req.method === "GET" && path === "/overlay") {
      return serveStatic("overlay.html");
    }

    // GET /admin
    if (req.method === "GET" && path === "/admin") {
      return serveStatic("admin.html");
    }

    // GET /api/stats
    if (req.method === "GET" && path === "/api/stats") {
      return jsonResponse({
        revenue: currentRevenue,
        revenueGoal: data.revenueGoal,
        costTotal: data.costTotal,
        costBudgetCap: data.costBudgetCap,
        displayMode: data.displayMode,
        rotationInterval: data.rotationInterval,
      });
    }

    // POST /api/config
    if (req.method === "POST" && path === "/api/config") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return errorResponse("Invalid JSON body");
      }

      const validated = validateConfig(body);
      if ("error" in validated) {
        return errorResponse(validated.error);
      }

      const { password, ...updates } = validated.value;

      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return errorResponse("Unauthorized", 401);
      }

      Object.assign(data, updates);
      await saveData(data);

      return jsonResponse({ ok: true, data });
    }

    // Static files from public/
    if (req.method === "GET" && !path.startsWith("/api/")) {
      return serveStatic(path);
    }

    return errorResponse("Not found", 404);
  },
});

console.log(`Server running at http://127.0.0.1:${server.port}`);
