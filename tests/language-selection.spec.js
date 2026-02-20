const { test, expect } = require('@playwright/test');

const LANGUAGE_STORAGE_KEY = 'hebrewGame_uiLanguage_v1';
const HEBREW_CUE_FALLBACK = '👂🔊';
const SUPPORTED_LANGUAGES = ['en', 'de', 'he'];

async function gotoAndWaitReady(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /1\s*(vs|gegen|נגד)\s*95/i })).toBeVisible();
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

async function expectLanguageButtonState(page, activeLanguage) {
  for (const language of SUPPORTED_LANGUAGES) {
    const button = page.locator(`#language-btn-${language}`);
    const shouldBeActive = language === activeLanguage;
    if (shouldBeActive) {
      await expect(button).toHaveClass(/active/);
      await expect(button).toHaveAttribute('aria-checked', 'true');
    } else {
      await expect(button).not.toHaveClass(/active/);
      await expect(button).toHaveAttribute('aria-checked', 'false');
    }
  }
}

async function expectPromptToMatchLanguageFallback(page, language) {
  const promptSnapshot = await page.evaluate(({ lang, cueFallback }) => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    const word = state?.currentWord || {};
    const promptText = String(document.getElementById('german-word')?.textContent || '').trim();
    const i18nPrompt = String(window.HebrewGame?.i18n?.getPromptText?.(word) || '').trim();
    const german = String(word.german || '').trim();
    const english = String(word.english || '').trim();
    const hebrew = String(word.hebrew || '').trim();
    const emoji = String(word.emoji || '').trim();

    let expected = '';
    if (lang === 'de') {
      expected = german || english || hebrew;
    } else if (lang === 'he') {
      expected = i18nPrompt || emoji || cueFallback;
    } else {
      expected = english || german || hebrew;
    }

    return { promptText, expected, german, english, hebrew, emoji, i18nPrompt };
  }, {
    lang: language,
    cueFallback: HEBREW_CUE_FALLBACK
  });

  expect(promptSnapshot.promptText).toBe(promptSnapshot.expected);
  expect(promptSnapshot.promptText.length).toBeGreaterThan(0);

  if (language === 'de' && promptSnapshot.german) {
    expect(promptSnapshot.promptText).toBe(promptSnapshot.german);
  }

  if (language === 'en' && promptSnapshot.english) {
    expect(promptSnapshot.promptText).toBe(promptSnapshot.english);
  }

  if (language === 'he') {
    expect(promptSnapshot.promptText).toBe(promptSnapshot.i18nPrompt);
    expect(promptSnapshot.promptText).not.toBe(promptSnapshot.german);
    expect(promptSnapshot.promptText).not.toBe(promptSnapshot.english);
    expect(promptSnapshot.promptText).not.toBe(promptSnapshot.hebrew);
  }
}

