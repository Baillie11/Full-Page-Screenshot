import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

for (const saved of [false, true]) {
  for (const copied of [false, true]) {
    test(`capture feedback: saved=${saved}, copied=${copied}`, async () => {
      const elements = new Map();
      const element = id => {
        if (!elements.has(id)) elements.set(id, {
          textContent: '', className: '', value: '', checked: id === 'saveToggle' && saved,
          style: {}, addEventListener(event, fn) { this[event] = fn; },
          insertAdjacentHTML() {}, querySelector() { return { remove() {} }; }
        });
        return elements.get(id);
      };
      const context = vm.createContext({
        document: { getElementById: element },
        chrome: {
          tabs: { query: async (options, cb) => { const tabs = [{ id: 1, url: 'https://example.com/' }]; cb?.(tabs); return tabs; } },
          runtime: { sendMessage: async () => ({ success: true, imageData: 'aGk=', saved, filename: 'test.png' }) }
        },
        navigator: { clipboard: { write: async () => { if (!copied) throw new Error('denied'); } } },
        Blob, Uint8Array, atob, ClipboardItem: class { constructor(data) { this.data = data; } },
        console: { warn() {} }
      });
      vm.runInContext(fs.readFileSync(new URL('../chrome-extension/popup.js', import.meta.url), 'utf8'), context);
      await element('captureBtn').click();
      const status = element('status');
      assert.equal(status.className, saved || copied ? 'status success' : 'status error');
      if (!copied) assert.match(status.textContent, /clipboard unavailable/i);
      if (saved) assert.match(status.textContent, /Saved: test.png/);
      if (!saved && copied) assert.equal(status.textContent, 'Copied to clipboard');
      assert.equal(element('captureBtn').disabled, false);
    });
  }
}
