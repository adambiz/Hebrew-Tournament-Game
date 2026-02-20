const { test, expect } = require('@playwright/test');

const PLAYER_AVATAR_STORAGE_KEY = 'hebrewGame_playerAvatar_v1';

async function gotoStartReady(page, options = {}) {
  if (options.clearAvatarStorage) {
    await page.addInitScript((avatarStorageKey) => {
      try {
        localStorage.removeItem(avatarStorageKey);
      } catch (_error) {
        // Ignore storage errors.
      }
    }, PLAYER_AVATAR_STORAGE_KEY);
  }

  await page.goto('/');
  await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
  await expect(page.locator('#start-button')).toBeEnabled();
}

test.describe('Start screen layout and avatar chooser', () => {
  test('keeps setup hierarchy order and selected avatar emphasis', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoStartReady(page, { clearAvatarStorage: true });

    await expect(page.locator('.language-picker-label')).toHaveCount(0);

    const layoutStats = await page.evaluate(() => {
      const language = document.querySelector('#start-screen .language-picker');
      const identity = document.querySelector('#start-screen .player-identity-row');
      const chooser = document.querySelector('#start-screen #avatar-selection');
      const startButton = document.getElementById('start-button');
      const preview = document.querySelector('.avatar-selected-preview-main');
      const firstChoice = document.querySelector('#player-avatar-grid .avatar-choice');
      if (!language || !identity || !chooser || !startButton || !preview || !firstChoice) return null;

      const languageRect = language.getBoundingClientRect();
      const identityRect = identity.getBoundingClientRect();
      const chooserRect = chooser.getBoundingClientRect();
      const startRect = startButton.getBoundingClientRect();
      const previewRect = preview.getBoundingClientRect();
      const firstChoiceRect = firstChoice.getBoundingClientRect();

      return {
        languageTop: languageRect.top,
        identityTop: identityRect.top,
        chooserTop: chooserRect.top,
        startTop: startRect.top,
        previewWidth: previewRect.width,
        previewHeight: previewRect.height,
        choiceWidth: firstChoiceRect.width,
        choiceHeight: firstChoiceRect.height
      };
    });

    expect(layoutStats).not.toBeNull();
    expect(layoutStats.languageTop).toBeLessThan(layoutStats.identityTop);
    expect(layoutStats.identityTop).toBeLessThan(layoutStats.chooserTop);
    expect(layoutStats.chooserTop).toBeLessThan(layoutStats.startTop);
    expect(layoutStats.previewWidth).toBeGreaterThan(layoutStats.choiceWidth);
    expect(layoutStats.previewHeight).toBeGreaterThan(layoutStats.choiceHeight);
  });

  test('shows question-mark avatar placeholder and allows start without selection', async ({ page }) => {
    await gotoStartReady(page, { clearAvatarStorage: true });

    await expect(page.locator('#selected-avatar-placeholder')).toBeVisible();
    await expect(page.locator('#selected-avatar-preview')).toBeHidden();

    await page.fill('#player-name', 'Placeholder Hero');
    await page.click('#start-button');
    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
  });

  test('pages avatar options with next and previous controls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoStartReady(page, { clearAvatarStorage: true });

    const readVisiblePaths = () => page.evaluate(() => {
      return Array.from(document.querySelectorAll('#player-avatar-grid .avatar-choice'))
        .map((button) => button.getAttribute('data-avatar-path'))
        .filter(Boolean);
    });

    const firstPage = await readVisiblePaths();
    expect(firstPage.length).toBe(12);

    await page.click('#avatar-page-next');
    const secondPage = await readVisiblePaths();
    expect(secondPage.length).toBe(12);
    expect(secondPage).not.toEqual(firstPage);

    await page.click('#avatar-page-prev');
    const previousPage = await readVisiblePaths();
    expect(previousPage).toEqual(firstPage);
  });

  test('uses 12 avatar choices on desktop and 8 on mobile after resize', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoStartReady(page, { clearAvatarStorage: true });

    await expect(page.locator('#player-avatar-grid .avatar-choice')).toHaveCount(12);

    await page.setViewportSize({ width: 360, height: 800 });
    await expect.poll(async () => page.locator('#player-avatar-grid .avatar-choice').count()).toBe(8);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect.poll(async () => page.locator('#player-avatar-grid .avatar-choice').count()).toBe(12);
  });
});
