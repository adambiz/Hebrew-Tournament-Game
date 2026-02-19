const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SMALL_THICK = path.join(
  ROOT,
  'kenney_ui-pack-pixel-adventure',
  'Tiles',
  'Small tiles',
  'Thick outline'
);
const CURATED = path.join(ROOT, 'assets', 'ui', 'kenney');

function expectAssetToMatch(tileName, assetName) {
  const source = fs.readFileSync(path.join(SMALL_THICK, tileName));
  const curated = fs.readFileSync(path.join(CURATED, assetName));
  expect(curated.equals(source)).toBe(true);
}

function extractTranslateY(transformValue) {
  if (!transformValue || transformValue === 'none') return 0;

  const matrix2d = transformValue.match(/^matrix\((.+)\)$/);
  if (matrix2d) {
    const values = matrix2d[1].split(',').map((part) => Number(part.trim()));
    return Number.isFinite(values[5]) ? values[5] : 0;
  }

  const matrix3d = transformValue.match(/^matrix3d\((.+)\)$/);
  if (matrix3d) {
    const values = matrix3d[1].split(',').map((part) => Number(part.trim()));
    return Number.isFinite(values[13]) ? values[13] : 0;
  }

  return 0;
}

function extractPrimaryShadowYOffset(boxShadowValue) {
  if (!boxShadowValue || boxShadowValue === 'none') return 0;
  const match = boxShadowValue.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/);
  return match ? Number(match[2]) : 0;
}

async function waitForReady(page) {
  await page.goto('/');
  await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
  await expect(page.locator('#start-button')).toBeEnabled();
}

test.describe('Kenney theme fidelity', () => {
  test('uses corrected sprites and simplified button structure', async ({ page }) => {
    expectAssetToMatch('tile_0085.png', 'ribbon-red-right.png');
    expectAssetToMatch('tile_0125.png', 'badge-cream.png');
    expectAssetToMatch('tile_0050.png', 'icon-close.png');

    await waitForReady(page);

    const buttonVisuals = await page.evaluate(() => {
      const button = document.getElementById('start-button');
      const style = getComputedStyle(button);
      const before = getComputedStyle(button, '::before');
      const after = getComputedStyle(button, '::after');
      return {
        backgroundImage: style.backgroundImage,
        borderRadius: parseFloat(style.borderTopLeftRadius),
        beforeContent: before.content,
        afterContent: after.content
      };
    });

    expect(buttonVisuals.backgroundImage).toBe('none');
    expect(buttonVisuals.beforeContent).toBe('none');
    expect(buttonVisuals.afterContent).toBe('none');
    expect(buttonVisuals.borderRadius).toBeGreaterThan(0);

    await page.fill('#player-name', 'Fidelity Hero');
    await page.click('#start-button');
    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);

    const rankIconAsset = await page.locator('#player-current-rank .pixel-icon').first().evaluate((el) =>
      getComputedStyle(el).backgroundImage
    );
    expect(rankIconAsset).toContain('badge-cream.png');
    expect(rankIconAsset).not.toContain('meter-blue.png');
    expect(rankIconAsset).not.toContain('meter-red.png');

    await page.evaluate(() => {
      window.HebrewGame?.ui?.openStoreOverlay?.(document.getElementById('use-powerup'));
    });
    await expect(page.locator('#store-overlay')).toBeVisible();

    const closeIconAsset = await page.locator('#close-store-x .pixel-icon').evaluate((el) =>
      getComputedStyle(el).backgroundImage
    );
    expect(closeIconAsset).toContain('icon-close.png');

    const decorativeFlags = await page.evaluate(() => ({
      startHeading: !!document.querySelector('#start-screen .pixel-flag'),
      roundHeading: !!document.querySelector('#round-screen .pixel-flag'),
      storeHeading: !!document.querySelector('#store-overlay .store-header .pixel-flag'),
      totalFlags: document.querySelectorAll('.pixel-flag').length
    }));

    expect(decorativeFlags.startHeading).toBe(true);
    expect(decorativeFlags.roundHeading).toBe(true);
    expect(decorativeFlags.storeHeading).toBe(true);
    expect(decorativeFlags.totalFlags).toBeGreaterThan(3);
  });

  test('keeps button rest and press mechanics stable', async ({ page }) => {
    await waitForReady(page);
    const startButton = page.locator('#start-button');
    await expect(startButton).toBeVisible();

    const restingStyles = await startButton.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        height: parseFloat(style.height),
        transform: style.transform,
        boxShadow: style.boxShadow
      };
    });

    const box = await startButton.boundingBox();
    if (!box) throw new Error('Start button bounding box unavailable');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => {
      const button = document.getElementById('start-button');
      return !!button && button.matches(':active');
    });
    await page.waitForTimeout(140);
    const activeStyles = await startButton.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        transform: style.transform,
        boxShadow: style.boxShadow
      };
    });
    await page.mouse.up();

    expect(restingStyles.height).toBeGreaterThanOrEqual(43.5);
    expect(restingStyles.height).toBeLessThanOrEqual(44.5);

    const restingTranslateY = extractTranslateY(restingStyles.transform);
    const activeTranslateY = extractTranslateY(activeStyles.transform);
    expect(restingTranslateY).toBeLessThanOrEqual(0.1);
    expect(activeTranslateY).toBeGreaterThanOrEqual(1.5);

    const restingShadowY = extractPrimaryShadowYOffset(restingStyles.boxShadow);
    const activeShadowY = extractPrimaryShadowYOffset(activeStyles.boxShadow);
    expect(restingShadowY).toBeGreaterThan(0);
    expect(activeShadowY).toBeGreaterThan(0);
    expect(activeShadowY).toBeLessThan(restingShadowY);
  });
});
