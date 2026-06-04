(function () {
  class HeapSort {
    sort(values) {
      const arr = [...values];
      const steps = [];
      const n = arr.length;

      if (!n) {
        steps.push({ type: "message", message: "Nada para ordenar", snapshot: [] });
        return { steps, sorted: [] };
      }

      steps.push({ type: "message", message: "Fase 1: construir Max Heap", snapshot: [...arr], heapSize: n });
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        this._siftDown(arr, i, n, steps);
      }

      steps.push({ type: "message", message: "Fase 2: extrair maximos", snapshot: [...arr], heapSize: n });
      for (let end = n - 1; end > 0; end--) {
        const max = arr[0];
        [arr[0], arr[end]] = [arr[end], arr[0]];
        steps.push({
          type: "swap",
          a: 0,
          b: end,
          message: `${max} vai para a posicao final ${end}`,
          snapshot: [...arr],
          heapSize: end + 1
        });
        steps.push({
          type: "sorted",
          nodeId: end,
          message: `${arr[end]} fixado`,
          snapshot: [...arr],
          heapSize: end
        });
        this._siftDown(arr, 0, end, steps);
      }

      steps.push({ type: "sorted", nodeId: 0, message: `${arr[0]} fixado`, snapshot: [...arr], heapSize: 0 });
      steps.push({ type: "message", message: `Resultado: [${arr.join(", ")}]`, snapshot: [...arr], heapSize: 0 });
      return { steps, sorted: arr };
    }

    _siftDown(arr, i, size, steps) {
      while (i < size) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < size) {
          steps.push({ type: "compare", a: largest, b: left, message: `Comparando ${arr[largest]} e ${arr[left]}`, snapshot: [...arr], heapSize: size });
          if (arr[left] > arr[largest]) largest = left;
        }
        if (right < size) {
          steps.push({ type: "compare", a: largest, b: right, message: `Comparando ${arr[largest]} e ${arr[right]}`, snapshot: [...arr], heapSize: size });
          if (arr[right] > arr[largest]) largest = right;
        }

        if (largest === i) break;
        const beforeA = arr[i];
        const beforeB = arr[largest];
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        steps.push({
          type: "swap",
          a: i,
          b: largest,
          message: `Troca ${beforeA} com ${beforeB}`,
          snapshot: [...arr],
          heapSize: size
        });
        i = largest;
      }
    }
  }

  globalThis.HeapSort = HeapSort;
})();
