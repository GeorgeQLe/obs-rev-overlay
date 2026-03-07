# OBS Revenue & Cost Overlay — Implementation Plan

## Phase 1: Project Scaffolding

- [x] Initialize Bun project (`bun init`, configure `package.json`)
- [x] Install dependencies (`stripe`)
- [x] Create project directory structure (`public/`, `tasks/`)
- [x] Create `.env.example` with placeholder values for `STRIPE_SECRET_KEY` and `ADMIN_PASSWORD`
- [x] Add `.gitignore` (ignore `.env`, `node_modules/`, `data.json`)
- [x] Create `data.json` with default values (costTotal: 0, costBudgetCap: 50000, displayMode: "both", rotationInterval: 10, revenueGoal: 1000000)

## Phase 2: Server & API

- [ ] Create `server.ts` with Bun HTTP server listening on port 4455 (localhost only)
- [ ] Implement static file serving for `public/` directory
- [ ] Implement `GET /overlay` route — serves `public/overlay.html`
- [ ] Implement `GET /admin` route — serves `public/admin.html`
- [ ] Implement `GET /api/stats` route — returns revenue + config data as JSON
- [ ] Implement `POST /api/config` route — validates password, updates config, persists to `data.json`
- [ ] Implement `data.json` read/write helpers (load on startup, write on config change)
- [ ] Add input validation on `POST /api/config` (valid displayMode, positive numbers, etc.)

## Phase 3: Stripe Integration

- [ ] Load `STRIPE_SECRET_KEY` from `.env`
- [ ] Implement initial full balance fetch on server start (sum all `charge` and `refund` balance transactions)
- [ ] Handle Stripe pagination for all-time history (auto_paging)
- [ ] Cache the computed net revenue in memory
- [ ] Implement 30-second polling loop that fetches only new transactions since last check (`created` filter)
- [ ] Update cached revenue total incrementally from new transactions
- [ ] Handle Stripe API errors gracefully (log error, keep last known value)
- [ ] Expose cached revenue via `GET /api/stats`

## Phase 4: Overlay Frontend — Structure & Logic

- [ ] Create `public/overlay.html` — minimal HTML shell with bar containers
- [ ] Create `public/overlay.js` — poll `/api/stats` every 2-3 seconds for responsive updates
- [ ] Implement currency formatting helper (e.g., `$45,230`)
- [ ] Implement progress bar percentage calculation (current / goal * 100, capped at 100%)
- [ ] Implement "both" display mode — both bars stacked vertically
- [ ] Implement "rotate" display mode — fade between bars on a timer (configurable interval)
- [ ] Implement "revenue" display mode — revenue bar only
- [ ] Implement "costs" display mode — cost bar only
- [ ] Implement "counter" display mode — text-only, no bar visualization
- [ ] Handle display mode changes from API without page reload

## Phase 5: Overlay Frontend — Cyberpunk Theme

- [ ] Create `public/overlay.css` — base layout with transparent background
- [ ] Import Orbitron font from Google Fonts (with monospace fallback)
- [ ] Style revenue bar — neon cyan (`#00fff2`) fill with `box-shadow` glow
- [ ] Style cost bar — neon magenta (`#ff0055`) fill with `box-shadow` glow
- [ ] Style text labels and amounts — white with color-matched `text-shadow` glow
- [ ] Style bar track (unfilled portion) — dark semi-transparent background
- [ ] Add scanline effect — CSS `::after` pseudo-element with `repeating-linear-gradient`
- [ ] Add smooth bar fill transition (CSS `transition: width 0.8s ease-out`)
- [ ] Add pulse/flash animation on amount text change
- [ ] Add fade transition for rotate mode (CSS `opacity` transition, 0.5s)
- [ ] Set overlay dimensions (~400-500px wide, auto height)

## Phase 6: Admin Page

- [ ] Create `public/admin.html` — password prompt and config form
- [ ] Create `public/admin.css` — clean dark UI styling
- [ ] Create `public/admin.js` — form logic and API calls
- [ ] Implement password prompt on page load (store in session memory)
- [ ] Add cost total number input
- [ ] Add budget cap number input
- [ ] Add display mode dropdown (both / rotate / revenue / costs / counter)
- [ ] Add rotation interval input (conditionally shown when mode is "rotate")
- [ ] Add read-only current revenue display (polled from `/api/stats`)
- [ ] Implement save button — POST to `/api/config` with password and form values
- [ ] Show success/error feedback on save
- [ ] Handle incorrect password response

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
