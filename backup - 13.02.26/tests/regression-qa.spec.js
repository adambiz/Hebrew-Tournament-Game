const { test, expect } = require('@playwright/test');

const COMMON_HEBREW_LETTERS = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת',
  'ך', 'ם', 'ן', 'ף', 'ץ'
];

const POWER_UP_COSTS = {
  double_points: 6,
  letter_filter: 2,
  second_chance_round: 4,
  easier_word: 2
};

function parseNumber(textValue) {
  const match = String(textValue ?? '').match(/-?\d+/);
  return match ? Number(match[0]) : 0;
}

async function readState(page) {
  return page.evaluate(() => {
    const gs = window.HebrewGame?.debug?.getGameState?.();
    if (!gs) return null;

    const currentWord = gs.currentWord
      ? {
          isPhrase: !!gs.currentWord.isPhrase,
          hebrew: gs.currentWord.hebrew || '',
          words: Array.isArray(gs.currentWord.words) ? gs.currentWord.words.slice() : []
        }
      : null;

    return {
      currentRound: gs.currentRound,
      currentWordIndex: gs.currentWordIndex,
      roundWordsLength: Array.isArray(gs.roundWords) ? gs.roundWords.length : 0,
      dataReady: !!gs.dataReady,
      playerCoins: gs.playerCoins,
      roundCoinsEarned: gs.roundCoinsEarned,
      roundScore: gs.roundScore,
      typedWord: gs.typedWord,
      typedWords: Array.isArray(gs.typedWords) ? gs.typedWords.slice() : null,
      currentWord,
      powerUpsActive: {
        doublePoints: !!gs.powerUpsActive?.doublePoints,
        secondChanceRound: !!gs.powerUpsActive?.secondChanceRound,
        easierWordCurrentLevel: gs.powerUpsActive?.easierWordCurrentLevel || 0,
        hasOriginalWord: !!gs.powerUpsActive?.originalWord
      }
    };
  });
}

async function waitForReady(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /1\s*Against\s*95/i })).toBeVisible();
  await page.waitForFunction(() => {
    const state = window.HebrewGame?.debug?.getGameState?.();
    return !!state && state.dataReady === true;
  }, { timeout: 20000 });
  await expect(page.locator('#start-button')).toBeEnabled();
}

async function startGame(page, playerName = 'Regression Tester') {
  await page.fill('#player-name', playerName);
  await page.click('#start-button');
  await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
}

async function getMistakeLetter(page, expectedLetter) {
  return page.evaluate((targetLetter) => {
    const enabledKeyboardLetters = Array.from(
      document.querySelectorAll('.keyboard-key:not(:disabled)')
    )
      .map((key) => key.textContent?.trim())
      .filter(Boolean);

    return enabledKeyboardLetters.find((letter) => letter !== targetLetter) || targetLetter;
  }, expectedLetter);
}

async function clickLetter(page, letter) {
  const keyButton = page.getByRole('button', { name: `Hebrew letter ${letter}`, exact: true }).first();
  await expect(keyButton).toBeVisible();
  await keyButton.click();
}

async function typeCurrentWord(page, options = {}) {
  const { makeMistake = false, replaceExisting = false } = options;
  const state = await readState(page);
  if (!state || !state.currentWord) {
    throw new Error('No active word available to type');
  }

  if (replaceExisting) {
    const firstSlot = page.locator('[data-testid="word-slot"][data-letter-index="0"]').first();
    if (await firstSlot.count()) {
      await firstSlot.click();
    }
  }

  let mistakeApplied = false;
  const typeLetter = async (expectedLetter) => {
    let letterToType = expectedLetter;
    if (makeMistake && !mistakeApplied) {
      letterToType = await getMistakeLetter(page, expectedLetter);
      mistakeApplied = true;
    }
    await clickLetter(page, letterToType);
  };

  if (state.currentWord.isPhrase) {
    for (const word of state.currentWord.words) {
      for (const letter of word) {
        await typeLetter(letter);
      }
    }
  } else {
    for (const letter of state.currentWord.hebrew) {
      await typeLetter(letter);
    }
  }

  await expect(page.locator('#submit-word')).toBeEnabled();
}

