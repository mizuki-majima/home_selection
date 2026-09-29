import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// client:visible の島が動き出す（ssr 属性が外れる）まで待つ
async function hydrated(fig: import('@playwright/test').Locator) {
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator('astro-island').first()).not.toHaveAttribute('ssr', /.*/);
}

const PAGES = [
  '',
  'chapters/01-timing/',
  'chapters/02-types/',
  'chapters/03-structure/',
  'chapters/04-builders/',
  'chapters/05-money/',
  'chapters/06-land/',
  'chapters/07-balance/',
  'chapters/08-performance/',
  'about/',
];

for (const path of PAGES) {
  test(`表示できる・横スクロールしない・重大なアクセシビリティ違反がない: /${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('章ページには出典一覧があり、本文の出典番号から飛べる', async ({ page }) => {
  await page.goto('chapters/05-money/');
  const first = page.locator('sup.src a').first();
  const href = await first.getAttribute('href');
  expect(href).toMatch(/^#src-\d+$/);
  await expect(page.locator(href!)).toHaveCount(1);
});

test('スライダーを動かすと借りられる額が変わる（図5-2）', async ({ page }) => {
  await page.goto('chapters/05-money/');
  const fig = page.locator('#fig-5-2');
  await hydrated(fig);
  const out = fig.locator('.ix-readout dd').first();
  await expect(out).toHaveText('5,423万円');
  const income = fig.locator('#br-income');
  await income.focus();
  await page.keyboard.press('ArrowRight');
  await expect(out).not.toHaveText('5,423万円');
});

test('用途地域と道路幅で延べ面積が変わる（図6-3）', async ({ page }) => {
  await page.goto('chapters/06-land/');
  const fig = page.locator('#fig-6-3');
  await hydrated(fig);
  await expect(fig.locator('.ix-readout dd.accent')).toHaveText('240.0㎡');
  await fig.getByRole('button', { name: '例A' }).click();
  await expect(fig.locator('.ix-readout dd.accent')).toHaveText('150.0㎡');
});

test('reduced-motion では分解アクソメが完成形で並ぶ（図3-3）', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('chapters/03-structure/');
  await expect(page.locator('.scrolly.is-live')).toHaveCount(0);
  const frames = page.locator('#fig-3-3 .frame');
  await expect(frames).toHaveCount(5);
  for (const f of await frames.all()) await expect(f).toBeVisible();
  await context.close();
});

test('JavaScript 無効でも図と数値が表示される', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('chapters/05-money/');
  await expect(page.locator('#fig-5-2 .ix-readout dd').first()).toHaveText('5,423万円');
  await page.goto('chapters/03-structure/');
  await expect(page.locator('#fig-3-3 .frame svg').first()).toBeVisible();
  await page.goto('chapters/01-timing/');
  await expect(page.locator('#fig-1-2 svg.tl')).toBeVisible();
  await context.close();
});

test('章の「次へ」で遷移しても、図が動き・スクロール図が初期化される', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('chapters/02-types/');
  await page.locator('.chapter-nav a[rel="next"]').click();
  await expect(page).toHaveURL(/03-structure/);
  await expect(page.locator('h1')).toHaveAttribute('aria-label', '木造・鉄骨のちがい');
  await expect(page.locator('#fig-3-3 .scrolly')).toHaveClass(/is-live/);
  await page.goto('chapters/07-balance/');
  await page.locator('.chapter-nav a[rel="next"]').click();
  await expect(page).toHaveURL(/08-performance/);
  const fig = page.locator('#fig-8-3');
  await hydrated(fig);
  await fig.getByRole('button', { name: '等級6' }).click();
  await expect(fig.locator('.ix-readout dd').first()).toContainText('0.46');
  expect(errors).toEqual([]);
});

test('各章は「やさしい図」から始まり、図の難しさが順に上がる', async ({ page }) => {
  for (const path of PAGES.filter((p) => p.startsWith('chapters/'))) {
    await page.goto(path);
    const levels = await page.locator('.fig .lv').evaluateAll((els) => els.map((el) => el.querySelectorAll('i.on').length));
    expect(levels[0], path).toBe(1);
    expect([...levels].sort(), path).toEqual(levels);
  }
});

test('公開初日の旧URLから新しい章へ移動する', async ({ page }) => {
  await page.goto('chapters/05-structure/');
  await expect(page).toHaveURL(/chapters\/03-structure\/$/);
});