test.describe('Language picker and trilingual prompts', () => {
  test('defaults to English on first load', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await expectLanguageButtonState(page, 'en');
    await expect(page.locator('#start-button')).toHaveText('Start Game');

    await expect.poll(async () => page.locator('#main-battle-title').innerText())
      .toMatch(/1\s+vs\s+95/i);

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

    await expect.poll(async () => page.locator('#main-battle-title').innerText())
      .toMatch(/1\s+gegen\s+95/i);

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

  test('switching to Hebrew updates UI language and persists', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await setLanguage(page, 'he');
    await expectLanguageButtonState(page, 'he');
    await expect(page.locator('#start-button')).toHaveText('התחל משחק');

    await expect.poll(async () => page.locator('#main-battle-title').innerText())
      .toMatch(/1\s+נגד\s+95/i);

    const languageState = await page.evaluate((storageKey) => {
      return {
        htmlLang: document.documentElement.lang,
        uiLanguage: document.body?.dataset?.uiLanguage || null,
        currentLanguage: window.HebrewGame?.i18n?.getLanguage?.(),
        storedLanguage: localStorage.getItem(storageKey),
        storeNeedMoreCoinsBadge: window.HebrewGame?.i18n?.t?.('store.needMoreCoinsBadge') || ''
      };
    }, LANGUAGE_STORAGE_KEY);

    expect(languageState.htmlLang).toBe('he');
    expect(languageState.uiLanguage).toBe('he');
    expect(languageState.currentLanguage).toBe('he');
    expect(languageState.storedLanguage).toBe('he');
    expect(languageState.storeNeedMoreCoinsBadge).toBe('חסרים מטבעות');
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

  test('Hebrew selection uses emoji cue prompt in gameplay', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await setLanguage(page, 'he');
    await page.fill('#player-name', 'Language QA HE');
    await page.click('#start-button');

    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
    await expectPromptToMatchLanguageFallback(page, 'he');

    const cueSnapshot = await page.evaluate((cueFallback) => {
      const state = window.HebrewGame?.debug?.getGameState?.();
      const currentWord = state?.currentWord || {};
      const promptText = String(document.getElementById('german-word')?.textContent || '').trim();
      const emoji = String(currentWord.emoji || '').trim();
      const i18nPrompt = String(window.HebrewGame?.i18n?.getPromptText?.(currentWord) || '').trim();
      return {
        hasEmojiField: Object.prototype.hasOwnProperty.call(currentWord, 'emoji'),
        emoji,
        promptText,
        cueFallback,
        i18nPrompt
      };
    }, HEBREW_CUE_FALLBACK);
    expect(cueSnapshot.hasEmojiField).toBe(true);
    expect(cueSnapshot.promptText).toBe(cueSnapshot.i18nPrompt);
    if (cueSnapshot.emoji.length > 0) {
      expect(cueSnapshot.promptText).toBe(cueSnapshot.emoji);
    } else {
      expect(cueSnapshot.promptText).not.toBe(cueSnapshot.cueFallback);
    }
  });

  test('Hebrew cue mode infers emoji when emoji field is missing', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    const inferredCue = await page.evaluate((cueFallback) => {
      const i18n = window.HebrewGame?.i18n;
      if (!i18n || typeof i18n.getPromptText !== 'function' || typeof i18n.setLanguage !== 'function') {
        return { prompt: '', nosePrompt: '', cueFallback };
      }

      i18n.setLanguage('he');
      const prompt = String(i18n.getPromptText({
        german: 'Die Katze trägt einen großen Hut',
        english: 'The cat wears a big hat',
        hebrew: 'החתול לובש כובע גדול',
        emoji: ''
      }) || '').trim();
      const nosePrompt = String(i18n.getPromptText({
        german: 'Nase',
        english: 'Nose',
        hebrew: 'אף',
        emoji: ''
      }) || '').trim();
      return { prompt, nosePrompt, cueFallback };
    }, HEBREW_CUE_FALLBACK);

    expect(inferredCue.prompt).toContain('🐱');
    expect(inferredCue.prompt).toContain('🎩');
    expect(inferredCue.prompt).not.toBe(inferredCue.cueFallback);
    expect(inferredCue.nosePrompt).toContain('👃');
    expect(inferredCue.nosePrompt).not.toBe(inferredCue.cueFallback);
  });

  test('Hebrew cue mode keeps emoji cues when CSV loading fails', async ({ page }) => {
    await clearStoredLanguage(page);
    await page.route('**/data/hebrew-german-words.csv', route => route.abort('failed'));
    await gotoAndWaitReady(page);

    await setLanguage(page, 'he');
    await page.fill('#player-name', 'Language QA HE Fallback');
    await page.click('#start-button');

    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);

    const cueSnapshot = await page.evaluate((cueFallback) => {
      const state = window.HebrewGame?.debug?.getGameState?.();
      const currentWord = state?.currentWord || {};
      const promptText = String(document.getElementById('german-word')?.textContent || '').trim();
      return {
        promptText,
        cueFallback,
        german: String(currentWord.german || '').trim(),
        english: String(currentWord.english || '').trim(),
        hebrew: String(currentWord.hebrew || '').trim(),
        emoji: String(currentWord.emoji || '').trim()
      };
    }, HEBREW_CUE_FALLBACK);

    expect(cueSnapshot.promptText.length).toBeGreaterThan(0);
    expect(cueSnapshot.promptText).not.toBe(cueSnapshot.cueFallback);
    expect(cueSnapshot.promptText).not.toBe(cueSnapshot.german);
    expect(cueSnapshot.promptText).not.toBe(cueSnapshot.english);
    expect(cueSnapshot.promptText).not.toBe(cueSnapshot.hebrew);
    expect(cueSnapshot.emoji.length).toBeGreaterThan(0);
  });

  test('reload keeps previously selected Hebrew language', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await setLanguage(page, 'he');
    await expect(page.locator('#start-button')).toHaveText('התחל משחק');

    await page.reload();
    await expect(page.getByRole('heading', { name: /1\s*(vs|gegen|נגד)\s*95/i })).toBeVisible();
    await page.waitForFunction(() => {
      const state = window.HebrewGame?.debug?.getGameState?.();
      return !!state && state.dataReady === true;
    }, { timeout: 20000 });

    await expectLanguageButtonState(page, 'he');
    await expect(page.locator('#start-button')).toHaveText('התחל משחק');
  });

  test('switching back to English restores English UI and prompt source', async ({ page }) => {
    await clearStoredLanguage(page);
    await gotoAndWaitReady(page);

    await setLanguage(page, 'he');
    await setLanguage(page, 'en');

    await expectLanguageButtonState(page, 'en');
    await expect(page.locator('#start-button')).toHaveText('Start Game');

    await expect.poll(async () => page.locator('#main-battle-title').innerText())
      .toMatch(/1\s+vs\s+95/i);

    await page.fill('#player-name', 'Language QA EN');
    await page.click('#start-button');

    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
    await expectPromptToMatchLanguageFallback(page, 'en');
  });
});
