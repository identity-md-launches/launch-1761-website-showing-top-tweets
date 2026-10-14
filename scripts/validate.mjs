// Validates the finished static export under a gateway-style subpath.
// Optional tooling stays outside the application dependency tree.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat, access } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const importTool = value => import(value.startsWith('/') ? pathToFileURL(value).href : value);
const { chromium } = await importTool(process.env.IMD_PLAYWRIGHT_MODULE || 'playwright');
const { default: AxeBuilder } = await importTool(process.env.IMD_AXE_MODULE || '@axe-core/playwright');
const root = resolve('dist');
const output = resolve(process.env.IMD_VALIDATION_OUT || 'test/scratch/interaction');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/preview/')) { res.writeHead(404); res.end(); return; }
    const name = decodeURIComponent(url.pathname.slice('/preview/'.length)) || 'index.html';
    const file = resolve(root, name);
    if (!file.startsWith(root + sep) || !(await stat(file)).isFile()) throw new Error('Not a file');
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const results = [];
const consoleErrors = [];
const requestErrors = [];
let browser;
let context;
let page;
const check = async (name, fn) => {
  try { const detail = await fn(); results.push({ name, passed: true, ...(detail ? { detail } : {}) }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, detail: error.message }); console.error(`FAIL ${name}: ${error.stack}`); }
};
const count = () => page.locator('article').count();
const expectCount = async n => { await page.waitForFunction(n => document.querySelectorAll('article').length === n, n); assert.equal(await count(), n); };
const screenshot = name => page.screenshot({ path: resolve(output, `${name}.png`), animations: 'disabled' });
let navigation = 0;
const reset = async (hash = '#feed') => { await page.goto(`${url}?check=${++navigation}${hash}`); await page.locator('.post-list').waitFor(); };
const audit = async () => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), []);
};

