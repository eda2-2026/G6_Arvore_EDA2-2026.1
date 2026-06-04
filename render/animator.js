(function () {
  class Animator {
    constructor(renderer, logPanel, speed = 3) {
      this.renderer = renderer;
      this.logPanel = logPanel;
      this.speed = speed;
      this.running = false;
      this.stepMode = false;
      this.waiting = false;
      this.highlighted = new Set();
      this.newNodes = new Set();
      this.sortedNodes = new Set();
      this.traversal = null;
      this.onRunningChange = null;
      this.onWaitingChange = null;
      this._resume = null;
    }

    setSpeed(value) {
      this.speed = Math.min(5, Math.max(1, Number(value) || 3));
      document.documentElement.style.setProperty("--anim-speed", `${Math.max(0.12, this.delay / 1000)}s`);
    }

    setStepMode(enabled) {
      this.stepMode = Boolean(enabled);
      if (!this.stepMode && this.waiting) this.nextStep();
    }

    nextStep() {
      if (this._resume) {
        const resume = this._resume;
        this._resume = null;
        resume();
      }
    }

    get delay() {
      const delays = { 1: 1400, 2: 950, 3: 650, 4: 360, 5: 160 };
      return delays[Math.round(this.speed)] || 650;
    }

    async run(steps, data, options = {}) {
      if (this.running) return;
      this.running = true;
      this._emitRunning();
      this.highlighted.clear();
      this.newNodes.clear();
      this.sortedNodes.clear();
      this.traversal = null;

      let currentData = { ...(data || {}) };
      if (!steps.length) {
        this.renderer.render(currentData, this._state(currentData));
      }

      for (let i = 0; i < steps.length; i++) {
        currentData = this._processStep(steps[i], currentData);
        if (this.stepMode && i < steps.length - 1) {
          await this._waitForNext();
        } else if (!this.stepMode) {
          await this._sleep(this.delay * (options.delayFactor || 1));
        }
      }

      this.highlighted.clear();
      this.newNodes.clear();
      if (!options.keepSortedAtEnd) this.sortedNodes.clear();
      if (this.traversal) this.traversal = { ...this.traversal, activeIndex: null };
      if (!options.keepTraversalAtEnd) this.traversal = null;
      this.renderer.render(currentData, this._state(currentData));
      this.running = false;
      this._setWaiting(false);
      this._emitRunning();
    }

    clearMarks(data) {
      this.highlighted.clear();
      this.newNodes.clear();
      this.sortedNodes.clear();
      this.traversal = null;
      this.renderer.render(data, this._state(data || {}));
    }

    clearLog(message = "Pronto.") {
      if (!this.logPanel) return;
      this.logPanel.textContent = message;
    }

    _processStep(step, currentData) {
      let data = currentData;
      if (Array.isArray(step.snapshot)) {
        data = {
          ...data,
          arr: [...step.snapshot],
          heapSize: Number.isInteger(step.heapSize) ? step.heapSize : data.heapSize
        };
      } else if (Number.isInteger(step.heapSize)) {
        data = { ...data, heapSize: step.heapSize };
      }

      let rotationStep = null;
      switch (step.type) {
        case "visit":
        case "highlight":
        case "split":
          this.highlighted.clear();
          this.highlighted.add(step.nodeId);
          break;
        case "insert":
          this.highlighted.clear();
          this.highlighted.add(step.nodeId);
          this.newNodes.add(step.nodeId);
          break;
        case "remove":
          this.highlighted.clear();
          this.highlighted.add(step.nodeId);
          break;
        case "compare":
        case "swap":
          this.highlighted.clear();
          this.highlighted.add(step.a);
          this.highlighted.add(step.b);
          break;
        case "sorted":
          this.sortedNodes.add(step.nodeId);
          this.highlighted.clear();
          this.highlighted.add(step.nodeId);
          break;
        case "traverse":
          this.highlighted.clear();
          this.highlighted.add(step.nodeId);
          this.sortedNodes.add(step.nodeId);
          break;
        case "rotate":
          this.highlighted.clear();
          this.highlighted.add(step.nodeId);
          rotationStep = step;
          break;
        case "message":
        default:
          break;
      }

      if (step.output) {
        this.traversal = {
          label: step.output.label || "Percurso",
          values: step.output.values || [],
          filled: step.output.filled || [],
          activeIndex: step.output.activeIndex ?? step.index ?? null
        };
      }

      if (step.message) this._log(step.message);
      this.renderer.render(data, this._state(data));
      if (rotationStep) this._showRotateIndicator(rotationStep.nodeId, rotationStep.dir);
      return data;
    }

    _state(data) {
      return {
        highlighted: this.highlighted,
        newNodes: this.newNodes,
        sorted: this.sortedNodes,
        heapSize: data?.heapSize,
        traversal: this.traversal
      };
    }

    _showRotateIndicator(nodeId, dir) {
      const group = document.getElementById(nodeId);
      const svg = this.renderer.svg;
      const circle = group?.querySelector("circle");
      if (!group || !circle || !svg) return;

      const x = Number(circle.getAttribute("cx"));
      const y = Number(circle.getAttribute("cy"));
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = dir === "right" ? "R" : "L";
      text.setAttribute("x", x);
      text.setAttribute("y", y - 42);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "18");
      text.setAttribute("font-weight", "850");
      text.setAttribute("fill", "var(--amber)");
      svg.appendChild(text);
      window.setTimeout(() => text.remove(), this.delay * 1.35);
    }

    _log(message) {
      if (!this.logPanel) return;
      if (!this.logPanel.querySelector(".log-line")) this.logPanel.textContent = "";
      const line = document.createElement("div");
      line.className = "log-line";
      line.textContent = message;
      this.logPanel.appendChild(line);
      this.logPanel.scrollTop = this.logPanel.scrollHeight;
    }

    _waitForNext() {
      this._setWaiting(true);
      return new Promise((resolve) => {
        this._resume = () => {
          this._setWaiting(false);
          resolve();
        };
      });
    }

    _setWaiting(value) {
      this.waiting = value;
      if (typeof this.onWaitingChange === "function") this.onWaitingChange(value);
    }

    _emitRunning() {
      if (typeof this.onRunningChange === "function") this.onRunningChange(this.running);
    }

    _sleep(ms) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      return new Promise((resolve) => window.setTimeout(resolve, reduce ? 0 : ms));
    }
  }

  globalThis.Animator = Animator;
})();
