(() => {
  "use strict";

  const statusEl = document.getElementById("status");
  const toolbarEl = document.getElementById("toolbar");
  const linkListEl = document.getElementById("linkList");
  const emptyStateEl = document.getElementById("emptyState");
  const downloadBar = document.getElementById("downloadBar");
  const downloadBtn = document.getElementById("downloadBtn");
  const downloadStatusEl = document.getElementById("downloadStatus");
  const selectAllEl = document.getElementById("selectAll");
  const countEl = document.getElementById("count");
  const subfolderEl = document.getElementById("subfolder");

  let links = [];
  let downloading = false;

  // Load cached subfolder
  chrome.storage.local.get("subfolder", (data) => {
    if (data.subfolder) {
      subfolderEl.value = data.subfolder;
    }
  });

  // Save subfolder on change
  subfolderEl.addEventListener("input", () => {
    chrome.storage.local.set({ subfolder: subfolderEl.value.trim() });
  });

  async function scanCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        showEmpty("Cannot access this tab.");
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/content.js"]
      });

      const response = await chrome.tabs.sendMessage(tab.id, { action: "scanPage" });
      if (response?.links?.length > 0) {
        links = response.links;
        renderLinks();
      } else {
        showEmpty();
      }
    } catch (err) {
      console.error("Scan failed:", err);
      showEmpty("Could not scan this page. It may be a protected page (e.g., edge://, chrome://).");
    }
  }

  function showEmpty(message) {
    statusEl.textContent = "Scan complete";
    emptyStateEl.querySelector("p").textContent = message || "No video links found on this page.";
    emptyStateEl.classList.remove("hidden");
    toolbarEl.classList.add("hidden");
    downloadBar.classList.add("hidden");
  }

  function renderLinks() {
    statusEl.textContent = `Found ${links.length} video link${links.length !== 1 ? "s" : ""}`;
    toolbarEl.classList.remove("hidden");
    downloadBar.classList.remove("hidden");
    linkListEl.innerHTML = "";

    links.forEach((link, index) => {
      const item = document.createElement("div");
      item.className = "link-item";
      item.dataset.index = index;

      item.innerHTML = `
        <input type="checkbox" class="link-checkbox" data-index="${index}">
        <div class="link-info">
          <div class="link-filename" title="${escapeHtml(link.filename)}">${escapeHtml(link.filename)}</div>
          <div class="link-url" title="${escapeHtml(link.url)}">${escapeHtml(link.url)}</div>
        </div>
        <span class="link-ext">${escapeHtml(link.extension.replace(".", ""))}</span>
        <span class="link-status" data-index="${index}"></span>
      `;

      linkListEl.appendChild(item);
    });

    updateCount();
  }

  function getSelectedIndices() {
    return [...document.querySelectorAll(".link-checkbox:checked")]
      .map(cb => parseInt(cb.dataset.index, 10));
  }

  function updateCount() {
    const selected = getSelectedIndices().length;
    countEl.textContent = `${selected} of ${links.length} selected`;
    downloadBtn.disabled = selected === 0 || downloading;
  }

  selectAllEl.addEventListener("change", () => {
    document.querySelectorAll(".link-checkbox").forEach(cb => {
      cb.checked = selectAllEl.checked;
    });
    updateCount();
  });

  linkListEl.addEventListener("change", (e) => {
    if (e.target.classList.contains("link-checkbox")) {
      updateCount();
      const all = document.querySelectorAll(".link-checkbox");
      selectAllEl.checked = [...all].every(cb => cb.checked);
    }
  });

  downloadBtn.addEventListener("click", async () => {
    const indices = getSelectedIndices();
    if (indices.length === 0 || downloading) return;

    downloading = true;
    downloadBtn.disabled = true;
    downloadBtn.textContent = "⏳ Downloading…";
    document.querySelectorAll(".link-checkbox").forEach(cb => cb.disabled = true);
    selectAllEl.disabled = true;

    const subfolder = subfolderEl.value.trim();
    chrome.runtime.sendMessage(
      {
        action: "downloadLinks",
        links: indices.map(i => links[i]),
        subfolder
      },
      (response) => {
        if (response?.started) {
          downloadStatusEl.textContent = `Starting 1 of ${indices.length}…`;
        }
      }
    );
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "downloadProgress") {
      const { current, total, filename, status } = message;
      downloadStatusEl.textContent = `${status} ${current} of ${total}: ${filename}`;

      if (message.linkIndex !== undefined) {
        const el = document.querySelector(`.link-status[data-index="${message.linkIndex}"]`);
        if (el) {
          if (status === "Downloading") el.textContent = "⏳";
          else if (status === "Complete") el.textContent = "✅";
          else if (status === "Failed") el.textContent = "❌";
        }
      }
    }

    if (message.action === "downloadComplete") {
      downloading = false;
      downloadBtn.disabled = false;
      downloadBtn.textContent = "⬇ Download Selected";
      downloadStatusEl.textContent = `Done! ${message.succeeded} of ${message.total} downloaded.`;
      document.querySelectorAll(".link-checkbox").forEach(cb => cb.disabled = false);
      selectAllEl.disabled = false;
    }
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  scanCurrentTab();
})();
