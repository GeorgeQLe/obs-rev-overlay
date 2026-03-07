# OBS Revenue & Cost Overlay — Specification

## Overview

A cyberpunk-themed OBS overlay that displays two progress bars on a livestream: one showing all-time net revenue from Stripe, and another showing manually-tracked total business costs. Designed for a daily vibe-coding livestream tracking progress toward $1M in revenue.

## Goals

- Show real-time all-time net revenue from Stripe as a progress bar toward $1M
- Show total business costs as a manually-adjusted progress bar with a configurable budget cap
- Provide a cyberpunk neon glow aesthetic that floats transparently over the stream
- Allow the streamer to configure display modes, rotation, and cost values via a password-protected admin page

## Architecture

### Tech Stack

- **Runtime**: Bun
- **Backend**: Bun HTTP server (vanilla, no framework) serving both the overlay and admin pages
- **Frontend**: Vanilla HTML / CSS / JS (no build step, no framework)
- **OBS Integration**: Browser Source pointing to `http://localhost:4455/overlay`
- **Port**: 4455

### Project Structure

```
obs-rev-overlay/
  server.ts          # Bun HTTP server — routes, Stripe polling, API endpoints
  public/
    overlay.html     # OBS Browser Source overlay page
    overlay.css      # Cyberpunk theme styles
    overlay.js       # Polling, animations, display mode logic
    admin.html       # Admin page for cost management and display config
    admin.css        # Admin page styles
    admin.js         # Admin page logic
  data.json          # Persisted cost and config data
  .env               # Stripe API key and admin password
  package.json
```

## Data Model

### `data.json` (persisted on disk)

```json
{
  "costTotal": 0,
  "costBudgetCap": 50000,
  "displayMode": "both",
  "rotationInterval": 10,
  "revenueGoal": 1000000
}
```

### In-memory state (not persisted)

- `currentRevenue`: number — latest net revenue fetched from Stripe

## API Endpoints

### `GET /overlay`
Serves the overlay HTML page (OBS Browser Source).

### `GET /admin`
Serves the admin page. Protected by simple password auth.

### `GET /api/stats`
Returns current revenue and cost data for the overlay to poll.

```json
{
  "revenue": 45230.50,
  "revenueGoal": 1000000,
  "costTotal": 32100,
  "costBudgetCap": 50000,
  "displayMode": "both",
  "rotationInterval": 10
}
```

### `POST /api/config`
Updates cost total, budget cap, display mode, and/or rotation interval. Password-protected.

```json
{
  "password": "...",
  "costTotal": 32100,
  "costBudgetCap": 50000,
  "displayMode": "both",
  "rotationInterval": 10
}
```

## Stripe Integration

### Revenue Calculation

- **Metric**: Net revenue (successful payments minus refunds)
- **Scope**: All-time total
- **API**: Use Stripe's Balance Transactions API to sum all `charge` and `refund` type transactions
- **Polling interval**: Every 30 seconds
- **API Key**: Stored in `.env` as `STRIPE_SECRET_KEY`

### Implementation Notes

- On server start, fetch the full all-time balance and cache it
- Every 30s, fetch only new transactions since the last check (use `created` filter) and update the cached total
- This avoids re-fetching all history on every poll

## Overlay Display

### Display Modes (configurable from admin)

1. **Both** (`both`): Both bars visible simultaneously, stacked vertically
2. **Rotate** (`rotate`): Single bar visible at a time, fading between revenue and costs on a timer
3. **Revenue only** (`revenue`): Only the revenue bar
4. **Costs only** (`costs`): Only the cost bar
5. **Counter** (`counter`): Text-only display, no progress bars — just the dollar amounts

### Rotation Settings

- Default interval: 10 seconds per bar
- Transition: CSS fade (opacity transition)
- Interval configurable from admin page

### Bar Layout

Each bar displays:
- Label (e.g., "REVENUE", "COSTS")
- Current amount (formatted as currency, e.g., "$45,230")
- Progress bar fill (percentage of goal/cap)
- Goal amount shown at the end or as a subtitle

## Visual Design — Cyberpunk Neon Glow Theme

### Colors

- **Background**: Fully transparent (for OBS chroma-free compositing)
- **Revenue bar fill**: Neon cyan (`#00fff2`) with glow
- **Cost bar fill**: Neon magenta/red (`#ff0055`) with glow
- **Text**: White with subtle neon glow matching the bar color
- **Bar track** (unfilled portion): Dark semi-transparent (`rgba(255,255,255,0.08)`)

### Effects

- **Neon glow**: CSS `box-shadow` and `text-shadow` with colored glow
- **Scanlines**: CSS pseudo-element overlay with repeating linear gradient for CRT scanline texture
- **Font**: Monospace / tech font (e.g., `'Orbitron'` from Google Fonts, with `monospace` fallback)

### Animations

- **Bar fill updates**: Smooth CSS `transition` on width (0.8s ease-out)
- **Amount text updates**: Brief pulse/flash effect when the number changes
- **Rotation fade**: CSS opacity transition (0.5s) between bars in rotate mode

### Dimensions

- Designed to work as a small overlay — roughly 400-500px wide, auto height
- Responsive within the Browser Source dimensions set in OBS

## Admin Page

### Authentication

- Simple password check against `ADMIN_PASSWORD` env variable
- Password sent with each API request (no sessions/cookies needed for a local tool)
- Admin page prompts for password on load, stores in memory for the session

### Admin Controls

- **Cost total**: Number input to set the current total costs
- **Budget cap**: Number input to set the cost bar's goal amount
- **Display mode**: Dropdown select (both / rotate / revenue / costs / counter)
- **Rotation interval**: Number input (seconds) — only shown when mode is "rotate"
- **Current revenue**: Read-only display showing latest Stripe revenue (for reference)
- **Save button**: Posts changes to `/api/config`

### Admin Style

- Simple, functional design — doesn't need to match the cyberpunk theme
- Clean dark UI that's easy to use during a stream

## Environment Variables (`.env`)

```
STRIPE_SECRET_KEY=sk_live_...
ADMIN_PASSWORD=your-password-here
```

## Security Considerations

- Server only binds to `localhost` — not accessible from the network
- Stripe secret key never exposed to the frontend
- Admin password protects config changes
- No sensitive data in the overlay endpoint (only aggregated revenue number)

## Scope Boundaries — Out of Scope

- No database (SQLite, Postgres, etc.) — just a JSON file
- No user accounts or multi-user support
- No historical tracking or charts
- No itemized cost breakdown (single total only)
- No deployment/hosting setup (local only)
- No automated cost tracking (manual entry only)
- No webhook-based updates (polling only)
- No mobile-responsive admin (desktop browser only)

## Getting Started (for implementation)

1. `bun init` — set up the project
2. `bun add stripe` — install Stripe SDK
3. Create `.env` with Stripe key and admin password
4. Implement server with routes for overlay, admin, and API
5. Build overlay HTML/CSS/JS with cyberpunk theme
6. Build admin page
7. Add as Browser Source in OBS pointing to `http://localhost:4455/overlay`
