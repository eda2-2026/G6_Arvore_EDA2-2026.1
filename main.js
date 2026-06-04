(function () {
  const modeLabel = {
    bst: "BST",
    avl: "AVL",
    heap: "Heap Max",
    heapsort: "HeapSort",
    btree: "B-Tree"
  };

  const state = {
    mode: "bst",
    trees: {
      bst: new BST(),
      avl: new AVL(),
      heap: new MaxHeap(),
      btree: new BTree(2)
    },
    sortDisplay: null,
    sortHeapSize: null,
    comparisons: 0,
    busy: false
  };

  let renderer;
  let animator;
  let traversalPanel;

  function init() {
    renderer = new SVGRenderer(document.getElementById("tree-svg"));
    animator = new Animator(renderer, document.getElementById("log-panel"), Number(document.getElementById("speed-input").value));
    traversalPanel = new TraversalPanel(document.getElementById("traversal-panel"));

    animator.onRunningChange = (running) => {
      state.busy = running;
      UIControls.setBusy(running);
      UIControls.setWaiting(animator.waiting);
      updateModeControls();
    };
    animator.onWaitingChange = (waiting) => UIControls.setWaiting(waiting);

    UIControls.bindControls({
      insert: doInsert,
      remove: doRemove,
      search: doSearch,
      random: doRandom,
      clear: doClear,
      sort: doSort,
      traversal: doTraversal,
      switchMode,
      speed: (value) => animator.setSpeed(value),
      stepMode: setStepMode,
      nextStep: () => animator.nextStep(),
      exportJSON: exportJSON,
      exportSVG: () => TreeExport.exportSVG(document.getElementById("tree-svg"))
    });

    setStepMode(false);
    renderCurrent("Pronto. Insira valores para comecar.");
    window.eda2Visualizer = state;
  }

  async function doInsert() {
    if (state.busy) return;
    const value = UIControls.readNumber();
    if (value === null) {
      log("Digite um numero valido.");
      return;
    }

    let result;
    if (state.mode === "bst") {
      result = state.trees.bst.insert(value);
    } else if (state.mode === "avl") {
      result = state.trees.avl.insert(value);
    } else if (state.mode === "btree") {
      result = state.trees.btree.insert(value);
    } else {
      result = state.trees.heap.insert(value);
      state.sortDisplay = null;
      state.sortHeapSize = null;
    }

    UIControls.clearNumber();
    traversalPanel.hide();
    await play(result.steps, getCurrentData());
  }

  async function doRemove() {
    if (state.busy) return;

    if (state.mode === "btree") {
      log("Remocao em B-Tree ficou como extensao bonus.");
      return;
    }

    let result;
    if (state.mode === "heap" || state.mode === "heapsort") {
      result = state.trees.heap.extractMax();
      state.sortDisplay = null;
      state.sortHeapSize = null;
    } else {
      const value = UIControls.readNumber();
      if (value === null) {
        log("Digite o valor a remover.");
        return;
      }
      result = state.mode === "bst" ? state.trees.bst.remove(value) : state.trees.avl.remove(value);
      UIControls.clearNumber();
    }

    traversalPanel.hide();
    await play(result.steps, getCurrentData());
  }

  async function doSearch() {
    if (state.busy) return;
    const value = UIControls.readNumber();
    if (value === null) {
      log("Digite o valor a buscar.");
      return;
    }

    let result;
    if (state.mode === "bst") result = state.trees.bst.search(value);
    if (state.mode === "avl") result = state.trees.avl.search(value);
    if (state.mode === "btree") result = state.trees.btree.search(value);
    if (state.mode === "heap" || state.mode === "heapsort") result = state.trees.heap.search(value);

    traversalPanel.hide();
    await play(result.steps, getCurrentData());
  }

  async function doTraversal(type) {
    if (state.busy) return;
    const entries = getTraversalEntries(type);
    if (!entries) {
      log("Percursos estao disponiveis para BST, AVL e B-Tree.");
      return;
    }

    if (!entries.length) {
      log("Estrutura vazia.");
      return;
    }

    const labels = { inorder: "Inorder", preorder: "Preorder", postorder: "Postorder" };
    const values = entries.map((entry) => entry.value);
    const label = labels[type];
    const steps = buildTraversalOutputSteps(values, label);
    const data = {
      kind: "array-output",
      arr: Array(values.length).fill(null),
      total: values.length,
      title: `${label} - ${modeLabel[state.mode]}`,
      subtitle: "A sequencia do percurso aparece no topo e no resultado abaixo"
    };

    traversalPanel.hide();
    await play(steps, data, { keepSortedAtEnd: true, keepTraversalAtEnd: true });
  }

  async function doSort() {
    if (state.busy) return;
    if (state.mode === "heap" || state.mode === "heapsort") {
      await doHeapSort();
      return;
    }

    const entries = getTraversalEntries("inorder");
    if (!entries?.length) {
      log("Estrutura vazia.");
      return;
    }

    const target = entries.map((entry) => entry.value);
    const initial = getInitialSortValues();
    const steps = buildTreeSortSteps(initial, target, "Ordenacao (Inorder)");
    const data = {
      kind: "array-sort",
      arr: [...initial],
      total: target.length,
      title: `Ordenando ${modeLabel[state.mode]}`,
      subtitle: "O array de cima troca valores ate chegar no Inorder"
    };

    traversalPanel.hide();
    await play(steps, data, { keepSortedAtEnd: true, keepTraversalAtEnd: true, delayFactor: 1.15 });
  }

  async function doHeapSort() {
    if (state.busy) return;
    const values = [...state.trees.heap.arr];
    if (values.length < 2) {
      log("Insira pelo menos dois valores no heap.");
      return;
    }

    if (state.mode !== "heapsort") switchMode("heapsort", { keepLog: true });
    state.sortDisplay = [...values];
    state.sortHeapSize = values.length;
    traversalPanel.hide();

    const result = new HeapSort().sort(values);
    await play(result.steps, { kind: "heap-sort", arr: [...values], heapSize: values.length }, { keepSortedAtEnd: true, delayFactor: 1.55 });
    state.sortDisplay = [...result.sorted];
    state.sortHeapSize = 0;
    traversalPanel.show("Resultado", result.sorted);
    updateStats();
  }

  async function doRandom() {
    if (state.busy) return;
    clearCurrent(false);
    const amount = UIControls.readRandomCount();
    const values = uniqueRandomValues(amount);
    for (const value of values) {
      document.getElementById("value-input").value = value;
      await doInsert();
      await sleep(Math.max(40, animator.delay * 0.25));
    }
  }

  function doClear() {
    if (state.busy) return;
    clearCurrent(true);
  }

  function clearCurrent(shouldRender) {
    if (state.mode === "bst") state.trees.bst.clear();
    if (state.mode === "avl") state.trees.avl.clear();
    if (state.mode === "btree") state.trees.btree.clear();
    if (state.mode === "heap" || state.mode === "heapsort") {
      state.trees.heap.clear();
      state.sortDisplay = null;
      state.sortHeapSize = null;
    }
    state.comparisons = 0;
    traversalPanel.hide();
    if (shouldRender) renderCurrent(`${modeLabel[state.mode]} limpa.`);
  }

  function switchMode(mode, options = {}) {
    if (state.busy || !modeLabel[mode]) return;
    state.mode = mode;
    traversalPanel.hide();
    const message = options.keepLog ? null : `Modo ${modeLabel[mode]}.`;
    renderCurrent(message);
  }

  function setStepMode(enabled) {
    animator.setStepMode(enabled);
    UIControls.setStepMode(enabled);
    UIControls.setWaiting(false);
  }

  async function play(steps, data, options = {}) {
    state.comparisons = steps.filter((step) => step.type === "compare" || step.type === "visit").length;
    animator.clearLog("Executando operacao...");
    await animator.run(steps, data, options);
    updateStats();
    updateModeControls();
  }

  function renderCurrent(message) {
    if (message) animator?.clearLog(message);
    animator?.clearMarks(getCurrentData());
    updateStats();
    updateModeControls();
  }

  function getCurrentData() {
    if (state.mode === "bst") return { kind: "tree", root: state.trees.bst.root };
    if (state.mode === "avl") return { kind: "tree", root: state.trees.avl.root };
    if (state.mode === "btree") return { kind: "btree", root: state.trees.btree.root };
    if (state.mode === "heapsort") {
      const arr = state.sortDisplay ? [...state.sortDisplay] : [...state.trees.heap.arr];
      return {
        kind: "heap-sort",
        arr,
        heapSize: Number.isInteger(state.sortHeapSize) ? state.sortHeapSize : arr.length
      };
    }
    return { kind: "heap", arr: [...state.trees.heap.arr], heapSize: state.trees.heap.arr.length };
  }

  function getTraversalEntries(type) {
    if (state.mode === "bst") return getBinaryTraversalEntries(state.trees.bst.root, type);
    if (state.mode === "avl") return getBinaryTraversalEntries(state.trees.avl.root, type);
    if (state.mode === "btree") return getBTreeTraversalEntries(state.trees.btree.root, type);
    return null;
  }

  function getBinaryTraversalEntries(root, type) {
    const entries = [];
    const visit = (node) => {
      if (node) entries.push({ nodeId: node.id, value: node.val });
    };
    const walk = (node) => {
      if (!node) return;
      if (type === "preorder") visit(node);
      walk(node.left);
      if (type === "inorder") visit(node);
      walk(node.right);
      if (type === "postorder") visit(node);
    };
    walk(root);
    return entries;
  }

  function getBTreeTraversalEntries(root, type) {
    const entries = [];
    const pushKeys = (node) => {
      node.keys.forEach((value) => entries.push({ nodeId: node.id, value }));
    };
    const walk = (node) => {
      if (!node || (!node.keys.length && node.leaf)) return;
      if (type === "preorder") pushKeys(node);
      if (type === "inorder") {
        for (let i = 0; i < node.keys.length; i++) {
          walk(node.children[i]);
          entries.push({ nodeId: node.id, value: node.keys[i] });
        }
        walk(node.children[node.keys.length]);
        return;
      }
      node.children.forEach(walk);
      if (type === "postorder") pushKeys(node);
    };
    walk(root);
    return entries;
  }

  function getInitialSortValues() {
    if (state.mode === "bst") return getBinaryLevelOrderValues(state.trees.bst.root);
    if (state.mode === "avl") return getBinaryLevelOrderValues(state.trees.avl.root);
    if (state.mode === "btree") return getBTreeTraversalEntries(state.trees.btree.root, "preorder").map((entry) => entry.value);
    return [...state.trees.heap.arr];
  }

  function getBinaryLevelOrderValues(root) {
    const values = [];
    const queue = root ? [root] : [];
    while (queue.length) {
      const node = queue.shift();
      values.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return values;
  }

  function buildTraversalOutputSteps(values, label) {
    const display = Array(values.length).fill(null);
    const steps = [{
      type: "message",
      message: `${label} iniciado`,
      snapshot: [...display],
      output: { label, values, filled: [], activeIndex: null }
    }];

    values.forEach((value, index) => {
      display[index] = value;
      steps.push({
        type: "traverse",
        nodeId: index,
        index,
        snapshot: [...display],
        output: {
          label,
          values,
          filled: Array.from({ length: index + 1 }, (_, i) => i),
          activeIndex: index
        },
        message: `${value} -> posicao ${index + 1}`
      });
    });

    steps.push({
      type: "message",
      message: `${label}: [${values.join(", ")}]`,
      snapshot: [...display],
      output: {
        label,
        values,
        filled: Array.from({ length: values.length }, (_, i) => i),
        activeIndex: null
      }
    });

    return steps;
  }

  function buildTreeSortSteps(initialValues, sortedValues, label) {
    const arr = [...initialValues];
    const fixed = [];
    const steps = [{
      type: "message",
      message: `Array inicial: [${arr.join(", ")}]`,
      snapshot: [...arr],
      output: { label, values: sortedValues, filled: [], activeIndex: null }
    }];

    sortedValues.forEach((targetValue, index) => {
      const found = arr.findIndex((value, candidate) => candidate >= index && value === targetValue);
      if (found < 0) return;

      if (found !== index) {
        steps.push({
          type: "compare",
          a: index,
          b: found,
          message: `Procurando ${targetValue}: posicoes ${index + 1} e ${found + 1}`,
          snapshot: [...arr],
          output: { label, values: sortedValues, filled: [...fixed], activeIndex: index }
        });
        [arr[index], arr[found]] = [arr[found], arr[index]];
        steps.push({
          type: "swap",
          a: index,
          b: found,
          message: `Troca ${arr[found]} com ${arr[index]}`,
          snapshot: [...arr],
          output: { label, values: sortedValues, filled: [...fixed], activeIndex: index }
        });
      }

      fixed.push(index);
      steps.push({
        type: "sorted",
        nodeId: index,
        message: `${arr[index]} fixado na posicao ${index + 1}`,
        snapshot: [...arr],
        output: { label, values: sortedValues, filled: [...fixed], activeIndex: index }
      });
    });

    steps.push({
      type: "message",
      message: `${label}: [${sortedValues.join(", ")}]`,
      snapshot: [...arr],
      output: {
        label,
        values: sortedValues,
        filled: Array.from({ length: sortedValues.length }, (_, i) => i),
        activeIndex: null
      }
    });

    return steps;
  }

  function updateStats() {
    const data = getCurrentData();
    let nodes = 0;
    let height = 0;
    let rotations = 0;

    if (state.mode === "bst") {
      nodes = state.trees.bst.count();
      height = state.trees.bst.height();
    } else if (state.mode === "avl") {
      nodes = state.trees.avl.count();
      height = state.trees.avl.height();
      rotations = state.trees.avl.rotations;
    } else if (state.mode === "btree") {
      nodes = state.trees.btree.count();
      height = state.trees.btree.height();
    } else {
      nodes = data.arr.length;
      height = nodes ? Math.floor(Math.log2(nodes)) + 1 : 0;
    }

    document.getElementById("stat-nodes").textContent = nodes;
    document.getElementById("stat-height").textContent = height;
    document.getElementById("stat-rotations").textContent = rotations;
    document.getElementById("stat-comparisons").textContent = state.comparisons;
    document.getElementById("stat-mode").textContent = modeLabel[state.mode];
  }

  function updateModeControls() {
    UIControls.setMode(state.mode, {
      busy: state.busy,
      canSort: getCurrentValueCount() > 1
    });
  }

  function getCurrentValueCount() {
    if (state.mode === "bst") return state.trees.bst.count();
    if (state.mode === "avl") return state.trees.avl.count();
    if (state.mode === "btree") return state.trees.btree.count();
    return state.trees.heap.arr.length;
  }

  function exportJSON() {
    TreeExport.exportJSON({
      mode: state.mode,
      timestamp: new Date().toISOString(),
      bst: state.trees.bst.toJSON(),
      avl: state.trees.avl.toJSON(),
      heap: state.trees.heap.toJSON(),
      btree: state.trees.btree.toJSON()
    });
  }

  function log(message) {
    animator.clearLog(message);
  }

  function uniqueRandomValues(amount) {
    const set = new Set();
    while (set.size < amount) {
      set.add(Math.floor(Math.random() * 90) + 5);
    }
    return [...set];
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
