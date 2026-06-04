(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  class SVGRenderer {
    constructor(svgEl, width = 900, height = 520) {
      this.svg = svgEl;
      this.baseW = width;
      this.baseH = height;
      this.W = width;
      this.H = height;
      this.NODE_R = 24;
      this.LEVEL_H = 82;
      this.PADDING = 56;
    }

    render(data, state = {}) {
      this.svg.innerHTML = "";
      const mode = data?.kind || "tree";

      if (mode === "array-sort" || mode === "array-output") {
        this._renderArrayMode(data, state);
        return;
      }

      if (mode === "btree") {
        this._renderBTree(data.root, state);
        return;
      }

      if (Array.isArray(data?.arr)) {
        this._renderHeap(data.arr, state, mode, data.heapSize);
        return;
      }

      if (!data?.root) {
        this._prepareCanvas(this.baseW, this.baseH);
        this._renderEmpty("Arvore vazia");
        return;
      }

      this._renderBinary(data.root, state);
    }

    _renderBinary(root, state) {
      const layout = this._calcBinaryPositions(root);
      const traversal = state.traversal;
      const stripHeight = traversal ? this._traversalStripHeight(traversal.values.length) : 0;
      const height = layout.height + stripHeight;
      this._prepareCanvas(layout.width, height);

      this._renderBinaryEdges(root, layout.positions);
      this._renderBinaryNodes(root, layout.positions, state);
      this._renderTraversalOutput(traversal, height);
    }

    _calcBinaryPositions(root) {
      const raw = {};
      let order = 0;
      let maxDepth = 0;
      const minGap = 68;

      const walk = (node, depth) => {
        if (!node) return;
        walk(node.left, depth + 1);
        raw[node.id] = { order, depth };
        order++;
        maxDepth = Math.max(maxDepth, depth);
        walk(node.right, depth + 1);
      };
      walk(root, 0);

      const count = Math.max(1, order);
      const contentWidth = (count - 1) * minGap;
      const width = Math.max(this.baseW, contentWidth + this.PADDING * 2);
      const startX = (width - contentWidth) / 2;
      const positions = {};

      Object.entries(raw).forEach(([id, info]) => {
        positions[id] = {
          x: startX + info.order * minGap,
          y: 58 + info.depth * this.LEVEL_H
        };
      });

      return {
        positions,
        width,
        height: Math.max(this.baseH, 120 + (maxDepth + 1) * this.LEVEL_H)
      };
    }

    _renderBinaryEdges(node, positions) {
      if (!node) return;
      const from = positions[node.id];
      [node.left, node.right].forEach((child) => {
        if (!child) return;
        const to = positions[child.id];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const line = this._line(
          from.x + (dx / dist) * this.NODE_R,
          from.y + (dy / dist) * this.NODE_R,
          to.x - (dx / dist) * this.NODE_R,
          to.y - (dy / dist) * this.NODE_R
        );
        this.svg.appendChild(line);
        this._renderBinaryEdges(child, positions);
      });
    }

    _renderBinaryNodes(node, positions, state) {
      if (!node) return;
      const pos = positions[node.id];
      const highlighted = state.highlighted || new Set();
      const newNodes = state.newNodes || new Set();
      const sorted = state.sorted || new Set();
      const isHighlighted = highlighted.has(node.id);
      const isNew = newNodes.has(node.id);
      const isSorted = sorted.has(node.id);

      const group = this._el("g", { id: node.id, class: "tree-node" });
      const circle = this._el("circle", {
        cx: pos.x,
        cy: pos.y,
        r: this.NODE_R,
        fill: this._nodeFill(isHighlighted, isNew, isSorted),
        stroke: this._nodeStroke(isHighlighted, isNew, isSorted),
        "stroke-width": 2
      });

      if (isNew) circle.style.animation = "nodeEnter var(--anim-speed) ease";
      if (isHighlighted) circle.style.animation = "nodePulse 0.7s ease infinite";

      const text = this._text(pos.x, pos.y, node.val, 13, "var(--text)");
      text.setAttribute("font-weight", "750");

      group.appendChild(circle);
      group.appendChild(text);

      if (typeof node.height === "number") {
        const badge = this._text(pos.x + this.NODE_R + 12, pos.y - this.NODE_R + 3, `h${node.height}`, 10, "var(--muted)");
        badge.setAttribute("font-weight", "700");
        group.appendChild(badge);
      }

      this.svg.appendChild(group);
      this._renderBinaryNodes(node.left, positions, state);
      this._renderBinaryNodes(node.right, positions, state);
    }

    _renderHeap(arr, state, mode, heapSizeValue) {
      if (!arr.length) {
        this._prepareCanvas(this.baseW, this.baseH);
        this._renderEmpty(mode === "heap-sort" ? "Sem valores para ordenar" : "Heap vazio");
        return;
      }

      const levels = Math.floor(Math.log2(arr.length)) + 1;
      const height = Math.max(this.baseH, 150 + levels * this.LEVEL_H);
      this._prepareCanvas(this.baseW, height);

      const highlighted = state.highlighted || new Set();
      const sorted = state.sorted || new Set();
      const heapSize = Number.isInteger(heapSizeValue) ? heapSizeValue : arr.length;

      for (let i = 1; i < arr.length; i++) {
        const parent = Math.floor((i - 1) / 2);
        const from = this._heapPos(parent);
        const to = this._heapPos(i);
        this.svg.appendChild(this._line(from.x, from.y + this.NODE_R, to.x, to.y - this.NODE_R));
      }

      for (let i = 0; i < arr.length; i++) {
        const pos = this._heapPos(i);
        const isSorted = sorted.has(i) || (mode === "heap-sort" && i >= heapSize);
        const isHighlighted = highlighted.has(i);
        const group = this._el("g", { class: "heap-node", id: `heap-${i}` });
        const circle = this._el("circle", {
          cx: pos.x,
          cy: pos.y,
          r: this.NODE_R,
          fill: this._nodeFill(isHighlighted, false, isSorted),
          stroke: this._nodeStroke(isHighlighted, false, isSorted),
          "stroke-width": 2
        });
        if (isHighlighted) circle.style.animation = "nodePulse 0.7s ease infinite";
        const value = this._text(pos.x, pos.y, arr[i], 13, "var(--text)");
        value.setAttribute("font-weight", "750");
        const index = this._text(pos.x, pos.y + this.NODE_R + 14, `[${i}]`, 10, "var(--muted)");

        group.appendChild(circle);
        group.appendChild(value);
        group.appendChild(index);
        this.svg.appendChild(group);
      }

      this._renderArrayStrip(arr, highlighted, sorted, heapSize, mode, height);
      this._renderTraversalOutput(state.traversal, height);
    }

    _renderArrayMode(data, state) {
      const arr = data.arr || [];
      const count = Math.max(arr.length, data.total || 0, 1);
      const topHeight = this._arrayModeHeight(count);
      const traversal = state.traversal;
      const stripHeight = traversal ? this._traversalStripHeight(traversal.values.length) : 0;
      const height = Math.max(this.baseH, topHeight + stripHeight);
      this._prepareCanvas(this.baseW, height);

      if (!count || (!arr.length && !data.total)) {
        this._renderEmpty("Sem valores para ordenar");
        return;
      }

      const highlighted = state.highlighted || new Set();
      const sorted = state.sorted || new Set();
      const gap = 8;
      const cellW = 54;
      const cellH = 38;
      const usable = this.W - this.PADDING * 2;
      const perRow = Math.max(1, Math.floor((usable + gap) / (cellW + gap)));
      const rows = Math.ceil(count / perRow);
      const startY = 126;

      const title = this._text(this.W / 2, 46, data.title || "Ordenacao", 18, "var(--text)");
      title.setAttribute("font-weight", "850");
      this.svg.appendChild(title);

      const subtitle = this._text(this.W / 2, 72, data.subtitle || "Acompanhe as trocas no array", 12, "var(--muted)");
      subtitle.setAttribute("font-weight", "700");
      this.svg.appendChild(subtitle);

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const rowCount = row === rows - 1 ? count - row * perRow : perRow;
        const rowWidth = rowCount * cellW + (rowCount - 1) * gap;
        const rowStart = (this.W - rowWidth) / 2;
        const x = rowStart + col * (cellW + gap);
        const y = startY + row * (cellH + 22);
        const value = arr[i];
        const isHighlighted = highlighted.has(i);
        const isSorted = sorted.has(i);
        const rect = this._el("rect", {
          x,
          y,
          width: cellW,
          height: cellH,
          rx: 8,
          fill: this._nodeFill(isHighlighted, false, isSorted),
          stroke: this._nodeStroke(isHighlighted, false, isSorted),
          "stroke-width": 2
        });
        if (isHighlighted) rect.style.animation = "nodePulse 0.7s ease infinite";

        const text = this._text(x + cellW / 2, y + cellH / 2, value ?? "", 13, "var(--text)");
        text.setAttribute("font-weight", "800");
        const idx = this._text(x + cellW / 2, y + cellH + 13, i + 1, 9, "var(--muted)");
        idx.setAttribute("font-weight", "700");

        this.svg.appendChild(rect);
        this.svg.appendChild(text);
        this.svg.appendChild(idx);
      }

      this._renderTraversalOutput(traversal, height);
    }

    _heapPos(i) {
      const depth = Math.floor(Math.log2(i + 1));
      const first = 2 ** depth - 1;
      const offset = i - first;
      const count = 2 ** depth;
      const x = this.PADDING + (offset + 0.5) * ((this.W - this.PADDING * 2) / count);
      const y = 58 + depth * this.LEVEL_H;
      return { x, y };
    }

    _renderArrayStrip(arr, highlighted, sorted, heapSize, mode, height) {
      const gap = 6;
      const usable = this.W - this.PADDING * 2;
      const boxW = Math.max(30, Math.min(58, (usable - gap * (arr.length - 1)) / arr.length));
      const startX = (this.W - (arr.length * boxW + (arr.length - 1) * gap)) / 2;
      const y = height - 68;

      const label = this._text(this.PADDING, y - 18, mode === "heap-sort" ? "Array em ordenacao" : "Array do heap", 12, "var(--muted)");
      label.setAttribute("text-anchor", "start");
      label.setAttribute("font-weight", "700");
      this.svg.appendChild(label);

      arr.forEach((value, i) => {
        const isSorted = sorted.has(i) || (mode === "heap-sort" && i >= heapSize);
        const isHighlighted = highlighted.has(i);
        const x = startX + i * (boxW + gap);
        const group = this._el("g", { class: "heap-array-cell" });
        const rect = this._el("rect", {
          x,
          y,
          width: boxW,
          height: 34,
          rx: 7,
          fill: this._nodeFill(isHighlighted, false, isSorted),
          stroke: this._nodeStroke(isHighlighted, false, isSorted),
          "stroke-width": 1.5
        });
        const text = this._text(x + boxW / 2, y + 17, value, 12, "var(--text)");
        text.setAttribute("font-weight", "750");
        group.appendChild(rect);
        group.appendChild(text);
        this.svg.appendChild(group);
      });
    }

    _renderBTree(root, state) {
      if (!root || (!root.keys.length && root.leaf)) {
        this._prepareCanvas(this.baseW, this.baseH);
        this._renderEmpty("B-Tree vazia");
        return;
      }

      const layout = this._calcBTreeLayout(root);
      const traversal = state.traversal;
      const stripHeight = traversal ? this._traversalStripHeight(traversal.values.length, layout.width) : 0;
      this._prepareCanvas(layout.width, layout.height + stripHeight);
      this._renderBTreeEdges(root, layout.positions);
      this._renderBTreeNodes(root, layout.positions, state);
      this._renderTraversalOutput(traversal, layout.height + stripHeight);
    }

    _calcBTreeLayout(root) {
      const positions = {};
      let cursor = 0;
      const leafGap = 118;
      const levelGap = 92;
      let maxDepth = 0;

      const place = (node, depth) => {
        maxDepth = Math.max(maxDepth, depth);
        const childCenters = node.children.map((child) => place(child, depth + 1).x);
        let x;
        if (childCenters.length) {
          x = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
        } else {
          x = this.PADDING + cursor * leafGap;
          cursor++;
        }
        const width = Math.max(54, node.keys.length * 34 + 20);
        positions[node.id] = { x, y: 64 + depth * levelGap, width, height: 38 };
        return { x };
      };

      place(root, 0);
      const width = Math.max(this.baseW, this.PADDING * 2 + Math.max(1, cursor) * leafGap);
      const height = Math.max(this.baseH, 120 + (maxDepth + 1) * levelGap);
      return { positions, width, height };
    }

    _renderBTreeEdges(node, positions) {
      if (!node) return;
      const from = positions[node.id];
      node.children.forEach((child) => {
        const to = positions[child.id];
        this.svg.appendChild(this._line(from.x, from.y + from.height / 2, to.x, to.y - to.height / 2));
        this._renderBTreeEdges(child, positions);
      });
    }

    _renderBTreeNodes(node, positions, state) {
      if (!node) return;
      const highlighted = state.highlighted || new Set();
      const sorted = state.sorted || new Set();
      const isHighlighted = highlighted.has(node.id);
      const isVisited = sorted.has(node.id);
      const pos = positions[node.id];
      const x = pos.x - pos.width / 2;
      const y = pos.y - pos.height / 2;
      const group = this._el("g", { id: node.id, class: "btree-node" });
      const rect = this._el("rect", {
        x,
        y,
        width: pos.width,
        height: pos.height,
        rx: 7,
        fill: isHighlighted ? "var(--node-highlight)" : isVisited ? "var(--node-sorted)" : "var(--node-btree)",
        stroke: isHighlighted ? "#b7791f" : isVisited ? "#0f766e" : "#7c3aed",
        "stroke-width": 2
      });
      if (isHighlighted) rect.style.animation = "nodePulse 0.7s ease infinite";
      group.appendChild(rect);

      node.keys.forEach((key, i) => {
        const keyX = x + 10 + i * 34;
        if (i > 0) {
          const sep = this._line(keyX - 5, y + 6, keyX - 5, y + pos.height - 6);
          sep.setAttribute("stroke-width", 1);
          group.appendChild(sep);
        }
        const text = this._text(keyX + 12, pos.y, key, 13, "var(--text)");
        text.setAttribute("font-weight", "750");
        group.appendChild(text);
      });

      this.svg.appendChild(group);
      node.children.forEach((child) => this._renderBTreeNodes(child, positions, state));
    }

    _renderEmpty(message) {
      const text = this._text(this.W / 2, this.H / 2, message, 16, "var(--muted)");
      text.setAttribute("font-weight", "700");
      this.svg.appendChild(text);
    }

    _arrayModeHeight(count) {
      const gap = 8;
      const cellW = 54;
      const cellH = 38;
      const usable = this.baseW - this.PADDING * 2;
      const perRow = Math.max(1, Math.floor((usable + gap) / (cellW + gap)));
      const rows = Math.max(1, Math.ceil(count / perRow));
      return 150 + rows * (cellH + 22);
    }

    _renderTraversalOutput(output, height) {
      if (!output?.values?.length) return;

      const values = output.values;
      const filled = output.filled || [];
      const activeIndex = output.activeIndex;
      const stripHeight = this._traversalStripHeight(values.length, this.W);
      const gap = 6;
      const cellW = 46;
      const cellH = 32;
      const usable = this.W - this.PADDING * 2;
      const perRow = Math.max(1, Math.floor((usable + gap) / (cellW + gap)));
      const x0 = this.PADDING;
      const y0 = height - stripHeight + 14;

      const bg = this._el("rect", {
        x: this.PADDING - 14,
        y: y0 - 8,
        width: this.W - (this.PADDING - 14) * 2,
        height: stripHeight - 18,
        rx: 8,
        fill: "var(--surface)",
        stroke: "var(--border)",
        "stroke-width": 1
      });
      this.svg.appendChild(bg);

      const label = this._text(x0, y0 + 4, output.label || "Percurso", 12, "var(--muted)");
      label.setAttribute("text-anchor", "start");
      label.setAttribute("font-weight", "750");
      this.svg.appendChild(label);

      values.forEach((value, index) => {
        const row = Math.floor(index / perRow);
        const col = index % perRow;
        const x = x0 + col * (cellW + gap);
        const y = y0 + 24 + row * (cellH + gap);
        const isFilled = filled.includes(index);
        const isActive = activeIndex === index;
        const rect = this._el("rect", {
          x,
          y,
          width: cellW,
          height: cellH,
          rx: 7,
          fill: isActive ? "var(--node-highlight)" : isFilled ? "var(--node-sorted)" : "var(--surface-soft)",
          stroke: isActive ? "#b7791f" : isFilled ? "#0f766e" : "var(--border)",
          "stroke-width": 1.5
        });
        if (isActive) rect.style.animation = "nodePulse 0.7s ease infinite";

        const text = this._text(x + cellW / 2, y + cellH / 2, isFilled || isActive ? value : "", 12, "var(--text)");
        text.setAttribute("font-weight", "750");

        const idx = this._text(x + cellW / 2, y + cellH + 10, index + 1, 9, "var(--muted)");
        idx.setAttribute("font-weight", "700");

        this.svg.appendChild(rect);
        this.svg.appendChild(text);
        this.svg.appendChild(idx);
      });
    }

    _traversalStripHeight(count, width = this.baseW) {
      const gap = 6;
      const cellW = 46;
      const cellH = 32;
      const usable = width - this.PADDING * 2;
      const perRow = Math.max(1, Math.floor((usable + gap) / (cellW + gap)));
      const rows = Math.max(1, Math.ceil(count / perRow));
      return 56 + rows * (cellH + gap);
    }

    _binaryDepth(node) {
      return node ? 1 + Math.max(this._binaryDepth(node.left), this._binaryDepth(node.right)) : 0;
    }

    _prepareCanvas(width, height) {
      this.W = width;
      this.H = height;
      this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    _nodeFill(highlighted, fresh, sorted) {
      if (fresh) return "var(--node-new)";
      if (highlighted) return "var(--node-highlight)";
      if (sorted) return "var(--node-sorted)";
      return "var(--node-normal)";
    }

    _nodeStroke(highlighted, fresh, sorted) {
      if (fresh) return "#138a4e";
      if (highlighted) return "#b7791f";
      if (sorted) return "#0f766e";
      return "#2563eb";
    }

    _line(x1, y1, x2, y2) {
      const line = this._el("line", {
        x1,
        y1,
        x2,
        y2,
        stroke: "var(--edge-color)",
        "stroke-width": 1.6,
        "stroke-linecap": "round"
      });
      line.style.animation = "edgeDraw var(--anim-speed) ease both";
      line.style.strokeDasharray = "120";
      return line;
    }

    _text(x, y, value, size, fill) {
      const text = this._el("text", {
        x,
        y,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": size,
        fill
      });
      text.textContent = value;
      return text;
    }

    _el(name, attrs = {}) {
      const el = document.createElementNS(SVG_NS, name);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      return el;
    }
  }

  globalThis.SVGRenderer = SVGRenderer;
})();
