// Listen for capture requests from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureFullPage') {
    captureFullPage(message.tabId, message.filename, message.expandScrollable, message.saveToFile)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function captureFullPage(tabId, filename, expandScrollable, saveToFile = false) {
  // If auto-expand is enabled, expand all scrollable containers first
  if (expandScrollable) {
    await expandScrollableContainers(tabId);
    // Wait for layout to settle after expanding
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  // Attach the debugger to the tab
  await chrome.debugger.attach({ tabId }, '1.3');

  try {
    // Get the full page dimensions
    const metrics = await chrome.debugger.sendCommand(
      { tabId },
      'Page.getLayoutMetrics'
    );

    const { cssContentSize } = metrics;
    const width = Math.ceil(cssContentSize.width);
    const height = Math.ceil(cssContentSize.height);

    // Override the viewport to the full page size
    await chrome.debugger.sendCommand(
      { tabId },
      'Emulation.setDeviceMetricsOverride',
      {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false
      }
    );

    // Wait briefly for any reflow/repaint
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture the full-page screenshot
    const screenshot = await chrome.debugger.sendCommand(
      { tabId },
      'Page.captureScreenshot',
      {
        format: 'png',
        captureBeyondViewport: true
      }
    );

    // Reset viewport to original dimensions
    await chrome.debugger.sendCommand(
      { tabId },
      'Emulation.clearDeviceMetricsOverride'
    );

    // Generate filename from the page URL if not provided
    const outputFilename = filename || generateFilename(tabId);

    // Download the screenshot only if save is enabled
    if (saveToFile) {
      await chrome.downloads.download({
        url: `data:image/png;base64,${screenshot.data}`,
        filename: `screenshots/${outputFilename}`,
        saveAs: false
      });
    }

    return { success: true, filename: outputFilename, imageData: screenshot.data, saved: saveToFile };

  } finally {
    // Always detach the debugger
    try {
      await chrome.debugger.detach({ tabId });
    } catch (e) {
      // Ignore detach errors (tab may have closed)
    }

    // Restore scrollable containers after capture
    if (expandScrollable) {
      await restoreScrollableContainers(tabId);
    }
  }
}

// Expand all scrollable containers so their full content is visible
async function expandScrollableContainers(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: () => {
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const hasScroll = (overflowY === 'scroll' || overflowY === 'auto' || overflowY === 'hidden');

        if (hasScroll && el.scrollHeight > el.clientHeight + 5) {
          // Save original styles as data attributes
          el.dataset.ssOrigOverflow = el.style.overflow || '';
          el.dataset.ssOrigOverflowY = el.style.overflowY || '';
          el.dataset.ssOrigHeight = el.style.height || '';
          el.dataset.ssOrigMaxHeight = el.style.maxHeight || '';
          el.dataset.ssOrigPosition = el.style.position || '';

          // Expand the container
          el.style.overflow = 'visible';
          el.style.overflowY = 'visible';
          el.style.height = 'auto';
          el.style.maxHeight = 'none';
        }
      });
    }
  });
}

// Restore all expanded containers to their original styles
async function restoreScrollableContainers(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => {
        document.querySelectorAll('[data-ss-orig-overflow]').forEach(el => {
          el.style.overflow = el.dataset.ssOrigOverflow;
          el.style.overflowY = el.dataset.ssOrigOverflowY;
          el.style.height = el.dataset.ssOrigHeight;
          el.style.maxHeight = el.dataset.ssOrigMaxHeight;
          el.style.position = el.dataset.ssOrigPosition;

          // Clean up data attributes
          delete el.dataset.ssOrigOverflow;
          delete el.dataset.ssOrigOverflowY;
          delete el.dataset.ssOrigHeight;
          delete el.dataset.ssOrigMaxHeight;
          delete el.dataset.ssOrigPosition;
        });
      }
    });
  } catch (e) {
    // Page may have navigated away — ignore
  }
}

function generateFilename(tabId) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  return `screenshot_${timestamp}.png`;
}
