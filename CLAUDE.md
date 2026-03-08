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

Phase 9 in progress (Steps 1-3 complete). Phases 1-8 fully functional with Stripe polling, 5 display modes, cyberpunk theme, admin panel, and health monitoring.

## Up Next

### Phase 9, Step 4: Auto-refresh Preview on Save (`public/admin.js`)

**Context:** Steps 1-3 added the full preview UI — HTML, CSS, and toggle logic. The preview iframe loads `/overlay` and can be shown/hidden via the "Show Preview" / "Hide Preview" button. Currently, when the user saves config changes (cost, display mode, etc.), the overlay updates via its own polling, but the preview iframe doesn't immediately reflect the change. This step makes the preview auto-refresh after a successful save so the user gets instant visual feedback.

**File:** `public/admin.js` — one change needed in the `save()` function.

**What to change:** Inside the `save()` function, after the `showFeedback("Saved", "success")` line (currently line 141), add a preview iframe reload:

```js
      if (data.ok) {
        showFeedback("Saved", "success");
        if (!previewContainer.classList.contains("hidden")) {
          previewFrame.src = previewFrame.src;
        }
      }
```

**How it works:**
- After a successful save (`data.ok`), check if the preview container is currently visible (doesn't have `hidden` class)
- If visible, force-reload the iframe by reassigning its `src` — same technique used in the toggle handler
- If preview is hidden, do nothing — it will reload next time the user opens it (the toggle handler already does this)
- The overlay's own 2.5s poll will pick up the new config, so the iframe reload just speeds up the visual feedback

**Why this is the right approach:**
- Minimal code (2 lines added)
- Reuses the `previewFrame` and `previewContainer` refs already added in Step 3
- No race condition risk — the server has already persisted the config by the time `data.ok` is true
- The iframe reload triggers a fresh `/overlay` page load which fetches `/api/stats` immediately

**Acceptance criteria:**
1. Save config with preview open → iframe visibly reloads within ~1 second
2. Save config with preview closed → no reload, no errors
3. Change display mode, save → preview shows updated mode after reload
4. No console errors
