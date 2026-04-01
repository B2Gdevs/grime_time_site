import { expect, test, type Page } from '@playwright/test'

import { cleanupCrmWorkspace, seedCrmWorkspace } from '../helpers/seedCrmWorkspace'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

const copilotEnabled = process.env.AI_OPS_ASSISTANT_ENABLED === 'true'

test.describe('Employee copilot beta', () => {
  let page: Page

  test.skip(!copilotEnabled, 'Enable AI_OPS_ASSISTANT_ENABLED=true to run the beta copilot smoke.')

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000)

    await seedTestUser()
    await seedCrmWorkspace()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupCrmWorkspace()
    await cleanupTestUser()
  })

  test('renders the beta copilot, shows ops cards, and launches the CRM workspace tour', async () => {
    await page.route('**/api/internal/ai/copilot', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          insights: {
            followUps: [
              {
                href: '/admin/collections/leads/1',
                id: '1',
                kind: 'lead',
                meta: ['555-0101'],
                stale: true,
                statusLabel: 'Working',
                subtitle: 'Hot follow-up',
                title: 'Acme lead',
              },
            ],
            operator: {
              email: 'dev@payloadcms.com',
              isRealAdmin: true,
              name: 'Dev Admin',
            },
            query: 'What needs attention next?',
            recommendedTours: [
              {
                blurb: 'Queues, search, and field leads',
                id: 'staff-crm-workspace',
                label: 'Ops workspace',
                opsTab: 'crm',
                path: '/ops/workspace',
              },
            ],
            tasks: [
              {
                href: '/admin/collections/crm-tasks/2',
                id: '2',
                kind: 'task',
                meta: ['Due today'],
                priorityLabel: 'High',
                stale: false,
                statusLabel: 'Open',
                subtitle: 'Call after estimate',
                title: 'Quote follow-up',
              },
            ],
          },
          model: 'gpt-4o-mini',
          query: 'What needs attention next?',
          sources: [
            {
              chunkId: 'lead-runbook:follow-up',
              content: 'Send the quote the same day.',
              heading: 'Quote follow-up',
              score: 0.91,
              slug: 'lead-to-customer-runbook',
              sourcePath: 'src/content/docs/lead-to-customer-runbook.md',
              title: 'Lead to customer runbook',
            },
          ],
          text: 'Start with the stale quote follow-up and then work the CRM queue.',
        }),
        status: 200,
      })
    })

    await page.goto('/ops?demo=1')
    await expect(page.getByRole('heading', { name: 'Ops dashboard' })).toBeVisible()

    await page.getByRole('button', { name: 'Copilot' }).click()
    await expect(page.getByRole('heading', { name: 'Grime Time Copilot' })).toBeVisible()

    await page.getByLabel('Ask the employee copilot').fill('What needs attention next?')
    await page.getByRole('button', { name: 'Send message' }).click()

    await expect(page.getByText('Start with the stale quote follow-up and then work the CRM queue.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Assigned tasks' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Quote follow-up/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Follow-up queue' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Acme lead/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Internal doc sources' })).toBeVisible()
    await expect(page.locator('p', { hasText: 'Lead to customer runbook' }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Ops workspace' }).click()

    await expect(page).toHaveURL(/\/ops\/workspace\?tab=crm/)
    await expect(page.locator('h1', { hasText: 'Ops workspace' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Needs attention' })).toBeVisible()
  })
})
