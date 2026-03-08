# OBS Revenue & Cost Overlay — Implementation Plan

## Phase 1: Project Scaffolding

- [x] Initialize Bun project (`bun init`, configure `package.json`)
- [x] Install dependencies (`stripe`)
- [x] Create project directory structure (`public/`, `tasks/`)
- [x] Create `.env.example` with placeholder values for `STRIPE_SECRET_KEY` and `ADMIN_PASSWORD`
- [x] Add `.gitignore` (ignore `.env`, `node_modules/`, `data.json`)
- [x] Create `data.json` with default values (costTotal: 0, costBudgetCap: 50000, displayMode: "both", rotationInterval: 10, revenueGoal: 1000000)

## Phase 2: Server & API

- [x] Create `server.ts` with Bun HTTP server listening on port 4455 (localhost only)
- [x] Implement static file serving for `public/` directory
- [x] Implement `GET /overlay` route — serves `public/overlay.html`
- [x] Implement `GET /admin` route — serves `public/admin.html`
- [x] Implement `GET /api/stats` route — returns revenue + config data as JSON
- [x] Implement `POST /api/config` route — validates password, updates config, persists to `data.json`
- [x] Implement `data.json` read/write helpers (load on startup, write on config change)
- [x] Add input validation on `POST /api/config` (valid displayMode, positive numbers, etc.)

## Phase 3: Stripe Integration

- [x] Load `STRIPE_SECRET_KEY` from `.env`
- [x] Implement initial full balance fetch on server start (sum all `charge` and `refund` balance transactions)
- [x] Handle Stripe pagination for all-time history (auto_paging)
- [x] Cache the computed net revenue in memory
- [x] Implement 30-second polling loop that fetches only new transactions since last check (`created` filter)
- [x] Update cached revenue total incrementally from new transactions
- [x] Handle Stripe API errors gracefully (log error, keep last known value)
- [x] Expose cached revenue via `GET /api/stats`

## Phase 4: Overlay Frontend — Structure & Logic

- [x] Create `public/overlay.html` — minimal HTML shell with bar containers
- [x] Create `public/overlay.js` — poll `/api/stats` every 2.5 seconds for responsive updates
- [x] Implement currency formatting helper (e.g., `$45,230`)
- [x] Implement progress bar percentage calculation (current / goal * 100, capped at 100%)
- [x] Implement "both" display mode — both bars stacked vertically
- [x] Implement "rotate" display mode — fade between bars on a timer (configurable interval)
- [x] Implement "revenue" display mode — revenue bar only
- [x] Implement "costs" display mode — cost bar only
- [x] Implement "counter" display mode — text-only, no bar visualization
- [x] Handle display mode changes from API without page reload

## Phase 5: Overlay Frontend — Cyberpunk Theme

- [x] Create `public/overlay.css` — base layout with transparent background
- [x] Import Orbitron font from Google Fonts (with monospace fallback)
- [x] Style revenue bar — neon cyan (`#00fff2`) fill with `box-shadow` glow
- [x] Style cost bar — neon magenta (`#ff0055`) fill with `box-shadow` glow
- [x] Style text labels and amounts — white with color-matched `text-shadow` glow
- [x] Style bar track (unfilled portion) — dark semi-transparent background
- [x] Add scanline effect — CSS `::after` pseudo-element with `repeating-linear-gradient`
- [x] Add smooth bar fill transition (CSS `transition: width 0.8s ease-out`)
- [x] Add pulse/flash animation on amount text change
- [x] Add fade transition for rotate mode (CSS `opacity` transition, 0.5s)
- [x] Set overlay dimensions (~450px wide, auto height)

## Phase 6: Admin Page

- [x] Create `public/admin.html` — password prompt and config form
- [x] Create `public/admin.css` — clean dark UI styling
- [x] Create `public/admin.js` — form logic and API calls
- [x] Implement password prompt on page load (store in session memory)
- [x] Add cost total number input
- [x] Add budget cap number input
- [x] Add display mode dropdown (both / rotate / revenue / costs / counter)
- [x] Add rotation interval input (conditionally shown when mode is "rotate")
- [x] Add read-only current revenue display (polled from `/api/stats` every 5s)
- [x] Implement save button — POST to `/api/config` with password and form values
- [x] Show success/error feedback on save
- [x] Handle incorrect password response (re-show auth screen)

## Phase 7: Testing & Polish

- [ ] Test with Stripe test mode API key — verify revenue calculation
- [ ] Test all 5 display modes in a browser
- [ ] Test rotation timing and fade transitions
- [ ] Test admin page — update costs, change modes, verify overlay reacts
- [ ] Test server restart — verify `data.json` persistence loads correctly
- [ ] Test in OBS as a Browser Source — verify transparent background works
- [ ] Test edge cases: zero revenue, zero costs, cost exceeding budget cap, revenue exceeding $1M goal
- [ ] Verify Stripe key and admin password are never exposed to frontend
- [ ] Verify server only binds to localhost

## Review

_(To be filled after implementation)_
