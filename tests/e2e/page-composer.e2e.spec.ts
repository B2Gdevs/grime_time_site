import { expect, test, type Locator } from '@playwright/test'

import { cleanupPageBySlug } from '../helpers/pageComposer'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

function trackPageErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []

  page.on('pageerror', (error) => {
    errors.push(error?.stack || error?.message || String(error))
  })

  return errors
}

async function openPageComposerAtPath(page: import('@playwright/test').Page, pathname: string) {
  await page.goto(pathname)
  await page.getByRole('button', { name: 'Page composer' }).click()
  await expect(page.getByRole('button', { name: 'Dismiss page composer' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Page title' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'page-slug' })).toBeVisible()
  await expect(composerDrawer(page).getByRole('button', { name: 'Save draft' })).toBeEnabled()
}

function composerDrawer(page: import('@playwright/test').Page): Locator {
  return page.getByRole('complementary')
}

function composerStatus(page: import('@playwright/test').Page): Locator {
  return composerDrawer(page).locator('[role="status"][aria-live="polite"]').last()
}

async function waitForComposerMutation(
  page: import('@playwright/test').Page,
  action: 'publish-page' | 'save-draft',
) {
  const response = await page.waitForResponse((candidate) => {
    if (!candidate.url().includes('/api/internal/page-composer') || candidate.request().method() !== 'POST') {
      return false
    }

    try {
      const payload = candidate.request().postDataJSON() as { action?: string }
      return payload.action === action
    } catch {
      return false
    }
  })

  expect(response.ok()).toBe(true)
  return (await response.json()) as {
    ok?: boolean
    page?: {
      id?: number | null
      pagePath?: string
      slug?: string
    }
  }
}

function activeComposerPanel(page: import('@playwright/test').Page): Locator {
  return composerDrawer(page).locator('[role="tabpanel"][data-state="active"]')
}

async function clickComposerButton(page: import('@playwright/test').Page, name: 'Publish' | 'Save draft') {
  const button = composerDrawer(page).getByRole('button', { name })
  await button.scrollIntoViewIfNeeded()
  await button.click({ force: true })
}

async function clickComposerTab(page: import('@playwright/test').Page, name: 'Block data' | 'Layout' | 'Media' | 'Pages') {
  const tab = composerDrawer(page).getByRole('tab', { name })
  await tab.click()
}

async function clickElement(locator: Locator) {
  await expect(locator).toBeVisible()
  await locator.click({ force: true })
}

async function createComposerDraft(page: import('@playwright/test').Page) {
  const responsePromise = waitForComposerMutation(page, 'save-draft')
  await clickComposerButton(page, 'Save draft')
  const payload = await responsePromise

  expect(typeof payload.page?.id).toBe('number')
  await expect(composerStatus(page)).toContainText('Draft created.')
  await expect(page.getByRole('button', { name: 'Delete draft page and return home' })).toBeEnabled({
    timeout: 60000,
  })
  return payload
}

async function persistComposerDraft(page: import('@playwright/test').Page) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const responsePromise = waitForComposerMutation(page, 'save-draft')
    await clickComposerButton(page, 'Save draft')

    try {
      const payload = await responsePromise
      expect(payload.ok).toBe(true)
      await expect(composerStatus(page)).toContainText('Draft saved.')
      await expect(page.getByText('Unsaved')).not.toBeVisible({ timeout: 10000 })
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unable to persist the page draft.')
    }
  }

  throw lastError || new Error('Unable to persist the page draft.')
}

async function insertServiceGrid(page: import('@playwright/test').Page, pageErrors?: string[]) {
  await clickComposerTab(page, 'Layout')
  await page.waitForTimeout(1000)
  if (pageErrors) {
    expect(pageErrors).toEqual([])
  }
  await clickElement(activeComposerPanel(page).getByRole('button', { name: 'Add to bottom' }))
  await clickElement(composerDrawer(page).getByRole('button', { name: /Service grid/i }))
}

async function renameSelectedServiceGrid(page: import('@playwright/test').Page, from: string, to: string) {
  await clickComposerTab(page, 'Block data')
  const input = activeComposerPanel(page).locator(`input[value="${from}"]`).first()
  await input.fill(to)
}

async function sectionHeadingOrder(page: import('@playwright/test').Page): Promise<string[]> {
  return page
    .locator('main h2')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() || '').filter(Boolean))
}

async function structureSectionOrder(page: import('@playwright/test').Page): Promise<string[]> {
  return activeComposerPanel(page)
    .locator('button[aria-label^="Drag "]')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => node.getAttribute('aria-label')?.replace(/^Drag /, '').trim() || '')
        .filter(Boolean),
    )
}

