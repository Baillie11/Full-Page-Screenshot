import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function captureFullPageScreenshot(url, outputPath) {
  console.log(`Starting browser...`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });

    console.log(`Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait a bit for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`Capturing full-page screenshot...`);
    await page.screenshot({
      path: outputPath,
      fullPage: true,
      type: 'png'
    });

    console.log(`✓ Screenshot saved to: ${outputPath}`);
  } catch (error) {
    console.error(`Error capturing screenshot: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: node screenshot.js <url> [output-file]

Examples:
  node screenshot.js https://example.com
  node screenshot.js https://example.com my-screenshot.png
  node screenshot.js https://github.com github-page.png

If no output file is specified, it will be saved as 'screenshot-<timestamp>.png'
`);
  process.exit(0);
}

const url = args[0];
const outputFile = args[1] || `screenshot-${Date.now()}.png`;
const outputPath = join(__dirname, 'screenshots', outputFile);

// Create screenshots directory if it doesn't exist
const screenshotsDir = join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

captureFullPageScreenshot(url, outputPath)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
