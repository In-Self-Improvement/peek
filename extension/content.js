let isInspectMode = false;
let currentTooltip = null;
let currentHighlight = null;
const selectorEngine = globalThis.peekSelectorEngine;

if (!selectorEngine) {
  console.error('[peek] selector engine was not loaded before content script');
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleInspect") {
    isInspectMode = !isInspectMode;
    if (isInspectMode) {
      enableInspectMode();
    } else {
      disableInspectMode();
    }
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
    const items = currentTooltip?.querySelectorAll('.pk-item');
    if (items?.[index]) items[index].click();
  }
}

function highlightElement(element) {
  removeHighlight();
  const rect = element.getBoundingClientRect();
  const highlight = document.createElement('div');
  highlight.id = 'pk-highlight';
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
  const strategies = selectorEngine?.generateSearchStrategies(element) ?? [];

  const tooltip = document.createElement('div');
  tooltip.id = 'pk-tooltip';
  tooltip.className = 'pk-tooltip';
  tooltip.innerHTML = `
    <div class="pk-header">🔍 peek</div>
    ${strategies.map((strategy, i) => `
      <div class="pk-item pk-conf-${selectorEngine?.getConfidenceClass(strategy.confidence) ?? 'vlow'}"
           data-value="${selectorEngine?.escapeHtml(strategy.label) ?? strategy.label}">
        <div class="pk-label"><span class="pk-conf-badge">${strategy.confidence}%</span> ${selectorEngine?.escapeHtml(strategy.label) ?? strategy.label}</div>
        <div class="pk-desc">${selectorEngine?.escapeHtml(strategy.description) ?? strategy.description} · press ${i + 1}</div>
      </div>
    `).join('')}
  `;

  document.body.appendChild(tooltip);
  currentTooltip = tooltip;

  tooltip.querySelectorAll('.pk-item').forEach(item => {
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
      item.classList.add('pk-copied');
      item.innerHTML = '<div class="pk-label">✓ Copied!</div>';
      setTimeout(() => {
        item.classList.remove('pk-copied');
        item.innerHTML = original;
      }, 600);
    });
  });
}

function removeTooltip() {
  currentTooltip?.remove();
  currentTooltip = null;
}
