(() => {
  "use strict";

  const VIDEO_EXTENSIONS = [
    ".mp4", ".mkv", ".avi", ".webm", ".mov",
    ".flv", ".wmv", ".m4v", ".ts", ".3gp"
  ];

  const VIDEO_EXT_REGEX = new RegExp(
    `(${VIDEO_EXTENSIONS.map(e => e.replace(".", "\\.")).join("|")})(\\?.*)?$`,
    "i"
  );

  function isVideoUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url, document.baseURI);
      // Check pathname first
      if (VIDEO_EXT_REGEX.test(parsed.pathname)) return true;
      // Check query parameter values (e.g. ?name=file.mkv)
      for (const value of parsed.searchParams.values()) {
        if (VIDEO_EXT_REGEX.test(value)) return true;
      }
      // Check the full URL as a fallback
      return VIDEO_EXT_REGEX.test(parsed.href);
    } catch {
      return VIDEO_EXT_REGEX.test(url);
    }
  }

  function resolveUrl(raw) {
    if (!raw) return null;
    try {
      return new URL(raw, document.baseURI).href;
    } catch {
      return null;
    }
  }

  function extractFilename(url) {
    try {
      const parsed = new URL(url);
      // First check query params for a filename (e.g. ?name=file.mkv, ?file=..., ?title=...)
      const nameParams = ["name", "file", "filename", "title"];
      for (const param of nameParams) {
        const val = parsed.searchParams.get(param);
        if (val && VIDEO_EXT_REGEX.test(val)) {
          return decodeURIComponent(val);
        }
      }
      // Check all query param values for one that looks like a video filename
      for (const value of parsed.searchParams.values()) {
        if (VIDEO_EXT_REGEX.test(value)) {
          return decodeURIComponent(value);
        }
      }
      // Fall back to last segment of pathname
      const segments = parsed.pathname.split("/");
      const last = segments[segments.length - 1];
      return decodeURIComponent(last) || url;
    } catch {
      return url;
    }
  }

  function getExtension(filename) {
    const match = filename.match(/\.([a-z0-9]+)(\?.*)?$/i);
    return match ? `.${match[1].toLowerCase()}` : "";
  }

  function scanPage() {
    const urls = new Set();
    const results = [];

    function addLink(rawUrl) {
      const url = resolveUrl(rawUrl);
      if (!url || urls.has(url) || !isVideoUrl(url)) return;
      urls.add(url);
      const filename = extractFilename(url);
      results.push({
        url,
        filename,
        extension: getExtension(filename)
      });
    }

    // <video src="...">
    document.querySelectorAll("video[src]").forEach(el => addLink(el.src));

    // <video> <source src="...">
    document.querySelectorAll("video source[src]").forEach(el => addLink(el.src));

    // <source src="..."> (outside video too)
    document.querySelectorAll("source[src]").forEach(el => addLink(el.src));

    // <a href="..."> links pointing to video files
    document.querySelectorAll("a[href]").forEach(el => addLink(el.href));

    // <embed> and <object> with video sources
    document.querySelectorAll("embed[src]").forEach(el => addLink(el.src));
    document.querySelectorAll("object[data]").forEach(el => addLink(el.data));

    // data-src, data-url, data-video-src, data-href attributes on any element
    const dataAttrs = ["data-src", "data-url", "data-video-src", "data-href", "data-video", "data-file"];
    dataAttrs.forEach(attr => {
      document.querySelectorAll(`[${attr}]`).forEach(el => {
        addLink(el.getAttribute(attr));
      });
    });

    // Scan inline <script> tags for video URLs
    document.querySelectorAll("script:not([src])").forEach(script => {
      const text = script.textContent;
      if (!text) return;
      const urlPattern = /https?:\/\/[^\s"'<>]+/g;
      let match;
      while ((match = urlPattern.exec(text)) !== null) {
        addLink(match[0]);
      }
    });

    return results;
  }

  // Respond to messages from popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "scanPage") {
      const links = scanPage();
      sendResponse({ links });
    }
    return true; // keep channel open for async response
  });
})();
