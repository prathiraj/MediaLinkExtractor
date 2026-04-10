(() => {
  "use strict";

  let downloadQueue = [];
  let isDownloading = false;
  let currentIndex = 0;
  let totalCount = 0;
  let succeededCount = 0;
  let downloadSubfolder = "";

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "downloadLinks" && message.links?.length > 0) {
      downloadQueue = message.links.map((link, idx) => ({
        ...link,
        originalIndex: idx
      }));
      totalCount = downloadQueue.length;
      currentIndex = 0;
      succeededCount = 0;
      isDownloading = true;
      downloadSubfolder = sanitizePath(message.subfolder || "");

      sendResponse({ started: true });

      chrome.action.setBadgeText({ text: `${totalCount}` });
      chrome.action.setBadgeBackgroundColor({ color: "#2b5797" });

      downloadNext();
    }
    return true;
  });

  function downloadNext() {
    if (currentIndex >= downloadQueue.length) {
      isDownloading = false;
      broadcastToPopup({
        action: "downloadComplete",
        total: totalCount,
        succeeded: succeededCount
      });
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#34a853" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
      return;
    }

    const link = downloadQueue[currentIndex];
    const current = currentIndex + 1;

    broadcastToPopup({
      action: "downloadProgress",
      current,
      total: totalCount,
      filename: link.filename,
      status: "Downloading",
      linkIndex: link.originalIndex
    });

    const saveName = sanitizeFilename(link.filename);
    const fullPath = downloadSubfolder
      ? `${downloadSubfolder}/${saveName}`
      : saveName;

    chrome.downloads.download(
      {
        url: link.url,
        filename: fullPath,
        conflictAction: "uniquify",
        saveAs: false
      },
      (downloadId) => {
        if (chrome.runtime.lastError || !downloadId) {
          console.error("Download failed:", chrome.runtime.lastError?.message, link.url);
          broadcastToPopup({
            action: "downloadProgress",
            current,
            total: totalCount,
            filename: link.filename,
            status: "Failed",
            linkIndex: link.originalIndex
          });
          currentIndex++;
          downloadNext();
          return;
        }

        function onComplete() {
          succeededCount++;
          broadcastToPopup({
            action: "downloadProgress",
            current,
            total: totalCount,
            filename: link.filename,
            status: "Complete",
            linkIndex: link.originalIndex
          });
          const remaining = totalCount - current;
          if (remaining > 0) {
            chrome.action.setBadgeText({ text: `${remaining}` });
          }
          currentIndex++;
          downloadNext();
        }

        function onFailed() {
          broadcastToPopup({
            action: "downloadProgress",
            current,
            total: totalCount,
            filename: link.filename,
            status: "Failed",
            linkIndex: link.originalIndex
          });
          currentIndex++;
          downloadNext();
        }

        let resolved = false;

        const listener = (delta) => {
          if (delta.id !== downloadId || resolved) return;
          if (delta.state) {
            if (delta.state.current === "complete") {
              resolved = true;
              chrome.downloads.onChanged.removeListener(listener);
              onComplete();
            } else if (delta.state.current === "interrupted") {
              resolved = true;
              chrome.downloads.onChanged.removeListener(listener);
              onFailed();
            }
          }
        };

        chrome.downloads.onChanged.addListener(listener);

        // Safety check: poll download status in case onChanged was missed
        const pollInterval = setInterval(() => {
          if (resolved) {
            clearInterval(pollInterval);
            return;
          }
          chrome.downloads.search({ id: downloadId }, (results) => {
            if (resolved || !results || results.length === 0) return;
            const state = results[0].state;
            if (state === "complete") {
              resolved = true;
              clearInterval(pollInterval);
              chrome.downloads.onChanged.removeListener(listener);
              onComplete();
            } else if (state === "interrupted") {
              resolved = true;
              clearInterval(pollInterval);
              chrome.downloads.onChanged.removeListener(listener);
              onFailed();
            }
          });
        }, 2000);
      }
    );
  }

  function sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 200);
  }

  function sanitizePath(folderName) {
    if (!folderName) return "";
    return folderName
      .replace(/[<>:"|?*]/g, "_")
      .replace(/[/\\]+/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .trim()
      .substring(0, 200);
  }

  function broadcastToPopup(message) {
    chrome.runtime.sendMessage(message).catch(() => {});
  }
})();
