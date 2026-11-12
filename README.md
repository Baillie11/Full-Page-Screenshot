# Full-Page Screenshot App

A simple Node.js application that captures full-page screenshots of websites using Puppeteer.

## Features

- 🖱️ **Web Interface** - Click a button to capture screenshots
- 📸 Captures entire webpage, not just the visible viewport
- 🔄 Automatically scrolls through the entire page
- 💾 Saves screenshots as PNG files
- 🎨 Handles dynamic content and lazy-loaded images
- 📊 View all screenshots in a gallery
- 💻 Also available as CLI tool

## Installation

1. Make sure you have Node.js installed (v16 or higher recommended)
2. Install dependencies:

```bash
npm install
```

## Usage

### Web Interface (Recommended)

1. Start the web server:
```bash
npm start
```

2. Open your browser to: **http://localhost:3000**

3. Enter a URL and click "📸 Capture Screenshot"

4. View all your screenshots in the gallery below!

### Command Line Interface

Basic usage:
```bash
node screenshot.js <url>
```

Specify custom output filename:
```bash
node screenshot.js <url> <output-filename.png>
```

### CLI Examples

```bash
# Capture with auto-generated filename
node screenshot.js https://example.com

# Capture with custom filename
node screenshot.js https://github.com github-homepage.png

# Capture a long article page
node screenshot.js https://en.wikipedia.org/wiki/Node.js nodejs-wiki.png
```

All screenshots are saved in the `screenshots/` directory.

## How It Works

The app uses Puppeteer (a headless Chrome browser) to:
1. Launch a browser instance
2. Navigate to the specified URL
3. Wait for the page to fully load
4. Capture the entire page (not just the viewport)
5. Save the screenshot as a PNG file

## Requirements

- Node.js (v16+)
- Internet connection (to download Chromium on first install)

## Chrome Extension

A Chrome extension is included for one-click full-page screenshots directly from your browser toolbar.

### Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder from this project
5. The extension icon will appear in your toolbar

### Using the Extension

1. Navigate to any webpage
2. Click the extension icon in the toolbar
3. Optionally enter a filename
4. Click **Capture Full Page**
5. The screenshot is saved to your Downloads `screenshots/` folder

> **Note:** Chrome will briefly show a "debugging" banner during capture — this is normal and disappears automatically.

## Troubleshooting

- If screenshots are incomplete, try increasing the wait time in `screenshot.js`
- For pages with authentication, you may need to modify the script to handle login
- Large pages may take longer to capture
- **Chrome extension:** Cannot capture `chrome://` internal pages
