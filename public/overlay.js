(function () {
  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const calcPercent = (current, goal) =>
    Math.min(100, Math.max(0, (current / goal) * 100));

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
    revCurrent.textContent = formatCurrency(stats.revenue);
    revGoal.textContent = formatCurrency(stats.revenueGoal);

    costFill.style.width = costPercent + "%";
    costCurrent.textContent = formatCurrency(stats.costTotal);
    costGoal.textContent = formatCurrency(stats.costBudgetCap);

    counterRevenue.textContent = "REVENUE " + formatCurrency(stats.revenue);
    counterCost.textContent = "COSTS " + formatCurrency(stats.costTotal);

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
