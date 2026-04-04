import { expect, test, type Locator } from '@playwright/test'

import { cleanupPageBySlug } from '../helpers/pageComposer'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

async function dragSectionAbove(args: {
  page: import('@playwright/test').Page
  sourceLabel: string
  targetLabel: string
}) {
  const sourceRow = args.page.locator('div.rounded-2xl.border.p-3').filter({
    has: args.page.getByText(args.sourceLabel, { exact: true }),
  }).last()
  const targetRow = args.page.locator('div.rounded-2xl.border.p-3').filter({
    has: args.page.getByText(args.targetLabel, { exact: true }),
  }).last()

  const sourceHandle = sourceRow.locator('button').first()
  const sourceBox = await sourceHandle.boundingBox()
  const targetBox = await targetRow.boundingBox()

  if (!sourceBox || !targetBox) {
    throw new Error('Unable to resolve section drag coordinates.')
  }

  await args.page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await args.page.mouse.down()
  await args.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 16, { steps: 16 })
  await args.page.mouse.up()
}

async function openPageComposer(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Page composer' }).click()
  await expect(page.getByRole('button', { name: 'Dismiss page composer' })).toBeVisible()
}

function composerDrawer(page: import('@playwright/test').Page): Locator {
  return page.getByRole('complementary')
}

async function clickComposerButton(page: import('@playwright/test').Page, name: 'Publish' | 'Save draft') {
  const button = composerDrawer(page).getByRole('button', { name })
  await button.scrollIntoViewIfNeeded()
  await button.evaluate((element: HTMLButtonElement) => element.click())
}

async function clickComposerTab(page: import('@playwright/test').Page, name: 'Content' | 'Media' | 'Publish' | 'Structure') {
  const tab = composerDrawer(page).getByRole('tab', { name })
  await tab.click()
}

async function clickElement(locator: Locator) {
  await locator.scrollIntoViewIfNeeded()
  await locator.evaluate((element: HTMLElement) => element.click())
}

async function persistComposerDraft(page: import('@playwright/test').Page) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await clickComposerButton(page, 'Save draft')

    try {
      await expect(composerDrawer(page).getByText('Unsaved')).not.toBeVisible({ timeout: 10000 })
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unable to persist the page draft.')
    }
  }

  throw lastError || new Error('Unable to persist the page draft.')
}

async function createDraftPage(args: {
  page: import('@playwright/test').Page
}) {
  const previousPath = new URL(args.page.url()).pathname
  await composerDrawer(args.page).getByRole('button', { name: 'Create draft' }).click()
  await args.page.waitForURL((url) => url.pathname !== previousPath)

  const currentUrl = new URL(args.page.url())
  const slug = currentUrl.pathname.replace(/^\//, '')
  const title = await composerDrawer(args.page).locator('input').first().inputValue()

  return { slug, title }
}

async function insertServiceGrid(page: import('@playwright/test').Page) {
  await clickComposerTab(page, 'Structure')
  await composerDrawer(page).getByRole('button', { name: 'Add block' }).first().click()
  await composerDrawer(page).getByRole('button', { name: /Service grid/i }).click()
}

async function renameSelectedServiceGrid(page: import('@playwright/test').Page, from: string, to: string) {
  await clickComposerTab(page, 'Content')
  const input = page.getByDisplayValue(from)
  await input.fill(to)
}

async function sectionHeadingOrder(page: import('@playwright/test').Page): Promise<string[]> {
  return page
    .locator('main h2')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() || '').filter(Boolean))
}

function mediaCard(page: import('@playwright/test').Page, title: string): Locator {
  return page.locator('div.rounded-2xl.border.border-border\\/70.bg-background.p-3').filter({
    has: page.getByText(title, { exact: true }),
  })
}

