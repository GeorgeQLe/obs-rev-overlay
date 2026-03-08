(function () {
  const $ = (id) => document.getElementById(id);

  const authScreen = $("auth-screen");
  const adminPanel = $("admin-panel");
  const passwordInput = $("password-input");
  const unlockBtn = $("unlock-btn");
  const revenueDisplay = $("revenue-display");
  const revenueGoal = $("revenue-goal");
  const costTotal = $("cost-total");
  const costBudgetCap = $("cost-budget-cap");
  const displayMode = $("display-mode");
  const rotationField = $("rotation-field");
  const rotationInterval = $("rotation-interval");
  const saveBtn = $("save-btn");
  const feedback = $("feedback");
  const syncStatus = $("sync-status");

  let password = "";
  let pollTimer = null;

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  function showFeedback(msg, type) {
    feedback.textContent = msg;
    feedback.className = type;
    if (type === "success") {
      setTimeout(() => { feedback.textContent = ""; feedback.className = ""; }, 3000);
    }
  }

  function populateForm(stats) {
    revenueDisplay.value = formatCurrency(stats.revenue);
    revenueGoal.value = stats.revenueGoal;
    costTotal.value = stats.costTotal;
    costBudgetCap.value = stats.costBudgetCap;
    displayMode.value = stats.displayMode;
    rotationInterval.value = stats.rotationInterval;
    toggleRotationField();
  }

  function updateSyncStatus(stats) {
    if (!stats.lastSyncTime) {
      syncStatus.textContent = "Stripe not configured";
      syncStatus.className = "sync-status stale";
      return;
    }
    const agoSec = Math.round((Date.now() - stats.lastSyncTime) / 1000);
    const label = agoSec < 60 ? `${agoSec}s ago` : `${Math.round(agoSec / 60)}m ago`;
    syncStatus.textContent = `Last sync: ${label}`;
    syncStatus.className = "sync-status " + (agoSec <= 60 ? "healthy" : "stale");
  }

  function toggleRotationField() {
    rotationField.classList.toggle("hidden", displayMode.value !== "rotate");
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("Fetch stats error:", e);
    }
    return null;
  }

  async function unlock() {
    password = passwordInput.value.trim();
    if (!password) return;

    const stats = await fetchStats();
    if (!stats) {
      showFeedback("Could not connect to server", "error");
      return;
    }

    populateForm(stats);
    updateSyncStatus(stats);
    authScreen.classList.add("hidden");
    adminPanel.classList.remove("hidden");

    pollTimer = setInterval(async () => {
      const s = await fetchStats();
      if (s) {
        revenueDisplay.value = formatCurrency(s.revenue);
        updateSyncStatus(s);
      }
    }, 5000);
  }

  async function save() {
    if (saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const payload = { password };

    const ct = parseFloat(costTotal.value);
    if (!isNaN(ct)) payload.costTotal = ct;

    const bc = parseFloat(costBudgetCap.value);
    if (!isNaN(bc)) payload.costBudgetCap = bc;

    const rg = parseFloat(revenueGoal.value);
    if (!isNaN(rg)) payload.revenueGoal = rg;

    payload.displayMode = displayMode.value;

    const ri = parseInt(rotationInterval.value, 10);
    if (!isNaN(ri)) payload.rotationInterval = ri;

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        showFeedback("Wrong password", "error");
        password = "";
        adminPanel.classList.add("hidden");
        authScreen.classList.remove("hidden");
        passwordInput.value = "";
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        return;
      }

      const data = await res.json();
      if (data.ok) {
        showFeedback("Saved", "success");
      } else {
        showFeedback(data.error || "Save failed", "error");
      }
    } catch (e) {
      showFeedback("Network error", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  }

  unlockBtn.addEventListener("click", unlock);
  passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") unlock(); });
  displayMode.addEventListener("change", toggleRotationField);
  saveBtn.addEventListener("click", save);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !adminPanel.classList.contains("hidden")) {
      e.preventDefault();
      save();
    }
  });
})();