async function waitForWordAdvanceOrResults(page, beforeState) {
  await page.waitForFunction(
    ({ round, wordIndex }) => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return false;
      const results = document.getElementById('round-results');
      const isRoundResultsVisible = !!results && !results.classList.contains('hidden');
      if (isRoundResultsVisible || gs.currentRound !== round) {
        return true;
      }
      return gs.currentWordIndex !== wordIndex;
    },
    { round: beforeState.currentRound, wordIndex: beforeState.currentWordIndex },
    { timeout: 20000 }
  );
}

async function submitCurrentWordAndWait(page) {
  const before = await readState(page);
  if (!before) throw new Error('Game state not available before submit');
  await page.locator('#submit-word').click({ force: true });
  await waitForWordAdvanceOrResults(page, before);
}

async function finishCurrentRound(page) {
  for (let step = 0; step < 14; step++) {
    const inResultsScreen = await page.evaluate(() => {
      const screen = document.getElementById('round-results');
      return !!screen && !screen.classList.contains('hidden');
    });
    if (inResultsScreen) return;

    const state = await readState(page);
    if (!state) throw new Error('State unavailable while finishing round');
    if (state.currentWordIndex >= state.roundWordsLength) {
      await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);
      return;
    }

    await typeCurrentWord(page);
    await submitCurrentWordAndWait(page);
  }

  throw new Error('Round did not complete in expected number of steps');
}

async function buyPowerUp(page, powerUpId) {
  const buyButton = page.locator(`#buy-${powerUpId}`);
  await expect(buyButton).toBeVisible();
  await expect(buyButton).toBeEnabled();

  const beforeCoins = parseNumber(await page.locator('#overlay-store-coins').innerText());
  const beforeInventory = parseNumber(await page.locator(`#inventory-${powerUpId}`).innerText());

  await buyButton.click();

  await expect(page.locator(`#inventory-${powerUpId}`)).toHaveText(String(beforeInventory + 1));
  await expect(page.locator('#overlay-store-coins')).toHaveText(String(beforeCoins - POWER_UP_COSTS[powerUpId]));
}

async function openStore(page) {
  await page.click('#visit-store');
  await expect(page.locator('#store-overlay')).toBeVisible();
}

async function closeStore(page) {
  await page.click('#close-store');
  await expect(page.locator('#store-overlay')).toHaveCount(0);
}

async function clickPowerUpButton(page, powerUpId) {
  const buttonLocator = page.locator(`.power-up-button[data-power-up-id="${powerUpId}"]`);
  await expect(buttonLocator).toBeVisible();
  await buttonLocator.scrollIntoViewIfNeeded();
  await buttonLocator.click();
}

async function continueToNextRound(page, expectedRoundNumber) {
  const nextRoundButton = page.locator('#next-round');
  await expect(nextRoundButton).toBeEnabled();
  await nextRoundButton.click();
  await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
  await expect(page.locator('#current-round')).toHaveText(String(expectedRoundNumber));
}

async function ensurePlayerCanAdvance(page) {
  await page.evaluate(() => {
    const gs = window.HebrewGame?.debug?.getGameState?.();
    if (!gs || !gs.player) return;
    gs.player.eliminated = false;
    const nextRoundButton = document.getElementById('next-round');
    if (nextRoundButton) {
      nextRoundButton.disabled = false;
      nextRoundButton.textContent = 'Next Round';
    }
  });
}

async function collectVisibleTextProtrusionIssues(page, selector) {
  return page.evaluate((targetSelector) => {
    const isVisible = (el) => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const issues = [];
    const elements = Array.from(document.querySelectorAll(targetSelector));

    elements.forEach((el) => {
      if (!isVisible(el)) return;

      const elRect = el.getBoundingClientRect();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          return node.textContent && node.textContent.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        }
      });

      let textNode = walker.nextNode();
      while (textNode) {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const textRects = Array.from(range.getClientRects());

        const protrudes = textRects.some((rect) =>
          rect.left < elRect.left - 0.5 ||
          rect.right > elRect.right + 0.5 ||
          rect.top < elRect.top - 0.5 ||
          rect.bottom > elRect.bottom + 0.5
        );

        if (protrudes) {
          issues.push({
            selector: targetSelector,
            id: el.id || null,
            className: el.className || null,
            text: (el.innerText || el.textContent || '').trim(),
            rect: {
              width: elRect.width,
              height: elRect.height
            }
          });
          break;
        }

        textNode = walker.nextNode();
      }
    });

    return issues;
  }, selector);
}

