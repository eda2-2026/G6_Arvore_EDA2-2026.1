(function () {
  class TraversalPanel {
    constructor(containerEl) {
      this.container = containerEl;
    }

    show(label, values) {
      this.container.hidden = false;
      this.container.textContent = "";

      const title = document.createElement("span");
      title.className = "traversal-label";
      title.textContent = `${label}:`;
      this.container.appendChild(title);

      values.forEach((value, index) => {
        const chip = document.createElement("span");
        chip.className = "order-chip";
        chip.dataset.index = String(index);
        chip.textContent = value;
        this.container.appendChild(chip);
      });
    }

    async animate(delay = 280) {
      const chips = [...this.container.querySelectorAll(".order-chip")];
      for (const chip of chips) {
        chip.classList.add("visiting");
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        chip.classList.remove("visiting");
        chip.classList.add("visited");
      }
    }

    hide() {
      this.container.hidden = true;
      this.container.textContent = "";
    }
  }

  globalThis.TraversalPanel = TraversalPanel;
})();
