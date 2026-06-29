import { expect, type Locator, type Page } from '@playwright/test';

type E2ERole = 'manager' | 'worker';

const credentials = {
  manager: {
    username: process.env.E2E_MANAGER_USERNAME ?? process.env.E2E_USERNAME ?? 'demo_manager',
    password: process.env.E2E_MANAGER_PASSWORD ?? process.env.E2E_PASSWORD ?? 'DemoPass_123!',
  },
  worker: {
    username: process.env.E2E_WORKER_USERNAME ?? 'demo_worker',
    password: process.env.E2E_WORKER_PASSWORD ?? 'DemoPass_123!',
  },
};

export async function loginAs(page: Page, role: E2ERole) {
  const { username, password } = credentials[role];

  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /^Welcome,/ })).toBeVisible();
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`;
}

export async function selectFirstOption(select: Locator, label: string) {
  await expect(select).toBeVisible();
  await expect.poll(
    async () => select.locator('option').count(),
    { message: `Expected at least one ${label} option to be available.` },
  ).toBeGreaterThan(1);

  const value = await select.locator('option').nth(1).getAttribute('value');

  expect(value, `Expected the first ${label} option to have a value.`).toBeTruthy();
  await select.selectOption(value ?? '');
}
