## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff your behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Project Status

All 8 phases complete. Overlay is fully functional with Stripe polling, 5 display modes, cyberpunk theme, admin panel, and health monitoring.

## Up Next

### Phase 9: Live Overlay Preview in Admin Panel

**Why:** Currently the admin panel is a blind config editor — you change settings and hope the overlay looks right. A live preview lets streamers see exactly what their overlay will look like while configuring, without switching to OBS.

---

#### Step 1: Add preview iframe to admin HTML (`public/admin.html`)

Add a collapsible preview section below the save button:

```html
<div class="preview-section">
  <button type="button" id="preview-toggle">Show Preview</button>
  <div id="preview-container" class="hidden">
    <iframe id="preview-frame" src="/overlay" frameborder="0"></iframe>
  </div>
</div>
```

Place this after `<div id="feedback"></div>` (line 56). The iframe loads `/overlay` which already exists and polls `/api/stats` on its own — no extra wiring needed.

#### Step 2: Style the preview (`public/admin.css`)

Add styles for the preview section:
- `.preview-section` — margin-top: 24px
- `#preview-toggle` — full-width button, secondary style (outline/ghost variant, not the cyan fill used by Save)
- `#preview-container` — dark background (#0a0a1a) to simulate OBS transparent-on-dark, border-radius, overflow hidden, padding
- `#preview-frame` — width: 100%, height: 200px (enough for both bars), no border, background transparent

Key detail: the overlay has a transparent background. The dark preview container simulates how it looks in OBS on a dark scene. ~15 lines CSS.

#### Step 3: Toggle logic (`public/admin.js`)

Add click handler for `#preview-toggle`:
- Toggle `#preview-container` visibility (add/remove `hidden` class)
- Update button text: "Show Preview" ↔ "Hide Preview"
- On show: reload the iframe (`preview-frame.src = preview-frame.src`) to ensure fresh state

~8 lines JS. Add element refs alongside existing `$()` calls at the top of the IIFE.

#### Step 4: Auto-refresh preview on save (`public/admin.js`)

In the existing `save()` function, after a successful save (`data.ok`), reload the preview iframe if it's visible:

```js
if (data.ok) {
  showFeedback("Saved", "success");
  if (!previewContainer.classList.contains("hidden")) {
    previewFrame.contentWindow.location.reload();
  }
}
```

This ensures mode/goal changes are immediately reflected. ~3 lines added to existing function.

---

#### Files Modified

| File | Change |
|------|--------|
| `public/admin.html` | Add preview section HTML (~6 lines) |
| `public/admin.css` | Add preview styles (~15 lines) |
| `public/admin.js` | Add toggle handler, auto-refresh on save (~12 lines) |
| `tasks/todo.md` | Add Phase 9 items |

No server changes needed — the overlay page already works standalone.

#### Acceptance Criteria

1. Admin panel shows "Show Preview" button below feedback area
2. Clicking it reveals the overlay in a dark container (simulating OBS)
3. Button text toggles to "Hide Preview"
4. Preview shows live data (revenue, costs, bars) — it's a real overlay instance
5. Changing display mode + save → preview updates to reflect new mode
6. Preview container has dark background so transparent overlay is visible
7. No regressions to overlay or existing admin functionality
