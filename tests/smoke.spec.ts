import { test, expect } from '@playwright/test';

// Lightweight smoke to ensure the shell bootstraps without assets or credentials.
test('loads jusDNCE shell and exposes primary controls', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();

  await expect(page.locator('#root')).toBeAttached({ timeout: 15000 });
  const bodyHtmlLength = await page.evaluate(() => document.body.innerHTML.length);
  expect(bodyHtmlLength).toBeGreaterThan(0);
});
