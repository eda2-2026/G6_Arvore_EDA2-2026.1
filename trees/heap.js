(function () {
  class MaxHeap {
    constructor(values = []) {
      this.arr = [];
      if (values.length) this.buildFrom(values);
    }

    insert(val) {
      const steps = [];
      this.arr.push(val);
      steps.push({
        type: "insert",
        nodeId: this.arr.length - 1,
        message: `${val} entrou no indice ${this.arr.length - 1}`,
        snapshot: [...this.arr],
        heapSize: this.arr.length
      });
      this._siftUp(this.arr.length - 1, steps);
      return { steps, arr: [...this.arr] };
    }

    extractMax() {
      const steps = [];
      if (!this.arr.length) {
        steps.push({ type: "message", message: "Heap vazio" });
        return { steps, val: null, arr: [] };
      }

      const max = this.arr[0];
      const last = this.arr.pop();
      if (this.arr.length) {
        this.arr[0] = last;
      }
      steps.push({
        type: "remove",
        nodeId: 0,
        message: `Maximo extraido: ${max}`,
        snapshot: [...this.arr],
        heapSize: this.arr.length
      });

      this._siftDown(0, this.arr.length, steps);
      return { steps, val: max, arr: [...this.arr] };
    }

    search(val) {
      const steps = [];
      for (let i = 0; i < this.arr.length; i++) {
        steps.push({ type: "visit", nodeId: i, message: `Indice ${i}: ${this.arr[i]}` });
        if (this.arr[i] === val) {
          steps.push({ type: "highlight", nodeId: i, message: `${val} encontrado no indice ${i}` });
          return { steps, found: true };
        }
      }
      steps.push({ type: "message", message: `${val} nao esta no heap` });
      return { steps, found: false };
    }

    buildFrom(values) {
      const steps = [];
      this.arr = [...values];
      steps.push({
        type: "message",
        message: `Build heap com ${this.arr.length} valores`,
        snapshot: [...this.arr],
        heapSize: this.arr.length
      });

      for (let i = Math.floor(this.arr.length / 2) - 1; i >= 0; i--) {
        steps.push({ type: "visit", nodeId: i, message: `Sift-down no indice ${i}` });
        this._siftDown(i, this.arr.length, steps);
      }
      return { steps, arr: [...this.arr] };
    }

    _siftUp(i, steps) {
      while (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        steps.push({ type: "compare", a: i, b: parent, message: `Comparando ${this.arr[i]} com pai ${this.arr[parent]}` });
        if (this.arr[parent] >= this.arr[i]) break;
        const beforeA = this.arr[i];
        const beforeB = this.arr[parent];
        [this.arr[parent], this.arr[i]] = [this.arr[i], this.arr[parent]];
        steps.push({
          type: "swap",
          a: i,
          b: parent,
          message: `Troca ${beforeA} com ${beforeB}`,
          snapshot: [...this.arr],
          heapSize: this.arr.length
        });
        i = parent;
      }
    }

    _siftDown(i, size, steps) {
      while (i < size) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < size) {
          steps.push({ type: "compare", a: largest, b: left, message: `Comparando indices ${largest} e ${left}` });
          if (this.arr[left] > this.arr[largest]) largest = left;
        }
        if (right < size) {
          steps.push({ type: "compare", a: largest, b: right, message: `Comparando indices ${largest} e ${right}` });
          if (this.arr[right] > this.arr[largest]) largest = right;
        }

        if (largest === i) break;
        const beforeA = this.arr[i];
        const beforeB = this.arr[largest];
        [this.arr[i], this.arr[largest]] = [this.arr[largest], this.arr[i]];
        steps.push({
          type: "swap",
          a: i,
          b: largest,
          message: `Troca ${beforeA} com ${beforeB}`,
          snapshot: [...this.arr],
          heapSize: size
        });
        i = largest;
      }
    }

    clear() {
      this.arr = [];
    }

    toJSON() {
      return [...this.arr];
    }
  }

  globalThis.MaxHeap = MaxHeap;
})();
