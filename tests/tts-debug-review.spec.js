const { test, expect } = require('@playwright/test');

test.describe('TTS debug review panel', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            const clipboardWrites = [];
            window.__ttsDebugClipboardWrites = clipboardWrites;

            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText = async (text) => {
                    clipboardWrites.push(String(text || ''));
                };
                return;
            }

            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: {
                    writeText: async (text) => {
                        clipboardWrites.push(String(text || ''));
                    }
                }
            });
        });
    });

    test('opens from start menu, supports sentence and word issue flags, and copies report', async ({ page }) => {
        await page.goto('/');
        await page.waitForFunction(() => {
            const state = window.HebrewGame?.debug?.getGameState?.();
            return !!state && state.dataReady === true;
        }, { timeout: 20000 });

        await expect(page.locator('#open-tts-debug')).toBeVisible();
        await page.click('#open-tts-debug');
        await expect(page.locator('#tts-debug-panel')).toBeVisible();

        await page.waitForFunction(() => {
            return document.querySelectorAll('.tts-debug-row').length > 0;
        });

        const firstRow = page.locator('.tts-debug-row').first();
        const sentenceFlagButton = firstRow.locator('button[data-action="toggle-sentence-issue"]').first();
        await sentenceFlagButton.click();
        await expect(sentenceFlagButton).toHaveAttribute('aria-pressed', 'true');

        const firstWordStressButton = firstRow.locator('button[data-action="toggle-word-issue"][data-kind="wrongStress"]').first();
        await firstWordStressButton.click();
        await expect(firstWordStressButton).toHaveAttribute('aria-pressed', 'true');

        await page.click('#tts-debug-copy-flagged');
        const copiedText = await page.evaluate(() => {
            const writes = window.__ttsDebugClipboardWrites || [];
            return writes[writes.length - 1] || '';
        });

        expect(copiedText).toContain('round,german,hebrew,english,hebrew_vocalized,tts_text,spoken_text,issue_level,issue_type,word_index,word_text,notes');
        expect(copiedText).toContain('# Hebrew Tournament TTS issues');
        expect(copiedText).toContain('unclear_or_unnatural');
        expect(copiedText).toContain('wrong_stress');
    });
});
