import express from 'express';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/screenshots', express.static('screenshots'));

// Create screenshots directory if it doesn't exist
const screenshotsDir = join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// API endpoint to capture screenshot
app.post('/api/capture', async (req, res) => {
  const { url, filename } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const outputFile = filename || `screenshot-${Date.now()}.png`;
  const outputPath = join(screenshotsDir, outputFile);

  try {
    console.log(`[${new Date().toISOString()}] Capturing screenshot of: ${url}`);
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: outputPath,
      fullPage: true,
      type: 'png'
    });

    await browser.close();

    console.log(`[${new Date().toISOString()}] Screenshot saved: ${outputFile}`);

    res.json({
      success: true,
      message: 'Screenshot captured successfully',
      filename: outputFile,
      url: `/screenshots/${outputFile}`
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to list screenshots
app.get('/api/screenshots', (req, res) => {
  try {
    const files = fs.readdirSync(screenshotsDir)
      .filter(file => file.endsWith('.png'))
      .map(file => ({
        filename: file,
        url: `/screenshots/${file}`,
        created: fs.statSync(join(screenshotsDir, file)).mtime
      }))
      .sort((a, b) => b.created - a.created);

    res.json({ screenshots: files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Full-Page Screenshot App running!`);
  console.log(`📱 Open your browser to: http://localhost:${PORT}`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});
