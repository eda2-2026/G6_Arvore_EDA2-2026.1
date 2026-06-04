(function () {
  let nextId = 1;

  class BTreeNode {
    constructor(leaf = true) {
      this.keys = [];
      this.children = [];
      this.leaf = leaf;
      this.id = `btree-${nextId++}`;
    }
  }

  class BTree {
    constructor(t = 2) {
      this.t = t;
      this.root = new BTreeNode(true);
    }

    insert(key) {
      const steps = [];
      if (this._contains(key)) {
        steps.push({ type: "message", message: `${key} ja existe na B-Tree` });
        return { steps, root: this.root };
      }

      if (this.root.keys.length === 2 * this.t - 1) {
        const newRoot = new BTreeNode(false);
        newRoot.children.push(this.root);
        this._splitChild(newRoot, 0, steps);
        this.root = newRoot;
        steps.push({ type: "insert", nodeId: newRoot.id, message: "Raiz dividida" });
      }

      this._insertNonFull(this.root, key, steps);
      return { steps, root: this.root };
    }

    _insertNonFull(node, key, steps) {
      steps.push({ type: "visit", nodeId: node.id, message: `Visitando no [${node.keys.join(", ")}]` });
      let i = node.keys.length - 1;

      if (node.leaf) {
        node.keys.push(key);
        node.keys.sort((a, b) => a - b);
        steps.push({ type: "insert", nodeId: node.id, message: `${key} inserido no no folha` });
        return;
      }

      while (i >= 0 && key < node.keys[i]) i--;
      i++;
      if (node.children[i].keys.length === 2 * this.t - 1) {
        this._splitChild(node, i, steps);
        if (key > node.keys[i]) i++;
      }
      this._insertNonFull(node.children[i], key, steps);
    }

    _splitChild(parent, index, steps) {
      const t = this.t;
      const full = parent.children[index];
      const sibling = new BTreeNode(full.leaf);
      const median = full.keys[t - 1];

      sibling.keys = full.keys.slice(t);
      full.keys = full.keys.slice(0, t - 1);

      if (!full.leaf) {
        sibling.children = full.children.slice(t);
        full.children = full.children.slice(0, t);
      }

      parent.keys.splice(index, 0, median);
      parent.children.splice(index + 1, 0, sibling);
      steps.push({ type: "split", nodeId: full.id, message: `Split promove ${median}` });
    }

    search(key) {
      const steps = [];
      const found = this._searchNode(this.root, key, steps);
      if (!found) steps.push({ type: "message", message: `${key} nao foi encontrado` });
      return { steps, found: Boolean(found) };
    }

    _searchNode(node, key, steps) {
      if (!node || (!node.keys.length && node.leaf)) return null;
      steps.push({ type: "visit", nodeId: node.id, message: `Buscando em [${node.keys.join(", ")}]` });
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) i++;
      if (i < node.keys.length && key === node.keys[i]) {
        steps.push({ type: "highlight", nodeId: node.id, message: `${key} encontrado` });
        return { node, index: i };
      }
      if (node.leaf) return null;
      return this._searchNode(node.children[i], key, steps);
    }

    _contains(key) {
      return Boolean(this._searchSilent(this.root, key));
    }

    _searchSilent(node, key) {
      if (!node || (!node.keys.length && node.leaf)) return null;
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) i++;
      if (i < node.keys.length && key === node.keys[i]) return { node, index: i };
      if (node.leaf) return null;
      return this._searchSilent(node.children[i], key);
    }

    inorder() {
      const out = [];
      this._walk(this.root, out);
      return out;
    }

    preorder() {
      const out = [];
      this._pre(this.root, out);
      return out;
    }

    postorder() {
      const out = [];
      this._post(this.root, out);
      return out;
    }

    _walk(node, out) {
      if (!node) return;
      for (let i = 0; i < node.keys.length; i++) {
        this._walk(node.children[i], out);
        out.push(node.keys[i]);
      }
      this._walk(node.children[node.keys.length], out);
    }

    _pre(node, out) {
      if (!node) return;
      out.push(...node.keys);
      node.children.forEach((child) => this._pre(child, out));
    }

    _post(node, out) {
      if (!node) return;
      node.children.forEach((child) => this._post(child, out));
      out.push(...node.keys);
    }

    count(node = this.root) {
      if (!node || (!node.keys.length && node.leaf)) return 0;
      return node.keys.length + node.children.reduce((sum, child) => sum + this.count(child), 0);
    }

    height(node = this.root) {
      if (!node || (!node.keys.length && node.leaf)) return 0;
      if (node.leaf) return 1;
      return 1 + Math.max(...node.children.map((child) => this.height(child)));
    }

    clear() {
      this.root = new BTreeNode(true);
    }

    toJSON() {
      return this.root;
    }
  }

  globalThis.BTree = BTree;
})();
