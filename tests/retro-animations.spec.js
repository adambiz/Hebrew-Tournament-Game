const { test, expect } = require('@playwright/test');

async function waitForReady(page) {
  await page.goto('/');
  await expect(page.locator('#main-battle-title')).toBeVisible();
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
}

test('battle title characters are wrapped for wave animation', async ({ page }) => {
  await waitForReady(page);

  await page.waitForFunction(() => {
    return document.querySelectorAll('#main-battle-title .title-char').length > 3;
  });
});

test('battle title wave can be triggered and applies wave class', async ({ page }) => {
  await waitForReady(page);

  const sawWaveClass = await page.evaluate(async () => {
    if (!window.HebrewGame?.ui?.playBattleTitleWave) return false;
    window.HebrewGame.ui.playBattleTitleWave({ immediate: true });

    const deadline = Date.now() + 1800;
    while (Date.now() < deadline) {
      if (document.querySelector('#main-battle-title .title-char-wave')) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 24));
    }
    return false;
  });

  expect(sawWaveClass).toBe(true);
});

test('reduced motion disables battle title wave animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await waitForReady(page);

  const sawWaveClass = await page.evaluate(async () => {
    if (!window.HebrewGame?.ui?.playBattleTitleWave) return false;
    window.HebrewGame.ui.playBattleTitleWave({ immediate: true });

    const deadline = Date.now() + 450;
    while (Date.now() < deadline) {
      if (document.querySelector('#main-battle-title .title-char-wave')) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return false;
  });

  expect(sawWaveClass).toBe(false);
});
