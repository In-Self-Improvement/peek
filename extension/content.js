let isInspectMode = false;
let currentTooltip = null;
let currentHighlight = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleInspect") {
    isInspectMode = !isInspectMode;
    isInspectMode ? enableInspectMode() : disableInspectMode();
  }
});

function enableInspectMode() {
  document.body.style.cursor = 'crosshair';
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown);
}

function disableInspectMode() {
  document.body.style.cursor = '';
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown);
  removeHighlight();
  removeTooltip();
}

function handleMouseOver(e) {
  e.stopPropagation();
  const element = e.target;
  if (element === document.documentElement || element === document.body) return;
  highlightElement(element);
  showTooltip(element);
}

function handleMouseOut(e) {
  if (currentTooltip?.contains(e.relatedTarget)) return;
}

function handleClick(e) {
  if (currentTooltip?.contains(e.target)) return;
  e.preventDefault();
  e.stopPropagation();
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    disableInspectMode();
    isInspectMode = false;
  } else if (/^[1-5]$/.test(e.key)) {
    const index = parseInt(e.key) - 1;
    const items = currentTooltip?.querySelectorAll('.dvl-item');
    if (items?.[index]) items[index].click();
  }
}

function highlightElement(element) {
  removeHighlight();
  const rect = element.getBoundingClientRect();
  const highlight = document.createElement('div');
  highlight.id = 'dvl-highlight';
  highlight.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid #3B82F6;
    pointer-events: none;
    z-index: 2147483646;
    box-sizing: border-box;
  `;
  document.body.appendChild(highlight);
  currentHighlight = highlight;
}

function removeHighlight() {
  currentHighlight?.remove();
  currentHighlight = null;
}

function showTooltip(element) {
  removeTooltip();
  const strategies = generateSearchStrategies(element);

  const tooltip = document.createElement('div');
  tooltip.id = 'dvl-tooltip';
  tooltip.className = 'dvl-tooltip';
  tooltip.innerHTML = `
    <div class="dvl-header">🔍 devlens</div>
    ${strategies.map((s, i) => `
      <div class="dvl-item dvl-conf-${getConfidenceClass(s.confidence)}"
           data-value="${escapeHtml(s.label)}">
        <div class="dvl-label"><span class="dvl-conf-badge">${s.confidence}%</span> ${escapeHtml(s.label)}</div>
        <div class="dvl-desc">${escapeHtml(s.description)} · press ${i + 1}</div>
      </div>
    `).join('')}
  `;

  document.body.appendChild(tooltip);
  currentTooltip = tooltip;

  tooltip.querySelectorAll('.dvl-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      const value = item.dataset.value;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const original = item.innerHTML;
      item.classList.add('dvl-copied');
      item.innerHTML = '<div class="dvl-label">✓ Copied!</div>';
      setTimeout(() => {
        item.classList.remove('dvl-copied');
        item.innerHTML = original;
      }, 600);
    });
  });
}

function removeTooltip() {
  currentTooltip?.remove();
  currentTooltip = null;
}

function getConfidenceClass(c) {
  if (c >= 85) return 'high';
  if (c >= 70) return 'medium';
  if (c >= 50) return 'low';
  return 'vlow';
}

function escapeHtml(text) {
  const div = document.createElement('div');
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
    /^sr-only/
  ];
  return patterns.some(p => p.test(cls));
}

function generateSearchStrategies(element) {
  const strategies = [];
  const classes = (element.className && typeof element.className === 'string')
    ? element.className.split(' ').filter(Boolean)
    : [];

  // 1순위: data-testid, data-cy, data-test, data-qa (95%)
  ['testid', 'cy', 'test', 'qa'].forEach(attr => {
    const value = element.dataset[attr];
    if (value) {
      strategies.push({ label: `data-${attr}="${value}"`, confidence: 95, description: 'Test identifier' });
    }
  });

  // 2순위: ID (90%)
  if (element.id) {
    strategies.push({ label: `id="${element.id}"`, confidence: 90, description: 'Unique ID' });
  }

  // 3순위: PascalCase 컴포넌트 클래스 (85%)
  classes.filter(c => /^[A-Z][a-zA-Z0-9]+/.test(c)).forEach(cls => {
    strategies.push({ label: `className="${cls}"`, confidence: 85, description: 'Component class' });
  });

  // 4순위: name, role, aria-label (80-75%)
  [{ name: 'name', conf: 80 }, { name: 'role', conf: 78 }, { name: 'aria-label', conf: 75 }].forEach(({ name, conf }) => {
    const value = element.getAttribute(name);
    if (value) strategies.push({ label: `${name}="${value}"`, confidence: conf, description: `${name} attribute` });
  });

  // 5순위: 의미있는 일반 클래스 (70%)
  classes.filter(c => c.length > 2 && !/^[A-Z]/.test(c) && !isTailwindUtility(c))
    .slice(0, 2)
    .forEach(cls => strategies.push({ label: `className="${cls}"`, confidence: 70, description: 'CSS class' }));

  // 6순위: tag + type (65%)
  const type = element.getAttribute('type');
  if (type) {
    strategies.push({ label: `${element.tagName.toLowerCase()}[type="${type}"]`, confidence: 65, description: 'Tag with type' });
  }

  // 7순위: 색상 Tailwind (55%)
  const colorClasses = classes.filter(c => /^(bg|text)-(blue|green|red|purple|indigo|pink|yellow)/.test(c));
  if (colorClasses.length > 0) {
    strategies.push({ label: `className="${colorClasses.join(' ')}"`, confidence: 55, description: 'Color classes' });
  }

  // 8순위: CSS Selector (40%)
  strategies.push({ label: generateShortSelector(element), confidence: 40, description: 'CSS selector' });

  return strategies.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

function generateShortSelector(element) {
  const parts = [];
  let current = element;
  let depth = 0;

  while (current && current !== document.body && depth < 3) {
    const tag = current.tagName.toLowerCase();
    if (current.id) { parts.unshift(`#${current.id}`); break; }
    const meaningfulClass = (current.className?.split(' ') || []).find(c => c && !isTailwindUtility(c));
    if (meaningfulClass) {
      parts.unshift(`${tag}.${meaningfulClass}`);
    } else {
      const index = Array.from(current.parentElement?.children || []).indexOf(current) + 1;
      parts.unshift(`${tag}:nth-child(${index})`);
    }
    current = current.parentElement;
    depth++;
  }
  return parts.join(' > ');
}