test.describe('Staff page composer', () => {
  const createdSlugs = new Set<string>()
  const copilotEnabled = process.env.AI_OPS_ASSISTANT_ENABLED === 'true'
  const focusedMediaCopilotEnabled = process.env.NEXT_PUBLIC_COPILOT_MEDIA_GENERATION_ENABLED === 'true'

  test.beforeAll(async () => {
    test.setTimeout(120000)
    await seedTestUser()
  })

  test.afterAll(async () => {
    for (const slug of createdSlugs) {
      await cleanupPageBySlug(slug)
    }

    await cleanupTestUser()
  })

  test.beforeEach(async ({ page }) => {
    await login({ page, user: testUser })
  })

  test('can start composing and create a draft directly from a missing route', async ({ page }) => {
    test.setTimeout(90000)
    const pageErrors = trackPageErrors(page)
    const slug = `playwright-missing-route-${Date.now()}`
    const pathname = `/${slug}`

    await openPageComposerAtPath(page, pathname)

    await expect(page.getByRole('textbox', { name: 'Page title' })).toHaveValue(/^Playwright Missing Route/)
    await expect(page.getByRole('textbox', { name: 'page-slug' })).toHaveValue(slug)
    await expect(page.getByRole('heading', { name: 'Start composing this page in place.' })).toBeVisible()
    expect(pageErrors).toEqual([])

    const payload = await createComposerDraft(page)
    await page.waitForTimeout(1500)

    createdSlugs.add(slug)
    await expect(page).toHaveURL(new RegExp(`${pathname}$`))
    expect(payload.page?.pagePath).toBe(pathname)
    expect(pageErrors).toEqual([])
  })

  test('can create a route draft, insert blocks through the library, reorder them, run media actions, and publish', async ({
    page,
  }) => {
    test.setTimeout(90000)
    const pageErrors = trackPageErrors(page)
    const mediaRequests: string[] = []
    const slug = `playwright-composer-${Date.now()}`
    const pathname = `/${slug}`

    await page.route('**/api/internal/page-composer/media', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                alt: 'Fresh exterior shot',
                filename: 'fresh-exterior.jpg',
                id: 901,
                mimeType: 'image/jpeg',
                previewUrl: 'https://example.com/fresh-exterior.jpg',
                updatedAt: '2026-04-02T17:00:00.000Z',
              },
            ],
          }),
          status: 200,
        })
        return
      }

      mediaRequests.push(route.request().postData() || '')
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
        status: 200,
      })
    })

    await openPageComposerAtPath(page, pathname)
    await createComposerDraft(page)
    await page.waitForTimeout(1500)
    createdSlugs.add(slug)
    expect(pageErrors).toEqual([])

    await insertServiceGrid(page, pageErrors)
    expect(pageErrors).toEqual([])
    await renameSelectedServiceGrid(page, 'Interactive service section', 'Composer Alpha')

    await insertServiceGrid(page, pageErrors)
    expect(pageErrors).toEqual([])
    await renameSelectedServiceGrid(page, 'Interactive service section', 'Composer Beta')

    await clickComposerTab(page, 'Layout')
    await clickElement(activeComposerPanel(page).getByRole('button', { name: 'Move block Composer Beta up' }))
    await expect.poll(() => structureSectionOrder(page)).toContainEqual('Composer Beta')
    await expect
      .poll(async () => {
        const order = await structureSectionOrder(page)
        const alpha = order.indexOf('Composer Alpha')
        const beta = order.indexOf('Composer Beta')

        return alpha >= 0 && beta >= 0 && beta < alpha
      })
      .toBe(true)

    await persistComposerDraft(page)

    await clickComposerTab(page, 'Media')
    await clickElement(activeComposerPanel(page).getByRole('button', { name: 'Composer Beta: Section item one' }))
    await clickElement(
      activeComposerPanel(page).getByRole('button', { name: 'Use media 901 for Composer Beta: Section item one' }),
    )
    await expect
      .poll(() => mediaRequests.some((payload) => payload.includes('swap-existing-reference')))
      .toBe(true)

    await activeComposerPanel(page)
      .getByLabel('Prompt')
      .fill('Crisp daytime siding wash before-and-after shot')
    await clickElement(activeComposerPanel(page).getByRole('button', { name: 'Generate and swap' }))
    await expect
      .poll(() => mediaRequests.some((payload) => payload.includes('generate-and-swap')))
      .toBe(true)
    await expect(activeComposerPanel(page).getByLabel('Prompt')).toHaveValue('')

    const publishResponse = waitForComposerMutation(page, 'publish-page')
    await clickComposerButton(page, 'Publish')
    expect((await publishResponse).ok).toBe(true)

    await clickElement(composerDrawer(page).getByRole('button', { name: 'Dismiss page composer' }))
    await expect(composerDrawer(page)).not.toBeVisible()

    const headings = await sectionHeadingOrder(page)
    expect(headings.indexOf('Composer Beta')).toBeGreaterThanOrEqual(0)
    expect(headings.indexOf('Composer Alpha')).toBeGreaterThanOrEqual(0)
    expect(headings.indexOf('Composer Beta')).toBeLessThan(headings.indexOf('Composer Alpha'))
  })

  test('focused copilot sends selected page, section, and media-slot context', async ({ page }) => {
    test.skip(
      !copilotEnabled || !focusedMediaCopilotEnabled,
      'Enable AI_OPS_ASSISTANT_ENABLED=true and NEXT_PUBLIC_COPILOT_MEDIA_GENERATION_ENABLED=true to run the focused media copilot flow.',
    )

    let capturedCopilotBody: Record<string, unknown> | null = null
    const slug = `playwright-copilot-${Date.now()}`
    const pathname = `/${slug}`
    const draftTitle = slug
      .split('-')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')

    await page.route('**/api/internal/page-composer/media', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                alt: 'Wide driveway pass',
                filename: 'driveway-pass.jpg',
                id: 777,
                mimeType: 'image/jpeg',
                previewUrl: 'https://example.com/driveway-pass.jpg',
                updatedAt: '2026-04-02T17:15:00.000Z',
              },
            ],
          }),
          status: 200,
        })
        return
      }

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
        status: 200,
      })
    })

    await page.route('**/api/internal/ai/copilot', async (route) => {
      capturedCopilotBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          insights: {
            followUps: [],
            operator: {
              email: testUser.email,
              isRealAdmin: true,
              name: 'Dev Admin',
            },
            query: 'Give me an image direction',
            recommendedTours: [],
            tasks: [],
          },
          model: 'gpt-4o-mini',
          query: 'Give me an image direction',
          sources: [],
          text: 'Use a wide residential exterior frame with strong daylight contrast.',
        }),
        status: 200,
      })
    })

    await openPageComposerAtPath(page, pathname)
    await createComposerDraft(page)
    createdSlugs.add(slug)

    await insertServiceGrid(page)
    await renameSelectedServiceGrid(page, 'Interactive service section', 'Copilot Service Grid')
    await persistComposerDraft(page)

    await clickComposerTab(page, 'Media')
    await clickElement(activeComposerPanel(page).getByRole('button', { name: 'Copilot Service Grid: Section item one' }))
    await activeComposerPanel(page).getByLabel('Prompt').fill('Driveway cleaning hero image')
    await clickElement(activeComposerPanel(page).getByRole('button', { name: 'Focused copilot' }))

    await expect(page.getByRole('heading', { name: 'Grime Time Copilot' })).toBeVisible()
    await expect(page.getByText('Authoring context', { exact: true })).toBeVisible()
    await expect(page.getByText(draftTitle, { exact: true })).toBeVisible()
    await expect(page.getByText(/Section \d+: Copilot Service Grid/)).toBeVisible()
    await expect(page.getByText('Focused media session', { exact: true })).toBeVisible()

    await clickElement(page.getByRole('button', { name: 'gallery' }))
    await page.getByLabel('Ask the employee copilot').fill('Give me an image direction')
    await clickElement(page.getByRole('button', { name: 'Send message' }))

    await expect(page.getByText('Use a wide residential exterior frame with strong daylight contrast.')).toBeVisible()
    expect(capturedCopilotBody).not.toBeNull()
    if (!capturedCopilotBody) {
      throw new Error('Expected the copilot request body to be captured.')
    }
    const body: Record<string, unknown> = capturedCopilotBody

    const authoringContext = body.authoringContext as
      | {
          mediaSlot?: { label?: string } | null
          page?: { pagePath?: string; slug?: string; title?: string } | null
          section?: { label?: string; variant?: string } | null
        }
      | undefined
    const focusedSession = body.focusedSession as
      | { mode?: string; promptHint?: string; type?: string }
      | undefined

    expect(authoringContext?.page?.slug).toBe(slug)
    expect(authoringContext?.page?.pagePath).toBe(`/${slug}`)
    expect(authoringContext?.page?.title).toBe(draftTitle)
    expect(authoringContext?.section?.label).toBe('Copilot Service Grid')
    expect(authoringContext?.section?.variant).toBe('interactive')
    expect(authoringContext?.mediaSlot?.label).toBe('Copilot Service Grid: Section item one')
    expect(focusedSession).toMatchObject({
      mode: 'gallery',
      promptHint: 'Driveway cleaning hero image',
      type: 'media-generation',
    })
  })
})
