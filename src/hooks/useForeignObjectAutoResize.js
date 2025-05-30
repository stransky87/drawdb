
import { useEffect } from "react";

export function useForeignObjectAutoResize() {
  useEffect(() => {
    const diagram = document.getElementById("diagram");
    if (!diagram) return;

    const applyResizeObserver = (foreignObject) => {
      const content = foreignObject.querySelector("div");
      if (!content) return;

      const observer = new ResizeObserver((entries) => {
        const box = content.getBoundingClientRect();
        foreignObject.setAttribute("height", box.height);
      });

      observer.observe(content);
    };

    diagram.querySelectorAll("foreignObject.auto-resize").forEach(applyResizeObserver);

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.tagName === "foreignObject" && node.classList.contains("auto-resize")) {
            applyResizeObserver(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll("foreignObject.auto-resize").forEach(applyResizeObserver);
          }
        }
      }
    });

    mutationObserver.observe(diagram, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
    };
  }, []);
}
