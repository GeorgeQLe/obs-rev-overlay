(function () {
  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const calcPercent = (current, goal) =>
    !goal ? 0 : Math.min(100, Math.max(0, (current / goal) * 100));

  function animateValue(el, from, to, duration, formatter) {
    if (from === to) return;
    const start = performance.now();
    const delta = to - from;
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - (1 - t) * (1 - t); // ease-out quad
      el.textContent = formatter(from + delta * ease);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const overlay = document.getElementById("overlay");
  const revBar = document.getElementById("revenue-bar");
  const costBar = document.getElementById("cost-bar");
  const counterDisplay = document.getElementById("counter-display");

  const revFill = revBar.querySelector(".bar-fill");
  const revCurrent = revBar.querySelector(".bar-current");
  const revGoal = revBar.querySelector(".bar-goal");

  const costFill = costBar.querySelector(".bar-fill");
  const costCurrent = costBar.querySelector(".bar-current");
  const costGoal = costBar.querySelector(".bar-goal");

  const counterRevenue = counterDisplay.querySelector(".revenue-text");
  const counterCost = counterDisplay.querySelector(".cost-text");

  let prevStats = null;
  let rotationTimer = null;
  let showingRevenue = true;

  function pulseElement(el) {
    el.classList.add("pulse");
    setTimeout(() => el.classList.remove("pulse"), 500);
  }

  function update(stats) {
    const revPercent = calcPercent(stats.revenue, stats.revenueGoal);
    const costPercent = calcPercent(stats.costTotal, stats.costBudgetCap);

    revFill.style.width = revPercent + "%";
    revGoal.textContent = formatCurrency(stats.revenueGoal);
    costFill.style.width = costPercent + "%";
    costGoal.textContent = formatCurrency(stats.costBudgetCap);

    const prevRev = prevStats ? prevStats.revenue : stats.revenue;
    const prevCost = prevStats ? prevStats.costTotal : stats.costTotal;

    animateValue(revCurrent, prevRev, stats.revenue, 1000, formatCurrency);
    animateValue(costCurrent, prevCost, stats.costTotal, 1000, formatCurrency);
    animateValue(counterRevenue, prevRev, stats.revenue, 1000, (n) => "REVENUE " + formatCurrency(n));
    animateValue(counterCost, prevCost, stats.costTotal, 1000, (n) => "COSTS " + formatCurrency(n));

    if (prevStats) {
      if (stats.revenue !== prevStats.revenue) {
        pulseElement(revCurrent);
        pulseElement(counterRevenue);
      }
      if (stats.costTotal !== prevStats.costTotal) {
        pulseElement(costCurrent);
        pulseElement(counterCost);
      }
    }

    // Phase 12: Apply theme
    overlay.setAttribute("data-theme", stats.theme || "cyberpunk");
    document.body.style.fontFamily = getComputedStyle(overlay).getPropertyValue("--font-main");

    // Phase 13: Check milestones
    checkMilestones(stats);

    applyDisplayMode(stats.displayMode, stats.rotationInterval);
    prevStats = { ...stats };
  }

  function applyDisplayMode(mode, interval) {
    overlay.setAttribute("data-mode", mode);

    if (mode === "rotate") {
      const intervalMs = interval * 1000;
      if (!rotationTimer || rotationTimer._interval !== intervalMs) {
        clearInterval(rotationTimer);
        rotationTimer = setInterval(() => {
          showingRevenue = !showingRevenue;
          revBar.classList.toggle("visible", showingRevenue);
          costBar.classList.toggle("visible", !showingRevenue);
        }, intervalMs);
        rotationTimer._interval = intervalMs;
        showingRevenue = true;
        revBar.classList.add("visible");
        costBar.classList.remove("visible");
      }
    } else {
      if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
      }
      revBar.classList.remove("visible");
      costBar.classList.remove("visible");
    }
  }

  function playMilestoneSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      // Rising two-tone chime
      [440, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.3);
      });

      setTimeout(() => ctx.close(), 1000);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  function checkMilestones(stats) {
    if (!stats.milestones || !stats.milestones.length) return;
    const triggered = stats.triggeredMilestones || [];

    for (const threshold of stats.milestones) {
      if (stats.revenue >= threshold && !triggered.includes(threshold)) {
        playMilestoneSound();
        fetch("/api/milestone/triggered", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: threshold }),
        }).catch((e) => console.error("Milestone report error:", e));
        break; // One sound per poll cycle
      }
    }
  }

  async function poll() {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) update(await res.json());
    } catch (e) {
      console.error("Poll error:", e);
    }
  }

  poll();
  setInterval(poll, 2500);
})();