try {
  browser = await chromium.launch({ headless: true, ...(process.env.IMD_CHROMIUM_EXECUTABLE ? { executablePath: process.env.IMD_CHROMIUM_EXECUTABLE } : {}) });
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== new URL(url).origin) { requestErrors.push(`External runtime request: ${route.request().url()}`); await route.abort(); }
    else await route.continue();
  });
  page = await context.newPage();
  page.on('pageerror', error => consoleErrors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('response', response => { if (response.status() >= 400) requestErrors.push(`${response.status()} ${response.url()}`); });
  await reset();

  await check('Production subpath renders 8 posts with locally loaded art and font', async () => {
    await expectCount(8);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.fonts.check('400 16px Manrope')), true);
    assert.equal(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)), true);
    assert.match(await page.locator('article').first().innerText(), /Ansem/);
  });

  await check('Search handles and text, with all-term matching', async () => {
    await page.getByRole('searchbox', { name: 'Search posts' }).fill('@surfcoderepeat'); await expectCount(2);
    await page.getByRole('searchbox').fill('Adam oracle'); await expectCount(1);
    assert.match(await page.locator('article').innerText(), /software factory/);
    await page.getByRole('button', { name: 'Clear search', exact: true }).click(); await expectCount(8);
  });
  await check('Topic filters combine with search and recover from empty results', async () => {
    await page.getByRole('group', { name: 'Filter by topic' }).getByRole('button', { name: 'Building', exact: true }).click(); await expectCount(3);
    await page.getByRole('searchbox').fill('no-matching-post'); await expectCount(0);
    assert.match(await page.locator('.empty-state').innerText(), /no-matching-post/);
    await page.locator('.empty-state').getByRole('button', { name: 'Clear filters' }).click(); await expectCount(8);
    assert.equal(await page.getByRole('searchbox').inputValue(), '');
  });
  await check('Sort orders match captured likes, date, and reposts', async () => {
    for (const [sort, author] of [['newest', 'Infer Protocol'], ['reposts', 'Adam'], ['likes', 'Ansem']]) {
      await page.getByLabel('Sort posts').selectOption(sort);
      assert.match(await page.locator('article').first().innerText(), new RegExp(author));
    }
  });
  await check('Filter state survives reload and supports shareable hash links', async () => {
    await reset('#feed?q=oracle&topic=agents&sort=newest'); await expectCount(1);
    assert.equal(await page.getByRole('searchbox').inputValue(), 'oracle');
    assert.equal(await page.getByLabel('Sort posts').inputValue(), 'newest');
    await page.reload(); await expectCount(1);
    await reset();
  });
  await check('Bookmark action persists, navigates to Saved, and removes the final post', async () => {
    const save = page.locator('article').first().getByRole('button', { name: /^Save post/ });
    await save.click();
    assert.equal(await page.locator('article').first().getByRole('button').getAttribute('aria-pressed'), 'true');
    await page.getByRole('link', { name: /Saved posts/ }).click(); await expectCount(1);
    await page.reload(); await expectCount(1);
    assert.match(await page.locator('article').innerText(), /Ansem/);
    await screenshot('saved-desktop');
    await page.getByRole('button', { name: /^Unsave post/ }).click(); await expectCount(0);
    assert.equal(await page.getByRole('heading', { name: 'Keep the good ones.' }).isVisible(), true);
    await page.getByRole('link', { name: 'Explore posts', exact: true }).click(); await expectCount(8);
  });
  await check('Author and topic shortcuts update the actual feed', async () => {
    await page.locator('.person').filter({ hasText: 'Adam' }).click(); await expectCount(2);
    await page.locator('.topic-list button').filter({ hasText: 'AI & agents' }).click(); await expectCount(3);
    await reset();
  });
  await check('Modal has initial focus, contains Tab, exposes sources, and restores focus on Escape', async () => {
    const trigger = page.getByRole('button', { name: 'Snapshot', exact: true });
    await trigger.click();
    assert.equal(await page.getByRole('button', { name: 'Close about this feed' }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('dialog')), true);
    await page.locator('summary').click();
    assert.equal(await page.locator('.source-list a').count(), 8);
    await screenshot('sources-desktop');
    await audit();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').isVisible(), false);
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  });
  await check('Primary links retain the observed X IDs and safe new-tab behavior', async () => {
    const links = await page.locator('.read-post').evaluateAll(links => links.map(a => ({ href: a.href, target: a.target, rel: a.rel })));
    assert.equal(links.length, 8);
    for (const link of links) { assert.match(link.href, /^https:\/\/x\.com\/[\w]+\/status\/\d{19}$/); assert.equal(link.target, '_blank'); assert.match(link.rel, /noopener/); }
  });
  await check('Keyboard skip, search, and bookmark flows have visible focus', async () => {
    await reset();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
    await screenshot('skip-focus');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true);
    const search = page.getByRole('searchbox'); await search.focus();
    await page.keyboard.type('Ansem'); await expectCount(1);
    const save = page.locator('article button'); await save.focus();
    assert.equal(await save.evaluate(el => getComputedStyle(el).outlineWidth), '2px');
    await screenshot('bookmark-focus');
    await page.keyboard.press('Enter'); assert.equal(await save.getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Space'); assert.equal(await save.getAttribute('aria-pressed'), 'false');
    await reset();
  });

  for (const width of [320, 390, 740, 900, 1080, 1440]) {
    await check(`Responsive layout and axe scan at ${width}px`, async () => {
      await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 }); await reset();
      const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(size.scroll <= size.viewport, `${size.scroll}px content in ${size.viewport}px viewport`);
      await audit();
      if (width === 390 || width === 1440 || width === 320) await screenshot(`feed-${width}`);
      if (width === 390) {
        const bottom = await page.locator('article').first().locator('.read-post').evaluate(el => el.getBoundingClientRect().bottom);
        assert.ok(bottom <= 844, `First post action at ${bottom}px`);
        return { firstReadActionBottom: bottom, viewportHeight: 844 };
      }
    });
  }
  await check('Mobile filters, search, bookmarks, and source dialog work at 390px', async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await reset();
    await page.getByRole('group').getByRole('button', { name: 'AI & agents' }).click(); await expectCount(3);
    await page.getByRole('searchbox').fill('swarmbrain'); await expectCount(1);
    await page.locator('article button').click();
    await page.getByRole('link', { name: /Saved posts/ }).click(); await expectCount(1);
    await screenshot('saved-mobile');
    await page.getByRole('button', { name: 'On this browser' }).click();
    await screenshot('sources-mobile'); await audit();
    await page.keyboard.press('Escape');
    await page.locator('article button').click(); await expectCount(0); await audit();
    await reset();
  });
  await check('Reduced motion disables transitions', async () => {
    const durations = await page.locator('button, a').evaluateAll(elements => [...new Set(elements.map(el => getComputedStyle(el).transitionDuration))]);
    assert.deepEqual(durations, ['0s']);
  });
  await check('200% text enlargement reflows at a 390px viewport', async () => {
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(size.scroll <= size.viewport, `${size.scroll}px content in ${size.viewport}px viewport`);
    await screenshot('text-200-mobile');
    await reset();
  });
  await check('Forced colors preserves keyboard focus', async () => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.getByRole('searchbox').focus();
    assert.equal(await page.locator('.search-field').evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
    await screenshot('forced-colors');
    await page.emulateMedia({ forcedColors: 'none' });
  });
  await check('Bookmarks synchronize across same-origin tabs', async () => {
    const second = await context.newPage(); await second.goto(url);
    await second.locator('article').first().getByRole('button').click();
    await page.waitForFunction(() => document.querySelector('.nav-count').textContent === '1');
    await second.locator('article').first().getByRole('button').click();
    await page.waitForFunction(() => document.querySelector('.nav-count').textContent === '0');
    await second.close();
  });
  await check('Corrupted bookmark data cannot crash the page or create phantom saves', async () => {
    await page.evaluate(() => localStorage.setItem('identity-md-signal:saved:v1', '{broken-json')); await page.reload(); await expectCount(8);
    assert.equal(await page.locator('.nav-count').textContent(), '0');
  });
  await check('Blocked storage keeps temporary bookmarks and explains the limitation', async () => {
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage denied', 'SecurityError'); }; });
    await page.locator('article').first().getByRole('button').click();
    assert.match(await page.getByRole('alert').innerText(), /until you close or reload/);
    await page.getByRole('link', { name: /Saved posts/ }).click(); await expectCount(1);
    await screenshot('storage-unavailable');
    await page.reload(); await expectCount(0);
    await reset();
  });
  await check('No runtime console errors, missing assets, or external runtime requests', async () => {
    assert.deepEqual(consoleErrors, []); assert.deepEqual(requestErrors, []);
  });

  const report = { generatedAt: new Date().toISOString(), export: 'dist/', hostingPrefix: '/preview/', engine: 'Chromium', results, consoleErrors, requestErrors, limitations: ['WebKit launch unavailable: missing host libraries.', 'No physical device or screen-reader session.', 'Text enlargement is not native browser zoom.', 'External X availability is not certified; X returned HTTP 403 during source research.'] };
  await writeFile(resolve(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  if (results.some(r => !r.passed)) process.exitCode = 1;
  if (process.argv.includes('--inspect')) {
    await page.setViewportSize({ width: 1440, height: 1000 }); await reset();
    const control = resolve('test/scratch/preview'); await mkdir(control, { recursive: true });
    await writeFile(resolve(control, 'url.txt'), url);
    console.log(`Inspection preview: ${url}. Ends on test/scratch/preview/done or after 5 minutes.`);
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      if (await access(resolve(control, 'done')).then(() => true, () => false)) break;
      await new Promise(done => setTimeout(done, 500));
    }
  }
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
