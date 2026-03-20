import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stillPath = path.resolve(__dirname, 'video-still.jpg');
const outputPath = path.resolve(__dirname, 'BuzzMaster-presentatie.pdf');

const SLIDE_COUNT = 10;
const WIDTH = 1920;
const HEIGHT = 1080;

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--window-size=${WIDTH},${HEIGHT}`],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  // Load the presentation via Vite dev server
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

  // Bump font size for PDF readability + reduce opacity of large shapes on slide 1 & 2
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '118%';
    // Fade and reposition the large S-curve SVGs on slides 1 and 2
    const heroShapeTr = document.querySelector('.hero-shape-tr');
    heroShapeTr.style.left = 'auto';
    heroShapeTr.style.right = '0';

    const heroWave = document.querySelector('.hero-wave-svg');
    heroWave.style.opacity = '0.3';
    heroWave.style.top = '0';
    heroWave.style.bottom = '0';
    heroWave.style.height = '100%';

    const novaWave = document.querySelector('.nova-wave-svg');
    novaWave.style.opacity = '0.3';
    novaWave.style.top = '0';
    novaWave.style.bottom = '0';
    novaWave.style.height = '100%';
    novaWave.style.left = 'auto';
    novaWave.style.right = '0';
  });

  // Replace iframe with still image on slide 2
  const stillBase64 = fs.readFileSync(stillPath).toString('base64');
  await page.evaluate((b64) => {
    const iframe = document.querySelector('iframe[title="Buzzmaster AI Sidekick"]');
    if (iframe) {
      const img = document.createElement('img');
      img.src = `data:image/jpeg;base64,${b64}`;
      img.style.cssText = iframe.style.cssText;
      img.style.objectFit = 'cover';
      iframe.replaceWith(img);
    }
  }, stillBase64);

  // Add play button overlay on the video still
  await page.evaluate(() => {
    const stillImg = document.querySelector('[data-slide="2"] img[style*="object-fit: cover"]');
    if (stillImg) {
      const wrapper = stillImg.parentElement;
      wrapper.style.position = 'relative';
      const playBtn = document.createElement('div');
      playBtn.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;background:rgba(243,3,73,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:10;box-shadow:0 4px 24px rgba(0,0,0,0.3);';
      playBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="8,5 20,12 8,19"/></svg>';
      wrapper.appendChild(playBtn);
    }
  });

  // Remove the Vimeo player script
  await page.evaluate(() => {
    document.querySelectorAll('script[src*="vimeo"]').forEach(s => s.remove());
  });

  // Hide navigation elements for PDF
  await page.evaluate(() => {
    document.querySelectorAll('.slide-counter, .slide-nav, .slide-hint, #progress').forEach(el => {
      el.style.display = 'none';
    });
  });

  // Collect screenshots of each slide
  const screenshots = [];
  for (let i = 1; i <= SLIDE_COUNT; i++) {
    // Activate the correct slide
    await page.evaluate((slideNum) => {
      document.querySelectorAll('.slide').forEach(s => {
        s.classList.remove('active');
        s.style.opacity = '0';
        s.style.pointerEvents = 'none';
      });
      const target = document.querySelector(`[data-slide="${slideNum}"]`);
      if (target) {
        target.classList.add('active');
        target.style.opacity = '1';
        target.style.pointerEvents = 'auto';
      }
    }, i);

    // Wait for animations/rendering
    await new Promise(r => setTimeout(r, 800));

    const screenshot = await page.screenshot({ type: 'png', encoding: 'binary' });
    screenshots.push(screenshot);
    console.log(`Captured slide ${i}/${SLIDE_COUNT}`);
  }

  // Create a PDF by printing each slide screenshot on its own page
  // We'll use a new page with images laid out for PDF generation
  const pdfPage = await browser.newPage();
  await pdfPage.setViewport({ width: WIDTH, height: HEIGHT });

  const imagesB64 = screenshots.map(s => Buffer.from(s).toString('base64'));

  await pdfPage.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; }
        @page { size: 1920px 1080px; margin: 0; }
        body { margin: 0; }
        .page {
          width: 1920px;
          height: 1080px;
          page-break-after: always;
          overflow: hidden;
        }
        .page:last-child { page-break-after: auto; }
        .page img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      ${imagesB64.map(b64 => `<div class="page"><img src="data:image/png;base64,${b64}"></div>`).join('\n')}
    </body>
    </html>
  `, { waitUntil: 'load' });

  await pdfPage.pdf({
    path: outputPath,
    width: '1920px',
    height: '1080px',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    preferCSSPageSize: true,
  });

  console.log(`PDF saved to ${outputPath}`);
  await browser.close();

  // Post-process: add clickable video link on slide 2 play button
  const { execSync } = await import('child_process');
  execSync(`python3 "${path.resolve(__dirname, 'add-video-link.py')}" "${outputPath}"`, { stdio: 'inherit' });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
