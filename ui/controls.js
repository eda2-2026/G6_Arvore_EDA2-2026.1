(function () {
  const byId = (id) => document.getElementById(id);

  function bindControls(handlers) {
    byId("insert-btn").addEventListener("click", handlers.insert);
    byId("remove-btn").addEventListener("click", handlers.remove);
    byId("search-btn").addEventListener("click", handlers.search);
    byId("random-btn").addEventListener("click", handlers.random);
    byId("clear-btn").addEventListener("click", handlers.clear);
    byId("sort-btn").addEventListener("click", handlers.sort);
    byId("export-json").addEventListener("click", handlers.exportJSON);
    byId("export-svg").addEventListener("click", handlers.exportSVG);
    byId("next-step").addEventListener("click", handlers.nextStep);

    document.querySelectorAll(".tab-btn").forEach((button) => {
      button.addEventListener("click", () => handlers.switchMode(button.dataset.mode));
    });

    document.querySelectorAll(".traversal-btn").forEach((button) => {
      button.addEventListener("click", () => handlers.traversal(button.dataset.traversal));
    });

    const input = byId("value-input");
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handlers.insert();
    });

    const speed = byId("speed-input");
    speed.addEventListener("input", () => {
      byId("speed-output").textContent = `${speed.value}x`;
      handlers.speed(Number(speed.value));
    });

    byId("continuous-mode").addEventListener("click", () => handlers.stepMode(false));
    byId("step-mode").addEventListener("click", () => handlers.stepMode(true));
  }

  function readNumber() {
    const input = byId("value-input");
    const value = Number.parseInt(input.value, 10);
    return Number.isFinite(value) ? value : null;
  }

  function readRandomCount() {
    const input = byId("random-count");
    const raw = Number.parseInt(input.value, 10);
    const min = Number.parseInt(input.min, 10) || 1;
    const max = Number.parseInt(input.max, 10) || 31;
    const value = Number.isFinite(raw) ? raw : 8;
    const clamped = Math.min(max, Math.max(min, value));
    input.value = String(clamped);
    return clamped;
  }

  function clearNumber() {
    byId("value-input").value = "";
    byId("value-input").focus();
  }

  function setBusy(isBusy) {
    document.querySelectorAll(".action-btn, .tab-btn, #export-json, #export-svg").forEach((el) => {
      el.disabled = isBusy;
    });
    byId("value-input").disabled = isBusy;
    byId("random-count").disabled = isBusy;
  }

  function setWaiting(isWaiting) {
    byId("next-step").disabled = !isWaiting;
  }

  function setStepMode(enabled) {
    byId("continuous-mode").classList.toggle("active", !enabled);
    byId("step-mode").classList.toggle("active", enabled);
  }

  function setMode(mode, options = {}) {
    document.querySelectorAll(".tab-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });

    const removeLabel = byId("remove-label");
    removeLabel.textContent = mode === "heap" || mode === "heapsort" ? "Extrair max" : "Remover";

    const btreeMode = mode === "btree";
    byId("remove-btn").disabled = btreeMode || Boolean(options.busy);
    byId("sort-btn").disabled = !options.canSort || Boolean(options.busy);
    const heapMode = mode === "heap" || mode === "heapsort";
    document.querySelectorAll(".traversal-btn").forEach((button) => {
      button.disabled = heapMode || Boolean(options.busy);
    });
  }

  globalThis.UIControls = {
    bindControls,
    readNumber,
    readRandomCount,
    clearNumber,
    setBusy,
    setWaiting,
    setStepMode,
    setMode
  };
})();
