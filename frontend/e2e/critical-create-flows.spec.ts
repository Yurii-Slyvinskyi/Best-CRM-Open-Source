import { expect, test } from '@playwright/test';
import { loginAs, selectFirstOption, uniqueName } from './helpers';

test('manager creates a project', async ({ page }) => {
  const projectName = uniqueName('E2E Project');

  await loginAs(page, 'manager');
  await page.getByRole('link', { name: 'Projects' }).click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page.getByRole('heading', { name: 'Create project' })).toBeVisible();

  const projectForm = page.locator('form').filter({ hasText: 'Create project' });

  await projectForm.getByLabel('Name').fill(`  ${projectName}  `);
  await projectForm.getByLabel('Description').fill('  E2E project created by Playwright  ');
  await selectFirstOption(projectForm.getByLabel('Client'), 'client');
  await projectForm.getByLabel('Priority').selectOption('high');
  await projectForm.getByLabel('Budget').fill('12500.00');
  await projectForm.getByLabel('Address').fill('  100 Playwright Way  ');

  const teamCheckbox = projectForm.getByRole('checkbox').first();
  await expect(teamCheckbox).toBeVisible();
  await teamCheckbox.check();

  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page.getByText(`Project "${projectName}" created.`)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible();
});

test('worker creates a worklog', async ({ page }) => {
  const description = uniqueName('E2E worker worklog');

  await loginAs(page, 'worker');
  await page.getByRole('link', { name: 'Worklogs' }).click();

  await expect(page).toHaveURL(/\/worklogs$/);
  await expect(page.getByRole('heading', { name: 'Worklogs' })).toBeVisible();

  await page.getByRole('button', { name: 'New worklog' }).click();
  await expect(page.getByRole('heading', { name: 'Create worklog' })).toBeVisible();

  const worklogForm = page.locator('form').filter({ hasText: 'Create worklog' });

  await selectFirstOption(worklogForm.getByLabel('Project'), 'project');
  await selectFirstOption(worklogForm.getByLabel('Team'), 'team');

  const hoursInput = worklogForm.getByLabel('Hours');

  await hoursInput.fill('0');
  await page.getByRole('button', { name: 'Create worklog' }).click();
  await expect(page.getByRole('heading', { name: 'Create worklog' })).toBeVisible();
  await expect(hoursInput).toBeFocused();

  await hoursInput.fill('2');
  await worklogForm.getByLabel('Description').fill(`  ${description}  `);
  await page.getByRole('button', { name: 'Create worklog' }).click();

  await expect(page.getByText('Worklog created.')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(description)).toBeVisible();
});

test('manager creates a finance transaction', async ({ page }) => {
  const description = uniqueName('E2E finance transaction');

  await loginAs(page, 'manager');
  await page.getByRole('link', { name: 'Finance' }).click();

  await expect(page).toHaveURL(/\/finance$/);
  await expect(page.getByRole('heading', { name: 'Finance' })).toBeVisible();

  await page.getByRole('button', { name: 'New transaction' }).click();
  await expect(page.getByRole('heading', { name: 'Create transaction' })).toBeVisible();

  const transactionForm = page.locator('form').filter({ hasText: 'Create transaction' });

  await transactionForm.getByLabel('Amount').fill('250.75');
  await transactionForm.getByLabel('Type').selectOption('income');
  await transactionForm.getByLabel('Description').fill(`  ${description}  `);
  await page.getByRole('button', { name: 'Create transaction' }).click();

  await expect(page.getByText('Transaction created.')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(description)).toBeVisible();
});
