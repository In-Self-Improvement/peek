(function initPeekPrompt(global) {
  const STYLE_KEYS = [
    "font-size",
    "font-weight",
    "color",
    "background-color",
    "padding",
    "margin",
    "border-radius",
    "display",
  ];
  const EMPTY_STYLE = new Set(["", "none", "normal", "auto", "0px", "rgba(0, 0, 0, 0)", "transparent"]);
  const TEST_ATTRS = ["data-testid", "data-test", "data-cy", "data-qa"];

  function cssEscape(value) {
    return global.CSS?.escape ? global.CSS.escape(value) : String(value).replace(/["\\]/g, "\\$&");
  }

  function isUnique(selector, doc) {
    try {
      return doc.querySelectorAll(selector).length === 1;
    } catch {
      return false;
    }
  }

  // 붙여넣었을 때 document.querySelector로 바로 찾을 수 있는 selector를 우선한다
  function toCssSelector(element) {
    const doc = element.ownerDocument;
    for (const attr of TEST_ATTRS) {
      const value = element.getAttribute(attr);
      if (value) {
        const selector = `[${attr}="${cssEscape(value)}"]`;
        if (isUnique(selector, doc)) return selector;
      }
    }
    if (element.id) {
      const selector = `#${cssEscape(element.id)}`;
      if (isUnique(selector, doc)) return selector;
    }

    const parts = [];
    let current = element;
    while (current && current.nodeType === 1 && current !== doc.documentElement) {
      if (current.id) {
        parts.unshift(`#${cssEscape(current.id)}`);
        break;
      }
      const tag = current.tagName.toLowerCase();
      const parent = current.parentElement;
      const sameTag = parent ? Array.from(parent.children).filter((child) => child.tagName === current.tagName) : [];
      parts.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(current) + 1})` : tag);
      const selector = parts.join(" > ");
      if (isUnique(selector, doc)) return selector;
      current = parent;
    }
    return parts.join(" > ");
  }

  function truncate(text, max) {
    const clean = String(text ?? "").replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
  }

  // 여는 태그 + 안쪽 텍스트만. 자식 HTML 전체를 넣으면 프롬프트가 길어지고 개인정보가 섞이기 쉽다
  function elementSnippet(element) {
    const tag = element.tagName.toLowerCase();
    const attrs = Array.from(element.attributes)
      .filter((attr) => !attr.name.startsWith("on") && attr.name !== "style")
      .map((attr) => `${attr.name}="${truncate(attr.value, 60)}"`)
      .join(" ");
    const text = truncate(element.innerText ?? element.textContent, 60);
    return `<${tag}${attrs ? ` ${attrs}` : ""}>${text}</${tag}>`;
  }

  function pickStyles(element) {
    const view = element.ownerDocument.defaultView;
    const computed = view?.getComputedStyle(element);
    if (!computed) return "";
    return STYLE_KEYS.map((key) => [key, computed.getPropertyValue(key)])
      .filter(([, value]) => !EMPTY_STYLE.has(value.trim()))
      .map(([key, value]) => `${key}: ${value.trim()}`)
      .join("; ");
  }

  function describeElement(element, engine) {
    const rect = element.getBoundingClientRect();
    const view = element.ownerDocument.defaultView;
    const hints = (engine?.generateSearchStrategies(element) ?? [])
      .filter((strategy) => strategy.description !== "CSS selector")
      .slice(0, 3)
      .map((strategy) => strategy.label);
    return {
      selector: toCssSelector(element),
      snippet: elementSnippet(element),
      component: engine?.getReactComponentName(element) ?? null,
      hints,
      box: {
        x: Math.round(rect.left + (view?.scrollX ?? 0)),
        y: Math.round(rect.top + (view?.scrollY ?? 0)),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      styles: pickStyles(element),
    };
  }

  function buildMarkdown(page, annotations) {
    const lines = [
      "# UI change requests",
      "",
      `Page: ${page.url}`,
      `Viewport: ${page.width}×${page.height}`,
      "",
      "Apply each request below to the element it points to. Find the element in the codebase using the selector and hints.",
    ];

    annotations.forEach((annotation, index) => {
      const { info } = annotation;
      lines.push("", `## ${index + 1}. ${annotation.note.trim()}`);
      lines.push(`- Element: \`${info.snippet}\``);
      lines.push(`- Selector: \`${info.selector}\``);
      if (info.component) lines.push(`- React component: <${info.component}>`);
      if (info.hints.length) lines.push(`- Search hints: ${info.hints.map((hint) => `\`${hint}\``).join(", ")}`);
      lines.push(`- Position: x ${info.box.x}, y ${info.box.y}, ${info.box.width}×${info.box.height}`);
      if (info.styles) lines.push(`- Current styles: ${info.styles}`);
    });

    return `${lines.join("\n")}\n`;
  }

  global.peekPrompt = { toCssSelector, elementSnippet, describeElement, buildMarkdown };
})(typeof globalThis !== "undefined" ? globalThis : window);
