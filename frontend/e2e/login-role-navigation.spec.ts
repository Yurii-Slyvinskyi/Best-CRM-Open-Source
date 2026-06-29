import { expect, test } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'demo_manager';
const password = process.env.E2E_PASSWORD ?? 'DemoPass_123!';

test('manager can log in, sees manager navigation, is blocked from client route, and logs out', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /^Welcome,/ })).toBeVisible();

  const sidebar = page.getByRole('complementary');

  await expect(sidebar.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Projects' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Worklogs' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Finance' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Teams' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Users' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Notifications' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Payments' })).toHaveCount(0);
  await expect(sidebar.getByRole('link', { name: 'Salaries' })).toHaveCount(0);
  await expect(sidebar.getByRole('link', { name: 'Reviews' })).toHaveCount(0);

  await page.goto('/payments');
  await expect(page.getByRole('heading', { name: 'Forbidden' })).toBeVisible();
  await expect(page.getByText('403 access preview')).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
