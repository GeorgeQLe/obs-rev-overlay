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

Phase 9 in progress (Steps 1-2 complete). Phases 1-8 fully functional with Stripe polling, 5 display modes, cyberpunk theme, admin panel, and health monitoring.

## Up Next

### Phase 9, Step 3: Toggle Logic (`public/admin.js`)

**Context:** Steps 1-2 added the preview HTML and CSS. The admin panel now has:
- `#preview-toggle` button (text: "Show Preview") inside `.preview-section`
- `#preview-container` div with class `hidden`, containing `#preview-frame` iframe pointing to `/overlay`

The button and container are styled but clicking the button does nothing yet. This step adds the toggle interaction.

**File:** `public/admin.js` — two changes needed:

**Change 1: Add element references (after line 17, the `syncStatus` const)**

Add these two refs alongside the existing `$()` calls at the top of the IIFE:

```js
const previewToggle = $("preview-toggle");
const previewContainer = $("preview-container");
const previewFrame = $("preview-frame");
```

**Change 2: Add click handler (after line 158, before the closing `})();`)**

Add the toggle click handler alongside the other event listeners:

```js
previewToggle.addEventListener("click", () => {
  const hidden = previewContainer.classList.toggle("hidden");
  previewToggle.textContent = hidden ? "Show Preview" : "Hide Preview";
  if (!hidden) previewFrame.src = previewFrame.src;
});
```

**How it works:**
- `classList.toggle("hidden")` returns `true` if class was added (now hidden), `false` if removed (now visible)
- Button text updates to reflect current state
- `previewFrame.src = previewFrame.src` forces iframe reload when opening, so the preview always shows current overlay state
- No cleanup needed on close — iframe just stays in DOM with `display: none`

**Acceptance criteria:**
1. Click "Show Preview" → container appears, button text changes to "Hide Preview"
2. Click "Hide Preview" → container hides, button text changes back to "Show Preview"
3. Each time preview is shown, iframe reloads (visible as a brief flash/reload of overlay content)
4. No console errors

### Remaining Phase 9 Steps

- **Step 4:** Auto-refresh on save in `public/admin.js` — after successful save, reload preview iframe if visible (~3 lines added to `save()` function)
