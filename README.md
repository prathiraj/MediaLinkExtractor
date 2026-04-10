# Media Link Extractor

A Microsoft Edge browser extension that automatically extracts video media links from web pages and lets you download them with one click — no more hunting for download buttons.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Edge](https://img.shields.io/badge/Browser-Edge-blue)

## Features

- 🔍 **Auto-detects video links** — scans `<video>`, `<source>`, `<a>` tags, `data-*` attributes, and inline scripts
- ☑️ **Checkbox selection** — pick exactly which files to download
- 📁 **Subfolder support** — type a folder name and downloads go to `Downloads\your-folder\`
- ⏬ **Sequential downloading** — downloads one file at a time to keep things orderly
- 📊 **Live progress** — badge count and per-file status (⏳ downloading, ✅ done, ❌ failed)
- 🔒 **Minimal permissions** — only accesses a page when you click the extension icon

## Supported Video Formats

`.mp4` `.mkv` `.avi` `.webm` `.mov` `.flv` `.wmv` `.m4v` `.ts` `.3gp`

Also detects video URLs inside query parameters (e.g. `?name=video.mkv`).

## Installation

### 1. Download the extension

```bash
git clone https://github.com/prathiraj/MediaLinkExtractor.git
```

Or download and extract the ZIP from the [Releases](https://github.com/prathiraj/MediaLinkExtractor/releases) page.

### 2. Load into Edge

1. Open **Microsoft Edge**
2. Navigate to `edge://extensions/`
3. Enable **Developer mode** (toggle in the bottom-left corner)
4. Click **"Load unpacked"**
5. Select the `MediaLinkExtractor` folder you cloned/extracted
6. The extension icon will appear in your toolbar — pin it for easy access

### 3. Configure Edge download settings (Important!)

By default, Edge prompts you for every download. To enable auto-downloading:

1. Open `edge://settings/downloads`
2. **Turn OFF** "Ask me what to do with each download"

Without this step, Edge will show a confirmation flyout for every file, defeating the purpose of batch downloading.

## Usage

1. Navigate to any web page containing video links
2. Click the **Media Link Extractor** icon in the toolbar
3. The extension scans the page and lists all video links found
4. **Select files** using checkboxes (or click **Select All**)
5. Optionally type a **subfolder name** (e.g. `My Show S01`) — files will save to `Downloads\My Show S01\`
6. Click **"⬇ Download Selected"**
7. Downloads proceed sequentially — progress is shown in the popup and on the extension badge

## How It Works

| Component | File | Role |
|---|---|---|
| Content Script | `content/content.js` | Injected into the active tab on demand. Scans the DOM for video URLs in elements, attributes, and inline scripts. |
| Popup | `popup/*` | Extension popup UI with checkbox list, subfolder input, and download controls. |
| Background Worker | `background/background.js` | Service worker that manages the sequential download queue using `chrome.downloads` API. |

## Permissions

| Permission | Why |
|---|---|
| `activeTab` | Read the current tab's page content when you click the extension icon |
| `downloads` | Add files to Edge's built-in download manager |
| `scripting` | Inject the content script to scan the page |

## Troubleshooting

| Problem | Solution |
|---|---|
| "Could not scan this page" | Extension can't access protected pages (`edge://`, `chrome://`, Edge Web Store). |
| No links found | The page may load video URLs dynamically. Wait for full page load and try again. |
| Still getting Save As prompts | Go to `edge://settings/downloads` → turn OFF "Ask me what to do with each download". |
| Download fails for a file | The server may require authentication cookies or block direct downloads. |

## License

MIT
