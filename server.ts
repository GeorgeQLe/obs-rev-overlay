import { resolve, normalize, join } from "path";
import Stripe from "stripe";

// --- Constants & Types ---

const PORT = 4455;
const DATA_FILE = "./data.json";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_POLL_INTERVAL = 30_000;
const VALID_DISPLAY_MODES = ["both", "rotate", "revenue", "costs", "counter"] as const;
const VALID_THEMES = ["cyberpunk", "minimal", "retro"] as const;

type DisplayMode = (typeof VALID_DISPLAY_MODES)[number];
type Theme = (typeof VALID_THEMES)[number];

interface AppData {
  costTotal: number;
  costBudgetCap: number;
  displayMode: DisplayMode;
  rotationInterval: number;
  revenueGoal: number;
  theme: Theme;
  milestones: number[];
  triggeredMilestones: number[];
}

const DEFAULT_DATA: AppData = {
  costTotal: 0,
  costBudgetCap: 100,
  displayMode: "both",
  rotationInterval: 10,
  revenueGoal: 100,
  theme: "cyberpunk",
  milestones: [],
  triggeredMilestones: [],
};

let data: AppData;
let currentRevenue = 0; // cents (integer) — converted to dollars at API boundary
let lastFetchTimestamp = 0; // Unix seconds, tracks latest transaction seen
let lastSyncTime = 0; // Unix ms of last successful Stripe poll
let lastSyncError: string | null = null;
let consecutiveFailures = 0;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// --- Data Helpers ---

async function loadData(): Promise<AppData> {
  const file = Bun.file(DATA_FILE);
  if (await file.exists()) {
    const raw = await file.json();
    return { ...DEFAULT_DATA, ...raw } as AppData;
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

  if ("theme" in body) {
    if (!VALID_THEMES.includes(body.theme as Theme)) {
      return { error: `theme must be one of: ${VALID_THEMES.join(", ")}` };
    }
    result.theme = body.theme as Theme;
  }

  if ("milestones" in body) {
    if (!Array.isArray(body.milestones) || !body.milestones.every((m: unknown) => typeof m === "number" && isFinite(m as number) && (m as number) > 0)) {
      return { error: "milestones must be an array of positive finite numbers" };
    }
    result.milestones = body.milestones as number[];
  }

  return { value: result };
}

// --- Stripe Integration ---

async function fetchAllTimeRevenue(): Promise<void> {
  if (!stripe) return;

  let total = 0;
  let latestCreated = 0;

  for (const type of ["charge", "refund"] as const) {
    for await (const txn of stripe.balanceTransactions.list({ type, limit: 100 })) {
      total += txn.amount;
      if (txn.created > latestCreated) latestCreated = txn.created;
    }
  }

  currentRevenue = total;
  lastFetchTimestamp = latestCreated;
  lastSyncTime = Date.now();
  lastSyncError = null;
  consecutiveFailures = 0;
  console.log(`Stripe: initial revenue = $${(currentRevenue / 100).toFixed(2)}`);
}

async function pollNewTransactions(): Promise<void> {
  if (!stripe) return;

  try {
    let latestCreated = lastFetchTimestamp;

    for (const type of ["charge", "refund"] as const) {
      for await (const txn of stripe.balanceTransactions.list({
        type,
        limit: 100,
        created: { gt: lastFetchTimestamp },
      })) {
        currentRevenue += txn.amount;
        if (txn.created > latestCreated) latestCreated = txn.created;
      }
    }

    lastFetchTimestamp = latestCreated;
    lastSyncTime = Date.now();
    lastSyncError = null;
    consecutiveFailures = 0;
  } catch (err) {
    consecutiveFailures++;
    lastSyncError = err instanceof Error ? err.message : String(err);
    if (consecutiveFailures >= 3) {
      console.error(`Stripe poll: ${consecutiveFailures} consecutive failures — ${lastSyncError}`);
    } else {
      console.error("Stripe poll error:", err);
    }
  }
}

// --- Server ---

data = await loadData();

if (!ADMIN_PASSWORD) {
  console.warn("WARNING: ADMIN_PASSWORD is not set. POST /api/config will reject all requests.");
}

if (!stripe) {
  console.warn("WARNING: STRIPE_SECRET_KEY is not set. Revenue will remain at 0.");
} else {
  try {
    await fetchAllTimeRevenue();
  } catch (err) {
    consecutiveFailures++;
    lastSyncError = err instanceof Error ? err.message : String(err);
    console.error("Stripe initial fetch failed:", err);
  }
  setInterval(pollNewTransactions, STRIPE_POLL_INTERVAL);
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
        revenue: currentRevenue / 100,
        revenueGoal: data.revenueGoal,
        costTotal: data.costTotal,
        costBudgetCap: data.costBudgetCap,
        displayMode: data.displayMode,
        rotationInterval: data.rotationInterval,
        theme: data.theme,
        milestones: data.milestones,
        triggeredMilestones: data.triggeredMilestones,
        lastSyncTime,
      });
    }

    // GET /api/health
    if (req.method === "GET" && path === "/api/health") {
      return jsonResponse({
        stripeConnected: !!stripe,
        lastSyncTime,
        lastSyncError,
        consecutiveFailures,
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

      // Clean up triggered milestones when milestones config changes
      if ("milestones" in updates) {
        data.triggeredMilestones = data.triggeredMilestones.filter(
          (m) => data.milestones.includes(m)
        );
      }

      await saveData(data);

      return jsonResponse({ ok: true, data });
    }

    // GET /api/config/export
    if (req.method === "GET" && path === "/api/config/export") {
      const file = Bun.file(DATA_FILE);
      const content = await file.text();
      return new Response(content, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="overlay-config.json"',
        },
      });
    }

    // POST /api/config/import
    if (req.method === "POST" && path === "/api/config/import") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return errorResponse("Invalid JSON body");
      }

      if (typeof body.password !== "string" || body.password.length === 0) {
        return errorResponse("password is required");
      }
      if (!ADMIN_PASSWORD || body.password !== ADMIN_PASSWORD) {
        return errorResponse("Unauthorized", 401);
      }

      const config = body.config as Record<string, unknown> | undefined;
      if (!config || typeof config !== "object") {
        return errorResponse("config object is required");
      }

      // Validate all fields by running through validateConfig with a dummy password
      const testBody = { ...config, password: "x" };
      const validated = validateConfig(testBody as Record<string, unknown>);
      if ("error" in validated) {
        return errorResponse(validated.error);
      }

      const { password: _pw, ...updates } = validated.value;
      data = { ...DEFAULT_DATA, ...updates };
      await saveData(data);

      return jsonResponse({ ok: true, data });
    }

    // POST /api/milestone/triggered
    if (req.method === "POST" && path === "/api/milestone/triggered") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return errorResponse("Invalid JSON body");
      }

      const amount = body.amount;
      if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) {
        return errorResponse("amount must be a positive finite number");
      }

      if (!data.milestones.includes(amount)) {
        return errorResponse("amount is not a configured milestone");
      }

      if (!data.triggeredMilestones.includes(amount)) {
        data.triggeredMilestones.push(amount);
        await saveData(data);
      }

      return jsonResponse({ ok: true });
    }

    // Static files from public/
    if (req.method === "GET" && !path.startsWith("/api/")) {
      return serveStatic(path);
    }

    return errorResponse("Not found", 404);
  },
});

console.log(`Server running at http://127.0.0.1:${server.port}`);
