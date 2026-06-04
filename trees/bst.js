(function () {
  let nextId = 1;

  class BSTNode {
    constructor(val) {
      this.val = val;
      this.left = null;
      this.right = null;
      this.id = `bst-${nextId++}`;
    }
  }

  class BST {
    constructor() {
      this.root = null;
    }

    insert(val) {
      const steps = [];
      if (!this.root) {
        this.root = new BSTNode(val);
        steps.push({ type: "insert", nodeId: this.root.id, message: `Raiz criada com ${val}` });
        return { steps, root: this.root };
      }

      let curr = this.root;
      while (curr) {
        steps.push({ type: "visit", nodeId: curr.id, message: `Comparando ${val} com ${curr.val}` });
        if (val === curr.val) {
          steps.push({ type: "message", message: `${val} ja existe na BST` });
          return { steps, root: this.root };
        }

        if (val < curr.val) {
          if (!curr.left) {
            curr.left = new BSTNode(val);
            steps.push({ type: "insert", nodeId: curr.left.id, message: `${val} entrou a esquerda de ${curr.val}` });
            break;
          }
          curr = curr.left;
        } else {
          if (!curr.right) {
            curr.right = new BSTNode(val);
            steps.push({ type: "insert", nodeId: curr.right.id, message: `${val} entrou a direita de ${curr.val}` });
            break;
          }
          curr = curr.right;
        }
      }

      return { steps, root: this.root };
    }

    remove(val) {
      const steps = [];
      this.root = this._removeNode(this.root, val, steps);
      return { steps, root: this.root };
    }

    _removeNode(node, val, steps) {
      if (!node) {
        steps.push({ type: "message", message: `${val} nao foi encontrado` });
        return null;
      }

      steps.push({ type: "visit", nodeId: node.id, message: `Visitando ${node.val}` });
      if (val < node.val) {
        node.left = this._removeNode(node.left, val, steps);
        return node;
      }
      if (val > node.val) {
        node.right = this._removeNode(node.right, val, steps);
        return node;
      }

      steps.push({ type: "remove", nodeId: node.id, message: `Removendo ${node.val}` });
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      let successor = node.right;
      while (successor.left) {
        successor = successor.left;
        steps.push({ type: "visit", nodeId: successor.id, message: `Buscando sucessor: ${successor.val}` });
      }

      steps.push({ type: "message", message: `Sucessor inorder: ${successor.val}` });
      node.val = successor.val;
      node.right = this._removeNode(node.right, successor.val, steps);
      return node;
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
    }

    toJSON() {
      return this.root;
    }
  }

  globalThis.BST = BST;
})();
