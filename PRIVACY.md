# Privacy Policy — Media Link Extractor

**Last updated:** April 14, 2026

## Overview

Media Link Extractor is a browser extension that helps users find and download video links from web pages. Your privacy is important to us.

## Data Collection

**Media Link Extractor does not collect, store, transmit, or share any personal data.**

Specifically:

- ❌ No browsing history is collected
- ❌ No analytics or telemetry is sent
- ❌ No data is transmitted to any external server
- ❌ No cookies are set or read by the extension
- ❌ No user accounts or login required

## Data Stored Locally

The extension stores the following data **locally on your device only** using the browser's built-in `chrome.storage.local` API:

- **Download subfolder preference** — the folder name you type into the download path field, so it persists between sessions

This data never leaves your device and can be cleared at any time by removing the extension.

## Permissions Explained

| Permission | Purpose |
|---|---|
| `activeTab` | Read the current page's content **only when you click the extension icon** |
| `downloads` | Add files to the browser's built-in download manager |
| `scripting` | Inject the content script to scan the page for video links |
| `storage` | Save your download folder preference locally |

The `activeTab` permission ensures the extension **cannot** read any page unless you explicitly activate it by clicking the icon.

## Third-Party Services

This extension does not use any third-party services, SDKs, analytics platforms, or advertising networks.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date above.

## Contact

If you have questions about this privacy policy, please open an issue on our [GitHub repository](https://github.com/prathiraj/MediaLinkExtractor/issues).