function totalLettersForWord(currentWord) {
  if (!currentWord) return 0;
  if (currentWord.isPhrase) {
    return currentWord.words.reduce((sum, word) => sum + word.length, 0);
  }
  return currentWord.hebrew.length;
}

test.describe('Regression QA and stability hardening', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => {
        const safeDelay = typeof delay === 'number' ? Math.min(delay, 25) : 0;
        return originalSetTimeout(callback, safeDelay, ...args);
      };
    });
  });

  test('keeps word-slot count stable and preserves letter size during checking', async ({ page }) => {
    await waitForReady(page);
    await startGame(page, 'Word Slot QA');

    const beforeTypingState = await readState(page);
    const expectedLength = totalLettersForWord(beforeTypingState.currentWord);
    await expect(page.locator('[data-testid="word-slot"]')).toHaveCount(expectedLength);
    await expect(page.locator('[data-testid="word-slot"][data-state="cursor-end"]')).toHaveCount(0);

    await typeCurrentWord(page);

    await expect(page.locator('[data-testid="word-slot"]')).toHaveCount(expectedLength);
    await expect(page.locator('[data-testid="word-slot"][data-state="cursor-end"]')).toHaveCount(1);

    const baselineMetrics = await page.locator('#hebrew-word-input .typed-letter').first().evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        fontSize: parseFloat(style.fontSize),
        width: parseFloat(style.width),
        height: parseFloat(style.height)
      };
    });

    const stateBeforeSubmit = await readState(page);
    await page.locator('#submit-word').click({ force: true });

    const checkedSpan = page
      .locator('#hebrew-word-input .typed-letter.correct-letter, #hebrew-word-input .typed-letter.incorrect-letter')
      .first();
    await expect(checkedSpan).toBeVisible();

    const checkedMetrics = await checkedSpan.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        fontSize: parseFloat(style.fontSize),
        width: parseFloat(style.width),
        height: parseFloat(style.height)
      };
    });

    expect(Math.abs(checkedMetrics.fontSize - baselineMetrics.fontSize)).toBeLessThanOrEqual(0.6);
    expect(Math.abs(checkedMetrics.width - baselineMetrics.width)).toBeLessThanOrEqual(0.6);
    expect(Math.abs(checkedMetrics.height - baselineMetrics.height)).toBeLessThanOrEqual(0.6);

    await waitForWordAdvanceOrResults(page, stateBeforeSubmit);
  });

  test('shows eliminated opponents with strikethrough and keeps text contained in key screens', async ({ page }) => {
    const viewports = [
      { width: 320, height: 640, name: 'mobile-small' },
      { width: 360, height: 800, name: 'mobile' },
      { width: 1280, height: 800, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForReady(page);

      const startIssues = await collectVisibleTextProtrusionIssues(page, '#start-screen button');
      expect(startIssues, `${viewport.name} start-screen text protrusion`).toEqual([]);

      await startGame(page, `Overflow ${viewport.name}`);

      const roundIssues = await collectVisibleTextProtrusionIssues(page, '#round-screen button');
      expect(roundIssues, `${viewport.name} round-screen text protrusion`).toEqual([]);

      await finishCurrentRound(page);
      await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);

      const eliminatedItems = page.locator('[data-testid="ranking-item-eliminated"]');
      await expect(eliminatedItems.first()).toBeVisible();

      const hasLineThrough = await eliminatedItems.first().locator('.ranking-name').evaluate((el) => {
        return getComputedStyle(el).textDecorationLine.includes('line-through');
      });
      expect(hasLineThrough).toBe(true);

      const resultIssues = await collectVisibleTextProtrusionIssues(page, '#round-results button');
      expect(resultIssues, `${viewport.name} results-screen text protrusion`).toEqual([]);

      await openStore(page);
      const storeIssues = await collectVisibleTextProtrusionIssues(page, '#store-overlay button');
      expect(storeIssues, `${viewport.name} store-overlay text protrusion`).toEqual([]);
      await closeStore(page);
    }
  });

  test('supports full bonus purchase and usage flow across rounds', async ({ page }) => {
    await waitForReady(page);
    await startGame(page, 'Bonus QA');

    await finishCurrentRound(page);
    await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);

    await page.evaluate(() => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return;
      gs.playerCoins = 50;
      const storeCoinsElement = document.getElementById('store-coins');
      if (storeCoinsElement) {
        storeCoinsElement.textContent = String(gs.playerCoins);
      }
    });

    await openStore(page);
    await buyPowerUp(page, 'second_chance_round');
    await buyPowerUp(page, 'easier_word');
    await buyPowerUp(page, 'letter_filter');
    await buyPowerUp(page, 'double_points');
    await closeStore(page);
    await ensurePlayerCanAdvance(page);
    await continueToNextRound(page, 2);

    await page.click('#use-powerup');
    await clickPowerUpButton(page, 'second_chance_round');

    let state = await readState(page);
    expect(state.powerUpsActive.secondChanceRound).toBe(true);

    const wordIndexBeforeMistake = state.currentWordIndex;
    await typeCurrentWord(page, { makeMistake: true });
    await page.locator('#submit-word').click({ force: true });

    await page.waitForFunction(
      (targetWordIndex) => {
        const gs = window.HebrewGame?.debug?.getGameState?.();
        const submitButton = document.getElementById('submit-word');
        return !!gs && gs.currentWordIndex === targetWordIndex && !!submitButton && !submitButton.disabled;
      },
      wordIndexBeforeMistake,
      { timeout: 20000 }
    );

    state = await readState(page);
    expect(state.currentWordIndex).toBe(wordIndexBeforeMistake);

    await typeCurrentWord(page, { replaceExisting: true });
    await submitCurrentWordAndWait(page);

    const stateAfterRetry = await readState(page);
    expect(stateAfterRetry.currentWordIndex).toBeGreaterThan(wordIndexBeforeMistake);

    await page.evaluate(() => {
      const gs = window.HebrewGame?.debug?.getGameState?.();
      if (!gs) return;
      gs.currentWord = {
        german: 'test',
        hebrew: 'אב',
        isPhrase: false,
        words: ['אב'],
        wordCount: 1,
        totalLetters: 2
      };
      gs.typedWord = '';
      gs.typedWords = null;
      gs.activeWord = 0;
      gs.activeLetterIndex = 0;
      if (typeof updateHebrewWordDisplay === 'function') {
        updateHebrewWordDisplay();
      }
      if (typeof initializeKeyboard === 'function' && typeof handleKeyPress === 'function') {
        initializeKeyboard('hebrew-keyboard', handleKeyPress);
      }
      if (typeof updateSubmitButtonState === 'function') {
        updateSubmitButtonState();
      }
    });

    await page.click('#use-powerup');
    await clickPowerUpButton(page, 'letter_filter');
    await expect(page.locator('.keyboard-key-disabled').first()).toBeVisible();

    await page.click('#use-powerup');
    await clickPowerUpButton(page, 'easier_word');

    state = await readState(page);
    expect(state.powerUpsActive.hasOriginalWord).toBe(true);
    expect(state.powerUpsActive.easierWordCurrentLevel).toBe(state.currentRound - 1);

    await typeCurrentWord(page);
    await submitCurrentWordAndWait(page);
    await page.evaluate(() => {
      if (typeof window.completeRound === 'function') {
        window.completeRound();
      }
    });
    await expect(page.locator('#round-results')).not.toHaveClass(/hidden/);
    await ensurePlayerCanAdvance(page);
    await continueToNextRound(page, 3);

    await page.click('#use-powerup');
    await clickPowerUpButton(page, 'double_points');

    const beforeDouble = await readState(page);
    expect(beforeDouble.powerUpsActive.doublePoints).toBe(true);

    const baseLetters = totalLettersForWord(beforeDouble.currentWord);
    const roundScoreBefore = beforeDouble.roundScore;

    await typeCurrentWord(page);
    await submitCurrentWordAndWait(page);

    const afterDouble = await readState(page);
    const gainedPoints = afterDouble.roundScore - roundScoreBefore;
    expect(gainedPoints).toBe(baseLetters * 2);
  });
});
