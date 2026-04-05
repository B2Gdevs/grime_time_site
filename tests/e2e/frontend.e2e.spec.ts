import { expect, test } from '@playwright/test'

test.describe('Frontend marketing pages', () => {
  test('homepage shows media-led service content', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Residential exterior cleaning')).toBeVisible()
    await expect(page.getByText('Grime Time', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What we do' })).toBeVisible()
    await expect(page.getByText('Featured services')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'House washing', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How our pricing works' })).toBeVisible()
    expect(await page.locator('img').count()).toBeGreaterThanOrEqual(3)
  })

  test('about and contact pages use the refreshed marketing copy', async ({ page }) => {
    await page.goto('/about')
    await expect(
      page.getByRole('heading', {
        name: 'Exterior cleaning built by young operators who wanted real reps early.',
      }),
    ).toBeVisible()
    await expect(page.getByText('What customers get')).toBeVisible()

    await page.goto('/contact', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.locator('body')).toContainText(/Contact|support/i, { timeout: 15000 })
  })

  test('mobile marketing layout stays compact and usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto('/')

    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('heading', { name: 'Explore Grime Time' })).toBeVisible()
    await expect(page.getByText('Our services')).toBeVisible()

    const homeOverflow = await page.evaluate(() => {
      const root = document.documentElement
      return root.scrollWidth - root.clientWidth
    })
    expect(homeOverflow).toBeLessThanOrEqual(4)

    await page.goto('/contact', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /Reach the team/i })).toBeVisible()
    await expect(page.getByText('Reply preference')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Policies' })).toBeVisible()

    const contactOverflow = await page.evaluate(() => {
      const root = document.documentElement
      return root.scrollWidth - root.clientWidth
    })
    expect(contactOverflow).toBeLessThanOrEqual(4)
  })

  test('instant quote uses JSON when no images are selected', async ({ page }) => {
    let requestContentType = ''

    await page.route('**/api/lead-forms/instant-quote', async (route) => {
      requestContentType = (await route.request().headerValue('content-type')) || ''
      await route.fulfill({
        body: JSON.stringify({
          crmSyncStatus: null,
          message: 'Estimate request sent. We saved your details and will follow up with a scoped quote.',
          ok: true,
          submissionId: 901,
        }),
        contentType: 'application/json',
        status: 200,
      })
    })

    await page.goto('/')
    await page.locator('#instant-quote').scrollIntoViewIfNeeded()
    await page.getByLabel('Full name').fill('Jamie Customer')
    await page.getByLabel('Email').fill('jamie@example.com')
    await page.getByRole('button', { name: 'Send estimate request' }).click()

    await expect(
      page.getByText('Estimate request sent. We saved your details and will follow up with a scoped quote.'),
    ).toBeVisible()
    expect(requestContentType).toContain('application/json')
  })

  test('instant quote switches to multipart when images are selected', async ({ page }) => {
    let requestContentType = ''

    await page.route('**/api/lead-forms/instant-quote', async (route) => {
      requestContentType = (await route.request().headerValue('content-type')) || ''
      await route.fulfill({
        body: JSON.stringify({
          attachmentCount: 1,
          attachmentSyncStatus: 'saved',
          crmSyncStatus: null,
          message:
            'Estimate request sent. We saved your details and will follow up with a scoped quote. We saved 1 photo for staff review.',
          ok: true,
          submissionId: 902,
        }),
        contentType: 'application/json',
        status: 200,
      })
    })

    await page.goto('/')
    await page.locator('#instant-quote').scrollIntoViewIfNeeded()
    await page.getByLabel('Full name').fill('Jamie Customer')
    await page.getByLabel('Email').fill('jamie@example.com')
    await page
      .locator('#instant-quote input[type="file"][aria-label="Optional job photos"]')
      .setInputFiles({
        buffer: Buffer.from('front-yard'),
        mimeType: 'image/jpeg',
        name: 'front-yard.jpg',
      })

    await expect(page.getByText('front-yard.jpg')).toBeVisible()
    await expect(page.getByText('1 selected')).toBeVisible()

    await page.getByRole('button', { name: 'Send estimate request' }).click()

    await expect(
      page.getByText(
        'Estimate request sent. We saved your details and will follow up with a scoped quote. We saved 1 photo for staff review.',
      ),
    ).toBeVisible()
    expect(requestContentType).toContain('multipart/form-data')
  })
})
