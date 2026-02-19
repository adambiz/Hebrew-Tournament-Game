const { test, expect } = require('@playwright/test');

test('homepage shows main headline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /1\s*(vs|gegen)\s*95/i })).toBeVisible();
});
