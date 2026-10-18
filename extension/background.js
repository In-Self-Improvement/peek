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
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content.css"],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["selector-engine.js", "content.js"],
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
