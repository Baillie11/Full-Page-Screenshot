const captureBtn = document.getElementById('captureBtn');
const btnText = document.getElementById('btnText');
const status = document.getElementById('status');
const filenameInput = document.getElementById('filename');
const tabInfo = document.getElementById('tabInfo');

const saveToggle = document.getElementById('saveToggle');
const filenameGroup = document.getElementById('filenameGroup');

// Show the current tab URL on popup open
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab) {
    tabInfo.textContent = tab.url;
  }
});

// Toggle filename input visibility
saveToggle.addEventListener('change', () => {
  filenameGroup.style.display = saveToggle.checked ? 'block' : 'none';
});

captureBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    showStatus('No active tab found.', 'error');
    return;
  }

  // Prevent capturing chrome:// or extension pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    showStatus('Cannot capture Chrome internal pages.', 'error');
    return;
  }

  // Disable button and show loading
  captureBtn.disabled = true;
  btnText.textContent = 'Capturing...';
  captureBtn.insertAdjacentHTML('beforeend', '<span class="spinner"></span>');
  showStatus('Capturing full page screenshot...', 'loading');

  try {
    let filename = filenameInput.value.trim();

    // Ensure .png extension
    if (filename && !filename.endsWith('.png')) {
      filename += '.png';
    }

    const expandScrollable = document.getElementById('expandToggle').checked;
    const saveToFile = document.getElementById('saveToggle').checked;

    const response = await chrome.runtime.sendMessage({
      action: 'captureFullPage',
      tabId: tab.id,
      filename: filename || null,
      expandScrollable,
      saveToFile
    });

    if (response && response.success) {
      // Copy screenshot to clipboard
      await copyImageToClipboard(response.imageData);
      const msg = response.saved
        ? `Saved: ${response.filename} (copied to clipboard)`
        : 'Copied to clipboard';
      showStatus(msg, 'success');
      filenameInput.value = '';
    } else {
      showStatus(response?.error || 'Unknown error occurred.', 'error');
    }
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    captureBtn.disabled = false;
    btnText.textContent = 'Capture Full Page';
    const spinner = captureBtn.querySelector('.spinner');
    if (spinner) spinner.remove();
  }
});

async function copyImageToClipboard(base64Data) {
  try {
    const byteChars = atob(base64Data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: 'image/png' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
  } catch (e) {
    console.warn('Could not copy to clipboard:', e.message);
  }
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
}
