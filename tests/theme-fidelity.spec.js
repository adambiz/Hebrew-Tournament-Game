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
    expectAssetToMatch('tile_0050.png', 'icon-close.png');
    expect(fs.existsSync(path.join(ROOT, 'assets', 'medal_gold_1_32.png'))).toBe(true);

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

    await expect(page.locator('#top-champions .champion-rank-index')).toHaveCount(3);
    await expect(page.locator('#top-champions .hero-avatar-champion')).toHaveCount(3);
    await expect(page.locator('#top-champions .pixel-icon')).toHaveCount(0);

    const roundRankLabels = await page.locator('#top-champions .champion-rank-index').allTextContents();
    expect(roundRankLabels.map((label) => label.trim())).toEqual(['1', '2', '3']);

    const hasLegacyEmoji = await page.evaluate(() => {
      const text = document.querySelector('#top-champions')?.textContent || '';
      return /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(text);
    });
    expect(hasLegacyEmoji).toBe(false);

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

    const pressRule = await page.evaluate(() => {
      function collectPressRules(rules, bucket) {
        for (const rule of Array.from(rules || [])) {
          if (!rule) continue;
          if (rule.type === CSSRule.IMPORT_RULE && rule.styleSheet) {
            let nestedRules = null;
            try {
              nestedRules = rule.styleSheet.cssRules;
            } catch (_error) {
              nestedRules = null;
            }
            collectPressRules(nestedRules, bucket);
            continue;
          }

          if (rule.type !== CSSRule.STYLE_RULE || !rule.selectorText || !rule.style) {
            continue;
          }

          const selectorText = String(rule.selectorText);
          if (!selectorText.includes('#start-button:active')) continue;

          bucket.push({
            selectorText,
            transform: rule.style.transform || '',
            boxShadow: rule.style.boxShadow || ''
          });
        }
      }

      const matches = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch (_error) {
          continue;
        }
        collectPressRules(rules, matches);
      }

      if (!matches.length) {
        return { found: false, selectorText: '', transform: '', boxShadow: '' };
      }
      const effective = matches[matches.length - 1];
      return { found: true, ...effective };
    });

    expect(restingStyles.height).toBeGreaterThanOrEqual(43.5);
    expect(restingStyles.height).toBeLessThanOrEqual(44.5);

    const restingTranslateY = extractTranslateY(restingStyles.transform);
    expect(restingTranslateY).toBeLessThanOrEqual(0.1);

    const restingShadowY = extractPrimaryShadowYOffset(restingStyles.boxShadow);
    expect(restingShadowY).toBeGreaterThan(0);
    expect(pressRule.found).toBe(true);
    expect(pressRule.selectorText).toContain('#start-button:active');
    expect(pressRule.transform).toContain('translateY(2px)');
    expect(pressRule.boxShadow).toContain('var(--ui-button-shadow-press)');
  });
});
