(function initPeekContent() {
  // 아이콘을 다시 눌러 재주입돼도 리스너가 두 번 붙지 않게
  if (globalThis.__peekContentLoaded) return;
  globalThis.__peekContentLoaded = true;

  const engine = globalThis.peekSelectorEngine;
  const prompt = globalThis.peekPrompt;
  if (!engine || !prompt) {
    console.error("[peek] selector engine or prompt builder was not loaded before content script");
    return;
  }

  let active = false;
  let host = null;
  let ui = null;
  let hoverEl = null;
  let draft = null; // { el, index } index가 있으면 기존 메모 수정
  let annotations = []; // { el, note, info }
  let frame = 0;

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== "toggleInspect") return;
    if (active) deactivate();
    else activate();
  });

  function activate() {
    active = true;
    mountUi();
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("mousedown", blockPage, true);
    document.addEventListener("pointerdown", blockPage, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    render();
  }

  function deactivate() {
    active = false;
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("mousedown", blockPage, true);
    document.removeEventListener("pointerdown", blockPage, true);
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    host?.remove();
    host = null;
    ui = null;
    hoverEl = null;
    draft = null;
    // ponytail: 메모는 탭이 살아 있는 동안만 메모리에 둔다. 새로고침 후 복원이 필요하면 sessionStorage로
  }

  function mountUi() {
    host = document.createElement("peek-root");
    host.style.cssText = "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <link rel="stylesheet" href="${chrome.runtime.getURL("content.css")}">
      <div class="hl" hidden></div>
      <div class="pins"></div>
      <form class="pop" hidden>
        <textarea rows="3" placeholder="무엇을 바꿀까요? 예: 이 버튼 더 크게, 파란색으로"></textarea>
        <div class="pop-actions">
          <button type="button" class="ghost danger" data-act="delete" hidden>삭제</button>
          <span class="spacer"></span>
          <button type="button" class="ghost" data-act="cancel">취소</button>
          <button type="submit" class="primary">추가</button>
        </div>
      </form>
      <div class="bar" role="toolbar" aria-label="peek">
        <span class="logo">peek</span>
        <span class="status"></span>
        <button type="button" class="primary" data-act="copy">전체 복사</button>
        <button type="button" class="ghost" data-act="clear">지우기</button>
        <button type="button" class="ghost icon" data-act="close" aria-label="끄기">✕</button>
      </div>
      <div class="toast" hidden></div>
    `;
    // 메모 입력 중 키 입력이 페이지 단축키로 새지 않게
    ["keydown", "keyup", "keypress"].forEach((type) => host.addEventListener(type, (e) => e.stopPropagation()));
    document.documentElement.appendChild(host);

    ui = {
      hl: shadow.querySelector(".hl"),
      pins: shadow.querySelector(".pins"),
      pop: shadow.querySelector(".pop"),
      text: shadow.querySelector("textarea"),
      del: shadow.querySelector('[data-act="delete"]'),
      submit: shadow.querySelector('.pop [type="submit"]'),
      status: shadow.querySelector(".status"),
      copy: shadow.querySelector('[data-act="copy"]'),
      toast: shadow.querySelector(".toast"),
    };

    ui.pop.addEventListener("submit", (e) => {
      e.preventDefault();
      saveDraft();
    });
    ui.text.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        saveDraft();
      }
    });
    shadow.addEventListener("click", (e) => {
      const act = e.target.closest?.("[data-act]")?.dataset.act;
      if (act === "cancel") closeDraft();
      if (act === "delete") deleteDraft();
      if (act === "copy") copyAll();
      if (act === "clear") clearAll();
      if (act === "close") deactivate();
      const pin = e.target.closest?.(".pin");
      if (pin) openDraft(annotations[Number(pin.dataset.index)].el, Number(pin.dataset.index));
    });
  }

  const isOurs = (e) => host && e.composedPath().includes(host);

  function blockPage(e) {
    if (isOurs(e)) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function onMove(e) {
    if (isOurs(e) || draft) return;
    const el = e.target;
    hoverEl = el === document.documentElement || el === document.body ? null : el;
    schedule();
  }

  function onClick(e) {
    if (isOurs(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (hoverEl) openDraft(hoverEl);
  }

  function onKey(e) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    if (draft) closeDraft();
    else deactivate();
  }

  function openDraft(el, index) {
    draft = { el, index };
    hoverEl = el;
    const editing = index !== undefined;
    ui.text.value = editing ? annotations[index].note : "";
    ui.del.hidden = !editing;
    ui.submit.textContent = editing ? "저장" : "추가";
    ui.pop.hidden = false;
    render();
    ui.text.focus();
  }

  function closeDraft() {
    draft = null;
    ui.pop.hidden = true;
    render();
  }

  function saveDraft() {
    const note = ui.text.value.trim();
    if (!note) return ui.text.focus();
    if (draft.index !== undefined) {
      annotations[draft.index].note = note;
    } else {
      annotations.push({ el: draft.el, note, info: prompt.describeElement(draft.el, engine) });
    }
    closeDraft();
  }

  function deleteDraft() {
    annotations.splice(draft.index, 1);
    closeDraft();
  }

  function clearAll() {
    annotations = [];
    closeDraft();
  }

  async function copyAll() {
    if (!annotations.length) return showToast("먼저 요소를 클릭해서 메모를 남겨주세요");
    const markdown = prompt.buildMarkdown(
      { url: location.href, width: window.innerWidth, height: window.innerHeight },
      annotations,
    );
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = markdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    showToast(`메모 ${annotations.length}개를 복사했어요. AI 에이전트에 붙여넣으세요`);
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => ui && (ui.toast.hidden = true), 2200);
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  }

  function place(node, rect) {
    node.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    node.style.width = `${rect.width}px`;
    node.style.height = `${rect.height}px`;
  }

  function render() {
    if (!ui) return;
    const target = draft?.el ?? hoverEl;
    ui.hl.hidden = !target?.isConnected;
    if (target?.isConnected) place(ui.hl, target.getBoundingClientRect());

    ui.pins.replaceChildren(
      ...annotations.map((annotation, index) => {
        const pin = document.createElement("button");
        pin.type = "button";
        pin.className = "pin";
        pin.dataset.index = String(index);
        pin.textContent = String(index + 1);
        pin.title = annotation.note;
        pin.hidden = !annotation.el.isConnected;
        if (annotation.el.isConnected) {
          const rect = annotation.el.getBoundingClientRect();
          pin.style.transform = `translate(${Math.max(4, rect.left - 10)}px, ${Math.max(4, rect.top - 10)}px)`;
        }
        return pin;
      }),
    );

    if (draft && draft.el.isConnected) {
      const rect = draft.el.getBoundingClientRect();
      const popHeight = ui.pop.offsetHeight || 140;
      const popWidth = ui.pop.offsetWidth || 320;
      const below = rect.bottom + 8 + popHeight < window.innerHeight;
      const top = below ? rect.bottom + 8 : Math.max(8, rect.top - popHeight - 8);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - popWidth - 8);
      ui.pop.style.transform = `translate(${left}px, ${top}px)`;
    }

    ui.status.textContent = annotations.length
      ? `메모 ${annotations.length}개`
      : "요소를 클릭해서 수정 요청을 남기세요";
    ui.copy.disabled = !annotations.length;
  }
})();
