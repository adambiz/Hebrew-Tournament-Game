const { test, expect } = require('@playwright/test');

const LANGUAGE_STORAGE_KEY = 'hebrewGame_uiLanguage_v1';

async function gotoAndWaitReady(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /1\s*(vs|gegen)\s*95/i })).toBeVisible();
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
  await expect(page.locator('#start-button')).toBeEnabled();
}

async function clearStoredLanguage(page) {
  await page.goto('/');
  await page.evaluate((storageKey) => {
    try {
      localStorage.removeItem(storageKey);
    } catch (_error) {
      // Ignore storage errors in browser contexts with restricted storage.
    }
  }, LANGUAGE_STORAGE_KEY);
}

async function setLanguage(page, language) {
  await page.locator(`#language-btn-${language}`).click();
}

async function expectLanguageButtonState(page, language) {
  const activeButton = page.locator(`#language-btn-${language}`);
  const inactiveButton = page.locator(language === 'en' ? '#language-btn-de' : '#language-btn-en');
  await expect(activeButton).toHaveClass(/active/);
  await expect(activeButton).toHaveAttribute('aria-checked', 'true');
  await expect(inactiveButton).not.toHaveClass(/active/);
  await expect(inactiveButton).toHaveAttribute('aria-checked', 'false');
}

async function expectPromptToMatchLanguageFallback(page, language) {
  const promptSnapshot = await page.evaluate((lang) => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    const word = state?.currentWord || {};
    const promptText = String(document.getElementById('german-word')?.textContent || '').trim();
    const german = String(word.german || '').trim();
    const english = String(word.english || '').trim();
    const hebrew = String(word.hebrew || '').trim();

    const expected = lang === 'de'
      ? (german || english || hebrew)
      : (english || german || hebrew);

    return { promptText, expected, german, english, hebrew };
  }, language);

  expect(promptSnapshot.promptText).toBe(promptSnapshot.expected);
  expect(promptSnapshot.promptText.length).toBeGreaterThan(0);

  if (language === 'de' && promptSnapshot.german) {
    expect(promptSnapshot.promptText).toBe(promptSnapshot.german);
  }

  if (language === 'en' && promptSnapshot.english) {
    expect(promptSnapshot.promptText).toBe(promptSnapshot.english);
  }
}

test.describe('Language picker and bilingual prompts', () => {
  test('defaults to English on first load', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await expectLanguageButtonState(page, 'en');
    await expect(page.locator('#start-button')).toHaveText('Start Game');

    await expect.poll(async () => {
      return page.locator('#main-battle-title').innerText();
    }).toMatch(/1\s+vs\s+95/i);

    const languageState = await page.evaluate((storageKey) => {
      return {
        htmlLang: document.documentElement.lang,
        currentLanguage: window.HebrewGame?.i18n?.getLanguage?.(),
        storedLanguage: localStorage.getItem(storageKey)
      };
    }, LANGUAGE_STORAGE_KEY);

    expect(languageState.htmlLang).toBe('en');
    expect(languageState.currentLanguage).toBe('en');
    expect(['en', null]).toContain(languageState.storedLanguage);
  });

  test('switching to German updates start screen copy and persists', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await setLanguage(page, 'de');
    await expectLanguageButtonState(page, 'de');
    await expect(page.locator('#start-button')).toHaveText('Spiel starten');

    await expect.poll(async () => {
      return page.locator('#main-battle-title').innerText();
    }).toMatch(/1\s+gegen\s+95/i);

    const languageState = await page.evaluate((storageKey) => {
      return {
        htmlLang: document.documentElement.lang,
        currentLanguage: window.HebrewGame?.i18n?.getLanguage?.(),
        storedLanguage: localStorage.getItem(storageKey)
      };
    }, LANGUAGE_STORAGE_KEY);

    expect(languageState.htmlLang).toBe('de');
    expect(languageState.currentLanguage).toBe('de');
    expect(languageState.storedLanguage).toBe('de');
  });

  test('German selection uses German source prompt in gameplay', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await setLanguage(page, 'de');
    await page.fill('#player-name', 'Language QA DE');
    await page.click('#start-button');

    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
    await expectPromptToMatchLanguageFallback(page, 'de');
  });

  test('reload keeps previously selected language', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await setLanguage(page, 'de');
    await expect(page.locator('#start-button')).toHaveText('Spiel starten');

    await page.reload();
    await expect(page.getByRole('heading', { name: /1\s*(vs|gegen)\s*95/i })).toBeVisible();
    await page.waitForFunction(() => {
      const state = window.HebrewGame?.debug?.getGameState?.();
      return !!state && state.dataReady === true;
    }, { timeout: 20000 });

    await expectLanguageButtonState(page, 'de');
    await expect(page.locator('#start-button')).toHaveText('Spiel starten');
  });

  test('switching back to English restores English UI and prompt source', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await setLanguage(page, 'de');
    await setLanguage(page, 'en');

    await expectLanguageButtonState(page, 'en');
    await expect(page.locator('#start-button')).toHaveText('Start Game');

    await expect.poll(async () => {
      return page.locator('#main-battle-title').innerText();
    }).toMatch(/1\s+vs\s+95/i);

    await page.fill('#player-name', 'Language QA EN');
    await page.click('#start-button');

    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
    await expectPromptToMatchLanguageFallback(page, 'en');
  });
});
