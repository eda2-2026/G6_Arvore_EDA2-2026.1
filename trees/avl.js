(function () {
  let nextId = 1;

  class AVLNode {
    constructor(val) {
      this.val = val;
      this.left = null;
      this.right = null;
      this.height = 1;
      this.id = `avl-${nextId++}`;
    }
  }

  class AVL {
    constructor() {
      this.root = null;
      this.rotations = 0;
    }

    insert(val) {
      const steps = [];
      this.root = this._insert(this.root, val, steps);
      return { steps, root: this.root };
    }

    _insert(node, val, steps) {
      if (!node) {
        const created = new AVLNode(val);
        steps.push({ type: "insert", nodeId: created.id, message: `${val} inserido` });
        return created;
      }

      steps.push({ type: "visit", nodeId: node.id, message: `Comparando ${val} com ${node.val}` });
      if (val < node.val) {
        node.left = this._insert(node.left, val, steps);
      } else if (val > node.val) {
        node.right = this._insert(node.right, val, steps);
      } else {
        steps.push({ type: "message", message: `${val} ja existe na AVL` });
        return node;
      }

      return this._balance(node, steps);
    }

    remove(val) {
      const steps = [];
      this.root = this._remove(this.root, val, steps);
      return { steps, root: this.root };
    }

    _remove(node, val, steps) {
      if (!node) {
        steps.push({ type: "message", message: `${val} nao foi encontrado` });
        return null;
      }

      steps.push({ type: "visit", nodeId: node.id, message: `Visitando ${node.val}` });
      if (val < node.val) {
        node.left = this._remove(node.left, val, steps);
      } else if (val > node.val) {
        node.right = this._remove(node.right, val, steps);
      } else {
        steps.push({ type: "remove", nodeId: node.id, message: `Removendo ${val}` });
        if (!node.left || !node.right) {
          return node.left || node.right;
        }

        let successor = node.right;
        while (successor.left) {
          successor = successor.left;
          steps.push({ type: "visit", nodeId: successor.id, message: `Sucessor candidato: ${successor.val}` });
        }
        node.val = successor.val;
        node.right = this._remove(node.right, successor.val, steps);
      }

      return this._balance(node, steps);
    }

    search(val) {
      const steps = [];
      let curr = this.root;
      while (curr) {
        steps.push({ type: "visit", nodeId: curr.id, message: `Verificando ${curr.val}` });
        if (val === curr.val) {
          steps.push({ type: "highlight", nodeId: curr.id, message: `${val} encontrado` });
          return { steps, found: true };
        }
        curr = val < curr.val ? curr.left : curr.right;
      }
      steps.push({ type: "message", message: `${val} nao foi encontrado` });
      return { steps, found: false };
    }

    _height(node) {
      return node ? node.height : 0;
    }

    _balanceFactor(node) {
      return node ? this._height(node.left) - this._height(node.right) : 0;
    }

    _updateHeight(node) {
      if (node) {
        node.height = 1 + Math.max(this._height(node.left), this._height(node.right));
      }
    }

    _balance(node, steps) {
      if (!node) return node;
      this._updateHeight(node);
      const bf = this._balanceFactor(node);

      if (bf > 1) {
        if (this._balanceFactor(node.left) < 0) {
          steps.push({ type: "message", message: `Rotacao dupla esquerda-direita em ${node.val}` });
          node.left = this._rotateLeft(node.left, steps);
        }
        return this._rotateRight(node, steps);
      }

      if (bf < -1) {
        if (this._balanceFactor(node.right) > 0) {
          steps.push({ type: "message", message: `Rotacao dupla direita-esquerda em ${node.val}` });
          node.right = this._rotateRight(node.right, steps);
        }
        return this._rotateLeft(node, steps);
      }

      return node;
    }

    _rotateRight(y, steps) {
      const x = y.left;
      const transfer = x.right;
      x.right = y;
      y.left = transfer;
      this._updateHeight(y);
      this._updateHeight(x);
      this.rotations++;
      steps.push({ type: "rotate", nodeId: y.id, dir: "right", message: `Rotacao direita em ${y.val}` });
      return x;
    }

    _rotateLeft(x, steps) {
      const y = x.right;
      const transfer = y.left;
      y.left = x;
      x.right = transfer;
      this._updateHeight(x);
      this._updateHeight(y);
      this.rotations++;
      steps.push({ type: "rotate", nodeId: x.id, dir: "left", message: `Rotacao esquerda em ${x.val}` });
      return y;
    }

    inorder() {
      const out = [];
      this._walk(this.root, "inorder", out);
      return out;
    }

    preorder() {
      const out = [];
      this._walk(this.root, "preorder", out);
      return out;
    }

    postorder() {
      const out = [];
      this._walk(this.root, "postorder", out);
      return out;
    }

    _walk(node, type, out) {
      if (!node) return;
      if (type === "preorder") out.push(node.val);
      this._walk(node.left, type, out);
      if (type === "inorder") out.push(node.val);
      this._walk(node.right, type, out);
      if (type === "postorder") out.push(node.val);
    }

    height(node = this.root) {
      return node ? 1 + Math.max(this.height(node.left), this.height(node.right)) : 0;
    }

    count(node = this.root) {
      return node ? 1 + this.count(node.left) + this.count(node.right) : 0;
    }

    clear() {
      this.root = null;
      this.rotations = 0;
    }

    toJSON() {
      return this.root;
    }
  }

  globalThis.AVL = AVL;
})();
