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

Phase 9 in progress (Step 1 complete). Phases 1-8 fully functional with Stripe polling, 5 display modes, cyberpunk theme, admin panel, and health monitoring.

## Up Next

### Phase 9, Step 2: Style the Preview Section (`public/admin.css`)

**Context:** Step 1 added the preview HTML to `public/admin.html` — a `.preview-section` div containing a `#preview-toggle` button and a `#preview-container` (hidden) with an `#preview-frame` iframe loading `/overlay`. The HTML is in place but unstyled.

**File:** `public/admin.css` — append ~15 lines at the end of the file (after `.hidden` on line 131).

**What to add:**

```css
.preview-section {
  margin-top: 24px;
}

#preview-toggle {
  width: 100%;
  background: transparent;
  border: 1px solid #2a2a4a;
  color: #e0e0e0;
}

#preview-toggle:hover {
  border-color: #00fff2;
  color: #00fff2;
}

#preview-container {
  margin-top: 12px;
  background: #0a0a1a;
  border-radius: 8px;
  overflow: hidden;
  padding: 12px;
}

#preview-frame {
  width: 100%;
  height: 200px;
  border: none;
  background: transparent;
}
```

**Key design decisions:**
- `#preview-toggle` uses ghost/outline style (transparent bg, border) to differentiate from the solid cyan Save button
- `#preview-container` uses `#0a0a1a` dark background to simulate how the transparent overlay looks in OBS on a dark scene
- `#preview-frame` at 200px height is enough for both revenue + cost bars stacked
- Hover state uses cyan (`#00fff2`) to match the project's cyberpunk theme

**Acceptance criteria:**
1. "Show Preview" button is full-width with outline style, visually distinct from Save
2. Preview container (when shown via devtools removing `.hidden`) has dark background
3. iframe fills the container width with no visible border
4. No regressions to existing admin styles

### Remaining Phase 9 Steps

- **Step 3:** Toggle logic in `public/admin.js` — click handler for `#preview-toggle` to show/hide container, update button text, reload iframe on show (~8 lines)
- **Step 4:** Auto-refresh on save in `public/admin.js` — after successful save, reload preview iframe if visible (~3 lines added to `save()` function)
