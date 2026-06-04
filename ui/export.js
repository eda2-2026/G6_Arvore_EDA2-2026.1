(function () {
  function exportJSON(state) {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    downloadBlob(blob, `estado-arvores-${Date.now()}.json`);
  }

  function exportSVG(svgEl) {
    const clone = svgEl.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const content = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([content], { type: "image/svg+xml" });
    downloadBlob(blob, `visualizacao-arvore-${Date.now()}.svg`);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  globalThis.TreeExport = { exportJSON, exportSVG };
})();
