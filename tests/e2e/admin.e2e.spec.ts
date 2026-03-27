import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { cleanupCrmWorkspace, crmWorkspaceFixture, seedCrmWorkspace } from '../helpers/seedCrmWorkspace'
import { cleanupPortalCompany, portalCompanyFixture, seedPortalCompany } from '../helpers/seedPortalCompany'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    test.setTimeout(120000)

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
    await page.goto('/ops/crm')
    await expect(page.getByRole('heading', { level: 1, name: 'CRM workspace' })).toBeVisible()
    await expect(page.getByText('Anything stale, overdue, or hot enough to need attention first.')).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Needs attention' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Search CRM workspace' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Mine' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Stale only' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Commercial' })).toBeVisible()
  })

  test('can filter CRM rows and qualify a lead from the workspace', async () => {
    await page.goto('/ops/crm')
    await page.getByRole('textbox', { name: 'Search CRM workspace' }).fill(crmWorkspaceFixture.leadName)
    await page.getByRole('radio', { name: 'Mine' }).click()

    const leadRow = page
      .locator('div.rounded-2xl.border.bg-card')
      .filter({ has: page.getByRole('button', { name: crmWorkspaceFixture.leadName }) })
      .first()
    await expect(leadRow).toBeVisible()

    await leadRow.getByRole('button', { name: 'Qualify', exact: true }).click()
    await expect(leadRow.getByText('Qualified')).toBeVisible()
  })

  test('can load CRM detail and log a note from the left rail', async () => {
    await page.goto('/ops/crm')
    await page.getByRole('radio', { name: 'Companies' }).click()
    await page.getByRole('button', { name: new RegExp(crmWorkspaceFixture.accountName) }).click()

    await expect(page.getByText('Open record')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Summary' })).toBeVisible()
    await expect(page.getByLabel('Note title')).toBeVisible()

    await page.getByLabel('Note title').fill('E2E account note')
    await page.getByRole('textbox', { name: 'Note', exact: true }).fill(crmWorkspaceFixture.noteBody)
    await page.getByRole('button', { name: 'Save note' }).click()

    await expect(page.getByText('Note saved.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Note', exact: true })).toHaveValue('')
  })

  test('can impersonate a customer from ops and keep the preview toolbar active', async () => {
    await page.goto('/ops')
    await expect(page.getByText('Admin preview')).toBeVisible()

    await page.locator('div').filter({ hasText: 'Admin preview' }).getByRole('button', { name: 'Open' }).click()
    await page.getByPlaceholder('Search by name, email, or company').fill(portalCompanyFixture.customerEmail)
    const startImpersonation = page.waitForResponse(
      (response) =>
        response.url().includes('/api/internal/impersonation/start') &&
        response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /Preview/ }).first().click()
    await startImpersonation

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Switch back to admin' })).toBeVisible({
      timeout: 15000,
    })

    await page.goto('/invoices')
    await expect(page.getByText(portalCompanyFixture.invoiceTitle)).toBeVisible()
    await expect(page.getByText(portalCompanyFixture.customerEmail).first()).toBeVisible()

    const reopenToolbar = page
      .locator('div')
      .filter({ hasText: 'Admin preview' })
      .getByRole('button', { name: 'Open' })
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

  test('can review company access on the customer account page while impersonating', async () => {
    await page.goto('/ops')
    await page.locator('div').filter({ hasText: 'Admin preview' }).getByRole('button', { name: 'Open' }).click()
    await page.getByPlaceholder('Search by name, email, or company').fill(portalCompanyFixture.customerEmail)
    const startImpersonation = page.waitForResponse(
      (response) =>
        response.url().includes('/api/internal/impersonation/start') &&
        response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /Preview/ }).first().click()
    await startImpersonation
    await expect(page.getByRole('button', { name: 'Switch back to admin' })).toBeVisible({
      timeout: 15000,
    })

    await page.goto('/account')
    await expect(page.getByRole('heading', { name: 'Billing management' })).toBeVisible()
    await expect(page.getByText('Send invoice terms')).toBeVisible()
    await expect(page.getByText('Monthly consolidated')).toBeVisible()
    await expect(page.getByText('30 days')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Company access' })).toBeVisible()
    await expect(page.getByText('Invite a teammate')).toBeVisible()
    await expect(page.getByText(portalCompanyFixture.customerEmail).first()).toBeVisible()

    const reopenToolbar = page
      .locator('div')
      .filter({ hasText: 'Admin preview' })
      .getByRole('button', { name: 'Open' })
    if (await reopenToolbar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reopenToolbar.click()
    }

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
