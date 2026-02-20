const { test, expect } = require('@playwright/test');

async function waitForReady(page) {
    await page.goto('/');
    await page.waitForFunction(() => {
        const state = window.HebrewGame?.debug?.getGameState?.();
        return !!state && state.dataReady === true;
    }, { timeout: 20000 });
    await expect(page.locator('#start-button')).toBeEnabled();
}

async function startRound(page, playerName = 'TTS Tester') {
    await page.fill('#player-name', playerName);
    await page.click('#start-button');
    await expect(page.locator('#round-screen')).not.toHaveClass(/hidden/);
}

test.describe('Hebrew TTS controls', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.__HEBREW_GAME_TTS_FORCE_ENABLE__ = true;

            const spoken = [];
            const listeners = { voiceschanged: [] };
            let voices = [
                { name: 'Mock Hebrew Voice', lang: 'he-IL', default: true }
            ];

            function MockUtterance(text) {
                this.text = text || '';
                this.lang = '';
                this.rate = 1;
                this.pitch = 1;
                this.voice = null;
                this.onstart = null;
                this.onend = null;
                this.onerror = null;
            }

            const mockSynth = {
                speaking: false,
                getVoices() {
                    return voices.slice();
                },
                speak(utterance) {
                    this.speaking = true;
                    spoken.push({
                        text: utterance.text,
                        lang: utterance.lang,
                        rate: utterance.rate,
                        pitch: utterance.pitch,
                        voiceName: utterance.voice ? utterance.voice.name : null
                    });
                    if (typeof utterance.onstart === 'function') utterance.onstart();
                    this.speaking = false;
                    if (typeof utterance.onend === 'function') utterance.onend();
                },
                cancel() {
                    this.speaking = false;
                },
                addEventListener(type, handler) {
                    if (!listeners[type]) listeners[type] = [];
                    listeners[type].push(handler);
                },
                removeEventListener(type, handler) {
                    if (!listeners[type]) return;
                    listeners[type] = listeners[type].filter((fn) => fn !== handler);
                }
            };

            Object.defineProperty(window, 'SpeechSynthesisUtterance', {
                configurable: true,
                writable: true,
                value: MockUtterance
            });
            Object.defineProperty(window, 'speechSynthesis', {
                configurable: true,
                writable: true,
                value: mockSynth
            });

            window.__ttsTestHarness = {
                spoken,
                setVoices(nextVoices) {
                    voices = Array.isArray(nextVoices) ? nextVoices.slice() : [];
                    (listeners.voiceschanged || []).forEach((handler) => {
                        if (typeof handler === 'function') handler();
                    });
                }
            };
        });
    });

    test('auto-reads the current prompt and allows replay', async ({ page }) => {
        await waitForReady(page);
        await startRound(page);

        await page.waitForFunction(() => {
            return (window.__ttsTestHarness?.spoken?.length || 0) >= 1;
        });

        const firstSpeech = await page.evaluate(() => {
            const spoken = window.__ttsTestHarness.spoken;
            const state = window.HebrewGame?.debug?.getGameState?.();
            const currentWord = state?.currentWord;
            const rawExpectedText = currentWord
                ? (currentWord.ttsText || currentWord.hebrewVocalized || currentWord.hebrew)
                : '';
            const expectedPlan = window.HebrewGame?.tts?.getSpeechPlan
                ? window.HebrewGame.tts.getSpeechPlan(rawExpectedText)
                : {
                    text: rawExpectedText,
                    rate: 1,
                    pitch: 1
                };

            return {
                utterance: spoken[0],
                expectedText: expectedPlan.text,
                expectedRate: expectedPlan.rate,
                expectedPitch: expectedPlan.pitch
            };
        });

        expect(firstSpeech.utterance.text).toBe(firstSpeech.expectedText);
        expect(firstSpeech.utterance.lang).toBe('he-IL');
        expect(firstSpeech.utterance.rate).toBeCloseTo(firstSpeech.expectedRate, 4);
        expect(firstSpeech.utterance.pitch).toBeCloseTo(firstSpeech.expectedPitch, 4);

        const beforeReplayCount = await page.evaluate(() => window.__ttsTestHarness.spoken.length);
        await page.click('#play-hebrew-audio');
        await expect.poll(async () => {
            return page.evaluate(() => window.__ttsTestHarness.spoken.length);
        }).toBe(beforeReplayCount + 1);
    });

    test('honors tts_text > hebrew_vocalized > hebrew precedence and auto-read toggle', async ({ page }) => {
        await waitForReady(page);
        await startRound(page, 'Precedence Tester');

        await page.waitForFunction(() => {
            return (window.__ttsTestHarness?.spoken?.length || 0) >= 1;
        });

        await page.evaluate(() => {
            window.HebrewGame.tts.onPromptChanged({
                german: 'Mit',
                hebrew: 'עם',
                hebrewVocalized: 'עִם',
                ttsText: 'בְּדִיקָה'
            }, 'precedence-test');
        });

        await page.waitForFunction(() => {
            return (window.__ttsTestHarness?.spoken?.length || 0) >= 2;
        });

        const lastAfterPrecedence = await page.evaluate(() => {
            const spoken = window.__ttsTestHarness.spoken;
            return spoken[spoken.length - 1];
        });
        expect(lastAfterPrecedence.text).toBe('בְּדִיקָה');

        await page.click('#toggle-auto-read');
        await expect(page.locator('#toggle-auto-read')).toHaveAttribute('aria-pressed', 'false');
        const beforeOffPromptCount = await page.evaluate(() => window.__ttsTestHarness.spoken.length);

        await page.evaluate(() => {
            window.HebrewGame.tts.onPromptChanged({
                german: 'Mit',
                hebrew: 'עם',
                hebrewVocalized: 'עִם',
                ttsText: ''
            }, 'auto-off-test');
        });
        await page.waitForTimeout(1200);
        const afterOffPromptCount = await page.evaluate(() => window.__ttsTestHarness.spoken.length);
        expect(afterOffPromptCount).toBe(beforeOffPromptCount);

        await page.reload();
        await page.waitForFunction(() => {
            const state = window.HebrewGame?.debug?.getGameState?.();
            return !!state && state.dataReady === true;
        }, { timeout: 20000 });
        await expect(page.locator('#start-button')).toBeEnabled();
        await startRound(page, 'Precedence Tester Reloaded');

        await expect(page.locator('#toggle-auto-read')).toHaveAttribute('aria-pressed', 'false');
        await page.waitForTimeout(1200);
        const spokenAfterReload = await page.evaluate(() => window.__ttsTestHarness.spoken.length);
        expect(spokenAfterReload).toBe(0);
    });

    test('disables speech controls when no Hebrew voice is available', async ({ page }) => {
        await waitForReady(page);
        await startRound(page, 'No Voice Tester');

        await page.waitForFunction(() => {
            return (window.__ttsTestHarness?.spoken?.length || 0) >= 1;
        });

        await page.evaluate(() => {
            window.__ttsTestHarness.setVoices([]);
        });

        await page.evaluate(() => {
            window.HebrewGame.tts.onPromptChanged({
                german: 'Mit',
                hebrew: 'עם',
                hebrewVocalized: 'עִם',
                ttsText: ''
            }, 'no-voice-test');
        });

        await expect(page.locator('#play-hebrew-audio')).toBeDisabled();
        await expect(page.locator('#toggle-auto-read')).toBeDisabled();
    });
});
