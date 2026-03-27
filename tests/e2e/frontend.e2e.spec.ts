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
})
