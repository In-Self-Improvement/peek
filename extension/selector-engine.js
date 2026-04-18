(function initPeekSelectorEngine(global) {
  function getConfidenceClass(confidence) {
    if (confidence >= 85) return "high";
    if (confidence >= 70) return "medium";
    if (confidence >= 50) return "low";
    return "vlow";
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function isTailwindUtility(cls) {
    const patterns = [
      /^(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky)/,
      /^(items|justify|content|self|place)-/,
      /^[pm][xytblr]?-/,
      /^w-|^h-|^min-|^max-/,
      /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)/,
      /^font-(thin|light|normal|medium|semibold|bold|extrabold)/,
      /^leading-|^tracking-/,
      /^rounded/,
      /^shadow/,
      /^border(?!-(blue|green|red|purple|indigo|pink|yellow))/,
      /^gap-|^space-/,
      /^overflow-/,
      /^cursor-/,
      /^transition|^duration-|^ease-/,
      /^opacity-/,
      /^z-/,
      /^col-|^row-/,
      /^sr-only/,
    ];
    return patterns.some((pattern) => pattern.test(cls));
  }

  function generateShortSelector(element) {
    const parts = [];
    let current = element;
    let depth = 0;

    while (current && current !== document.body && depth < 3) {
      const tag = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(`#${current.id}`);
        break;
      }
      const meaningfulClass = (current.className?.split(" ") || []).find(
        (className) => className && !isTailwindUtility(className),
      );
      if (meaningfulClass) {
        parts.unshift(`${tag}.${meaningfulClass}`);
      } else {
        const index =
          Array.from(current.parentElement?.children || []).indexOf(current) + 1;
        parts.unshift(`${tag}:nth-child(${index})`);
      }
      current = current.parentElement;
      depth++;
    }

    return parts.join(" > ");
  }

  function generateSearchStrategies(element) {
    const strategies = [];
    const classes =
      element.className && typeof element.className === "string"
        ? element.className.split(" ").filter(Boolean)
        : [];

    ["testid", "cy", "test", "qa"].forEach((attr) => {
      const value = element.dataset[attr];
      if (value) {
        strategies.push({
          label: `data-${attr}="${value}"`,
          confidence: 95,
          description: "Test identifier",
        });
      }
    });

    if (element.id) {
      strategies.push({
        label: `id="${element.id}"`,
        confidence: 90,
        description: "Unique ID",
      });
    }

    classes
      .filter((className) => /^[A-Z][a-zA-Z0-9]+/.test(className))
      .forEach((className) => {
        strategies.push({
          label: `className="${className}"`,
          confidence: 85,
          description: "Component class",
        });
      });

    [
      { name: "name", confidence: 80 },
      { name: "role", confidence: 78 },
      { name: "aria-label", confidence: 75 },
    ].forEach(({ name, confidence }) => {
      const value = element.getAttribute(name);
      if (value) {
        strategies.push({
          label: `${name}="${value}"`,
          confidence,
          description: `${name} attribute`,
        });
      }
    });

    classes
      .filter(
        (className) =>
          className.length > 2 &&
          !/^[A-Z]/.test(className) &&
          !isTailwindUtility(className),
      )
      .slice(0, 2)
      .forEach((className) =>
        strategies.push({
          label: `className="${className}"`,
          confidence: 70,
          description: "CSS class",
        }),
      );

    const type = element.getAttribute("type");
    if (type) {
      strategies.push({
        label: `${element.tagName.toLowerCase()}[type="${type}"]`,
        confidence: 65,
        description: "Tag with type",
      });
    }

    const colorClasses = classes.filter((className) =>
      /^(bg|text)-(blue|green|red|purple|indigo|pink|yellow)/.test(className),
    );
    if (colorClasses.length > 0) {
      strategies.push({
        label: `className="${colorClasses.join(" ")}"`,
        confidence: 55,
        description: "Color classes",
      });
    }

    strategies.push({
      label: generateShortSelector(element),
      confidence: 40,
      description: "CSS selector",
    });

    return strategies.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  global.peekSelectorEngine = {
    getConfidenceClass,
    escapeHtml,
    isTailwindUtility,
    generateSearchStrategies,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
