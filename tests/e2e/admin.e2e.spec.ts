import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { cleanupCrmWorkspace, crmWorkspaceFixture, seedCrmWorkspace } from '../helpers/seedCrmWorkspace'
import { cleanupPortalCompany, portalCompanyFixture, seedPortalCompany } from '../helpers/seedPortalCompany'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    await seedTestUser()
    await seedCrmWorkspace()
    await seedPortalCompany()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupPortalCompany()
    await cleanupCrmWorkspace()
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin$/)
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('/admin/collections/users')
    await expect(page).toHaveURL(/\/admin\/collections\/users$/)
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('/admin/collections/pages/create')
    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="title"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('can open the ops crm workspace', async () => {
    await page.goto('/ops')
    await expect(page.getByRole('heading', { name: 'Ops dashboard' })).toBeVisible()
    await page.getByRole('tab', { name: 'crm.workspace' }).click()
    await expect(page.getByText('Anything stale, overdue, or hot enough to need attention first.')).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Needs attention' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Search CRM workspace' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Stale only' })).toBeVisible()
  })

  test('can load CRM detail and log a note from the left rail', async () => {
    await page.goto('/ops')
    await page.getByRole('tab', { name: 'crm.workspace' }).click()
    await page.getByRole('radio', { name: 'Companies' }).click()
    await page.getByRole('button', { name: new RegExp(crmWorkspaceFixture.accountName) }).click()

    await expect(page.getByText('Open record')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Summary' })).toBeVisible()
    await expect(page.getByLabel('Note title')).toBeVisible()

    await page.getByLabel('Note title').fill('E2E account note')
    await page.getByRole('textbox', { name: 'Note', exact: true }).fill(crmWorkspaceFixture.noteBody)
    await page.getByRole('button', { name: 'Save note' }).click()

    await expect(page.getByText('Note saved.')).toBeVisible()
    await page.getByRole('tab', { name: 'Related' }).click()
    await expect(page.getByText('E2E account note')).toBeVisible()
  })

  test('can impersonate a customer from ops and keep the preview toolbar active', async () => {
    await page.goto('/ops')
    await expect(page.getByText('Admin preview')).toBeVisible()

    await page.getByRole('button', { name: 'Open' }).click()
    await page.getByPlaceholder('Search by name, email, or company').fill(portalCompanyFixture.customerEmail)
    await page.getByRole('button', { name: /Preview/ }).first().click()

    await expect(page).toHaveURL(/\/$/)

    await page.goto('/invoices')
    await expect(page.getByText(portalCompanyFixture.invoiceTitle)).toBeVisible()
    await expect(page.getByText(portalCompanyFixture.customerEmail).first()).toBeVisible()

    const reopenToolbar = page.getByRole('button', { name: 'Open' })
    if (await reopenToolbar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reopenToolbar.click()
    }
    await expect(page.getByRole('button', { name: 'Switch back to admin' })).toBeVisible({
      timeout: 15000,
    })

    const stopImpersonation = page.waitForResponse(
      (response) =>
        response.url().includes('/api/internal/impersonation/stop') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Switch back to admin' }).click()
    await stopImpersonation
    await page.goto('/ops')
    await expect(page.getByRole('heading', { name: 'Ops dashboard' })).toBeVisible()
  })
})