test.describe('Staff page composer', () => {
  const createdSlugs = new Set<string>()
  const copilotEnabled = process.env.AI_OPS_ASSISTANT_ENABLED === 'true'

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

  test('can clone a draft page, insert blocks through the library, reorder them, run media actions, and publish', async ({
    page,
  }) => {
    const mediaRequests: string[] = []

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

    await openPageComposer(page)
    const created = await createDraftPage({ page })
    createdSlugs.add(created.slug)

    await insertServiceGrid(page)
    await renameSelectedServiceGrid(page, 'Interactive service section', 'Composer Alpha')

    await insertServiceGrid(page)
    await renameSelectedServiceGrid(page, 'Interactive service section', 'Composer Beta')

    await clickComposerTab(page, 'Structure')
    await dragSectionAbove({
      page,
      sourceLabel: 'Composer Beta',
      targetLabel: 'Composer Alpha',
    })

    await persistComposerDraft(page)

    await clickComposerTab(page, 'Media')
    await page.getByRole('button', { name: 'Section item one' }).click()
    await mediaCard(page, 'Fresh exterior shot').getByRole('button', { name: 'Use this media' }).click()
    await expect(page.getByText(/Swapped Section item one to media 901\./)).toBeVisible()

    await composerDrawer(page).getByPlaceholder(/Describe the image/).fill('Crisp daytime siding wash before-and-after shot')
    await page.getByRole('button', { name: 'Generate and swap' }).click()
    await expect(page.getByText(/Generated new image for Section item one\./)).toBeVisible()

    expect(mediaRequests.some((payload) => payload.includes('swap-existing-reference'))).toBe(true)
    expect(mediaRequests.some((payload) => payload.includes('generate-and-swap'))).toBe(true)

    await clickComposerButton(page, 'Publish')
    await expect(composerDrawer(page).getByText('Page published.')).toBeVisible({ timeout: 15000 })

    await composerDrawer(page).getByRole('button', { name: 'Dismiss page composer' }).click()
    await expect(composerDrawer(page)).not.toBeVisible()

    const headings = await sectionHeadingOrder(page)
    expect(headings.indexOf('Composer Beta')).toBeGreaterThanOrEqual(0)
    expect(headings.indexOf('Composer Alpha')).toBeGreaterThanOrEqual(0)
    expect(headings.indexOf('Composer Beta')).toBeLessThan(headings.indexOf('Composer Alpha'))
  })

  test('focused copilot sends selected page, section, and media-slot context', async ({ page }) => {
    test.skip(!copilotEnabled, 'Enable AI_OPS_ASSISTANT_ENABLED=true to run the shared copilot authoring flow.')

    let capturedCopilotBody: Record<string, unknown> | null = null

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

    await openPageComposer(page)
    const created = await createDraftPage({ page })
    createdSlugs.add(created.slug)

    await insertServiceGrid(page)
    await renameSelectedServiceGrid(page, 'Interactive service section', 'Copilot Service Grid')
    await persistComposerDraft(page)

    await clickComposerTab(page, 'Media')
    await page.getByRole('button', { name: 'Section item one' }).click()
    await composerDrawer(page).getByPlaceholder(/Describe the image/).fill('Driveway cleaning hero image')
    await page.getByRole('button', { name: 'Focused copilot' }).click()

    await expect(page.getByRole('heading', { name: 'Grime Time Copilot' })).toBeVisible()
    await expect(page.getByText('Authoring context', { exact: true })).toBeVisible()
    await expect(page.getByText(created.title, { exact: true })).toBeVisible()
    await expect(page.getByText('Section 1: Copilot Service Grid')).toBeVisible()
    await expect(page.getByText('Focused media session', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'gallery' }).click()
    await page.getByLabel('Ask the employee copilot').fill('Give me an image direction')
    await clickElement(page.getByRole('button', { name: 'Send message' }))

    await expect(page.getByText('Use a wide residential exterior frame with strong daylight contrast.')).toBeVisible()
    expect(capturedCopilotBody).not.toBeNull()
    const body = capturedCopilotBody as Record<string, unknown>

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

    expect(authoringContext?.page?.slug).toBe(created.slug)
    expect(authoringContext?.page?.pagePath).toBe(`/${created.slug}`)
    expect(authoringContext?.page?.title).toBe(created.title)
    expect(authoringContext?.section?.label).toBe('Copilot Service Grid')
    expect(authoringContext?.section?.variant).toBe('interactive')
    expect(authoringContext?.mediaSlot?.label).toBe('Section item one')
    expect(focusedSession).toMatchObject({
      mode: 'gallery',
      promptHint: 'Driveway cleaning hero image',
      type: 'media-generation',
    })
  })
})
