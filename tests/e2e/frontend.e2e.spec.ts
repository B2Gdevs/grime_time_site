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
    expect(await page.locator('img').count()).toBeGreaterThan(3)
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
})
