chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  const url = tab.url ?? "";
  if (isUnsupportedPage(url)) {
    console.warn("[peek] Inspect mode is unavailable on this page:", url);
    return;
  }

  try {
    await sendToggleMessage(tab.id);
  } catch (error) {
    if (!isMissingReceiverError(error)) {
      console.error("[peek] Failed to contact content script:", error);
      return;
    }

    try {
      // content.css는 content.js가 Shadow DOM 안에 직접 불러온다
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["selector-engine.js", "prompt.js", "content.js"],
      });
      await sendToggleMessage(tab.id);
    } catch (injectionError) {
      if (isRestrictedAccessError(injectionError)) {
        console.warn("[peek] Inspect mode is blocked on this page:", url);
        return;
      }

      console.error("[peek] Failed to activate inspect mode:", injectionError);
    }
  }
});

function sendToggleMessage(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action: "toggleInspect" }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

function isMissingReceiverError(error) {
  return error instanceof Error && error.message.includes("Receiving end does not exist");
}

function isRestrictedAccessError(error) {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes("Cannot access contents of url") ||
    error.message.includes("The extensions gallery cannot be scripted") ||
    error.message.includes("Cannot access a chrome:// URL")
  );
}

function isUnsupportedPage(url) {
  return /^(about:|chrome:|chrome-extension:|chrome-search:|devtools:|edge:|view-source:|data:)/.test(url) ||
    url.startsWith("https://chromewebstore.google.com/");
}

// 같은 URL을 여러 탭에서 열어도 오래된 화면이 최신 작업을 덮어쓰지 않게 한다.
let pendingSave = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.action !== "savePeekWork" || sender.id !== chrome.runtime.id ||
      !sender.tab || sender.frameId !== 0 || !message.key?.startsWith("peek:")) return;

  const save = pendingSave.then(async () => {
    const { key, state } = message;
    const saved = (await chrome.storage.local.get(key))[key];
    if ((saved?.revision ?? 0) !== state.revision) return { conflict: true };
    await chrome.storage.local.set({ [key]: { ...state, revision: state.revision + 1 } });
    return { ok: true };
  });
  pendingSave = save.then(reply, () => reply({ ok: false }));
  return true;
});
