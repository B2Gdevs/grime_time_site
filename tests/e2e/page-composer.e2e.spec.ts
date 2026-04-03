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
  await expect(page.getByRole('heading', { name: 'Visual page composer' })).toBeVisible()
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

function uniquePageDetails(prefix: string) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  return {
    slug: `${prefix}-${suffix}`,
    title: `E2E ${prefix} ${suffix}`,
  }
}

async function createDraftPage(args: {
  page: import('@playwright/test').Page
  slug: string
  title: string
}) {
  await clickComposerTab(args.page, 'Publish')
  await args.page.getByPlaceholder('New page title').fill(args.title)
  await args.page.getByPlaceholder('new-page-slug').fill(args.slug)
  const createButton = args.page.getByRole('button', { name: 'Create draft page' })
  await createButton.scrollIntoViewIfNeeded()
  await createButton.evaluate((button: HTMLButtonElement) => button.click())
  await expect(args.page).toHaveURL(new RegExp(`/${args.slug}$`))
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

  test('can create a draft page, add sections, reorder them, run media actions, and publish', async ({
    page,
  }) => {
    const details = uniquePageDetails('composer-flow')
    createdSlugs.add(details.slug)

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
    await createDraftPage({
      page,
      slug: details.slug,
      title: details.title,
    })

    await clickComposerTab(page, 'Structure')
    await page.getByRole('button', { name: 'What we do' }).click()
    await page.getByRole('button', { name: 'Pricing steps' }).click()

    await dragSectionAbove({
      page,
      sourceLabel: 'How our pricing works',
      targetLabel: 'What we do',
    })

    await persistComposerDraft(page)

    await clickComposerTab(page, 'Media')
    await page.getByRole('button', { name: 'First pricing step' }).click()
    await mediaCard(page, 'Fresh exterior shot').getByRole('button', { name: 'Use this media' }).click()
    await expect(page.getByText(/Swapped First pricing step to media 901\./)).toBeVisible()

    await composerDrawer(page).getByPlaceholder(/Describe the image/).fill('Crisp daytime siding wash before-and-after shot')
    await page.getByRole('button', { name: 'Generate and swap' }).click()
    await expect(page.getByText(/Generated new image for First pricing step\./)).toBeVisible()

    expect(mediaRequests.some((payload) => payload.includes('swap-existing-reference'))).toBe(true)
    expect(mediaRequests.some((payload) => payload.includes('generate-and-swap'))).toBe(true)

    await clickComposerButton(page, 'Publish')
    await expect(composerDrawer(page).getByText('Page published.')).toBeVisible({ timeout: 15000 })

    await composerDrawer(page).getByRole('button', { name: 'Dismiss page composer' }).click()
    await expect(page.getByRole('heading', { name: 'Visual page composer' })).not.toBeVisible()

    const headings = await sectionHeadingOrder(page)
    expect(headings.indexOf('How our pricing works')).toBeGreaterThanOrEqual(0)
    expect(headings.indexOf('What we do')).toBeGreaterThanOrEqual(0)
    expect(headings.indexOf('How our pricing works')).toBeLessThan(headings.indexOf('What we do'))
  })

  test('focused copilot sends selected page, section, and media-slot context', async ({ page }) => {
    test.skip(!copilotEnabled, 'Enable AI_OPS_ASSISTANT_ENABLED=true to run the shared copilot authoring flow.')

    const details = uniquePageDetails('composer-copilot')
    createdSlugs.add(details.slug)

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
    await createDraftPage({
      page,
      slug: details.slug,
      title: details.title,
    })

    await clickComposerTab(page, 'Structure')
    await page.getByRole('button', { name: 'Pricing steps' }).click()
    await persistComposerDraft(page)

    await clickComposerTab(page, 'Media')
    await page.getByRole('button', { name: 'First pricing step' }).click()
    await composerDrawer(page).getByPlaceholder(/Describe the image/).fill('Driveway cleaning hero image')
    await page.getByRole('button', { name: 'Focused copilot' }).click()

    await expect(page.getByRole('heading', { name: 'Grime Time Copilot' })).toBeVisible()
    await expect(page.getByText('Authoring context', { exact: true })).toBeVisible()
    await expect(page.getByText(details.title, { exact: true })).toBeVisible()
    await expect(page.getByText('Section 1: How our pricing works')).toBeVisible()
    await expect(page.getByText('Focused media session', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'gallery' }).click()
    await page.getByLabel('Ask the employee copilot').fill('Give me an image direction')
    await clickElement(page.getByRole('button', { name: 'Send message' }))

    await expect(page.getByText('Use a wide residential exterior frame with strong daylight contrast.')).toBeVisible()
    expect(capturedCopilotBody).not.toBeNull()
    const body = capturedCopilotBody as unknown as Record<string, unknown>

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

    expect(authoringContext?.page?.slug).toBe(details.slug)
    expect(authoringContext?.page?.pagePath).toBe(`/${details.slug}`)
    expect(authoringContext?.page?.title).toBe(details.title)
    expect(authoringContext?.section?.label).toBe('How our pricing works')
    expect(authoringContext?.section?.variant).toBe('pricingSteps')
    expect(authoringContext?.mediaSlot?.label).toBe('First pricing step')
    expect(focusedSession).toMatchObject({
      mode: 'gallery',
      promptHint: 'Driveway cleaning hero image',
      type: 'media-generation',
    })
  })
})
