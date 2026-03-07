# Interview Log: OBS Revenue & Cost Overlay

## Turn 1 — Context, Visual Style, and Revenue Scope

### Questions Asked

1. **What kind of livestream content do you do?**
   - Options: Coding/dev stream, Charity/fundraiser, Product/SaaS demo, Business transparency
   - **Selected**: Coding/dev stream
   - **Notes**: "I'm doing a daily-ish livestream of vibe-coding to $1M in revenue"

2. **How should the bars be displayed visually?**
   - Options: Progress bars with goals, Simple counters/labels, Both options available
   - **Selected**: Both options available (support progress bar and counter modes)

3. **What revenue should the Stripe bar track?**
   - Options: Today's revenue, This month's, All-time total, Configurable time range
   - **Selected**: All-time total

## Turn 2 — OBS Integration, Tech Stack, Cost Input

### Questions Asked

1. **How should OBS consume the overlay?**
   - Options: Browser Source (recommended), Text file source
   - **Selected**: Browser Source

2. **Preferred tech stack?**
   - Options: Node.js/Bun + HTML/CSS/JS, Next.js/React, Python + HTML/CSS/JS
   - **Selected**: Node.js/Bun + HTML/CSS/JS

3. **How to update the cost bar during a stream?**
   - Options: Simple web form/admin page, Config file, CLI command
   - **Selected**: Simple web form/admin page

## Turn 3 — Cost Meaning, Visual Design, Refresh Rate

### Questions Asked

1. **What does the cost bar represent?**
   - Options: Total business costs, Stream/project costs, Monthly burn rate
   - **Selected**: Total business costs (all-time cumulative)

2. **Visual design aesthetic?**
   - Options: Minimal/dark theme, Transparent/floating, Custom
   - **Selected**: Transparent/floating

3. **How often should Stripe revenue update?**
   - Options: Every 30 seconds (recommended), Every 5 seconds, Every 5 minutes, On-demand
   - **Selected**: Every 30 seconds

## Turn 4 — Goal Targets, Cost Goals, Hosting

### Questions Asked

1. **Revenue bar goal — fixed $1M or milestones?**
   - Options: $1M fixed goal, Configurable milestones, Auto-scaling milestones
   - **Selected**: $1M fixed goal

2. **Cost bar — should it have a budget goal?**
   - Options: No goal just total, Budget cap/goal
   - **Selected**: Budget cap/goal

3. **Where will this run?**
   - Options: Locally (recommended), VPS/cloud, Both/flexible
   - **Selected**: Locally on my machine

## Turn 5 — Revenue Calculation, Cost Tracking Detail, Extra Displays

### Questions Asked

1. **Revenue calculation method?**
   - Options: Net revenue (recommended), Gross revenue, Net after Stripe fees
   - **Selected**: Net revenue (successful payments minus refunds)

2. **Cost tracking — single total or line items?**
   - Options: Single total (recommended), Line items that sum up, Line items with history
   - **Selected**: Single total amount

3. **Additional info beyond two bars?**
   - Options: Just the two bars, Add net profit, Add net profit + percentage
   - **Selected**: Just the two bars

## Turn 6 — Security, Persistence, Animations

### Questions Asked

1. **Admin page authentication?**
   - Options: No auth localhost only (recommended), Simple password
   - **Selected**: Simple password

2. **Cost data persistence?**
   - Options: JSON file on disk (recommended), SQLite, Environment variable
   - **Selected**: JSON file on disk

3. **Animation style for bar updates?**
   - Options: Smooth transitions (recommended), Instant updates
   - **Selected**: Smooth transitions

## Turn 7 — Runtime, Port, Display Mode Toggle

### Questions Asked

1. **Bun or Node.js?**
   - Options: Bun (recommended), Node.js
   - **Selected**: Bun

2. **Server port?**
   - Options: 3000, 4455, 8080
   - **Selected**: 4455

3. **Display mode toggle via query params or admin page?**
   - Options: Query param toggle (recommended), Admin page toggle
   - **Selected**: Neither as presented — wants configurable display modes from admin including rotation between bars over time, and options to always display both or show individually
   - **Notes**: "They should flip between the two over time or we can have an option to always display. It should be up to the streamer to choose how they want to present things and what they present."

## Turn 8 — Cyberpunk Theme and Rotation Details

*User interjected during Turn 7 with "make it cyberpunk themed"*

### Questions Asked

1. **Cyberpunk theme vibe?**
   - Options: Neon glow (recommended), Retro terminal/Matrix, Synthwave/gradient
   - **Selected**: Neon glow (cyan/magenta with glow effects, scanlines, tech font)

2. **Rotation timing and transitions?**
   - Options: 10s per bar with fade, 15s per bar with slide, Configurable from admin
   - **Selected**: 10 seconds with fade by default, but configurable from admin page

## Turn 9 — Final Confirmation

Presented full summary of all decisions. User confirmed: "Looks complete, write the spec."

---

## Summary of Deviations from Original Request

The original request was straightforward: "two bars, one connected to Stripe for revenue, another for costs that's manually adjusted." Through the interview, the spec expanded in several ways:

1. **Display modes added**: The original implied both bars always visible. The final spec supports five display modes (both, rotate, revenue-only, costs-only, counter) with configurable rotation — driven by the user wanting flexibility in presentation.

2. **Cyberpunk theme**: Not in the original request. User added this mid-interview, shifting from the initially selected "transparent/floating" minimal style to a neon glow cyberpunk aesthetic with scanlines and glow effects.

3. **Budget cap for costs**: The original just said "manually adjusted." The interview revealed the user wants a budget cap/goal for the cost bar too, making it a proper progress bar rather than just a counter.

4. **Admin authentication**: Added simple password protection — not in the original scope but warranted for safety during screen-sharing scenarios.

5. **Incremental Stripe polling**: Technical implementation decision to cache revenue and only fetch new transactions on each poll, rather than re-fetching all-time data every 30 seconds.

All deviations were user-driven through the interview process. No scope was removed from the original request.
