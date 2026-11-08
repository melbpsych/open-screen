import { test, expect } from '@playwright/test'

test('public artifact excludes DASS and completes a synthetic sitting', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`)
  })
  page.on('request', request => {
    expect(new URL(request.url()).origin).toBe('http://127.0.0.1:8792')
  })
  await page.goto('/')
  await expect(page.getByRole('complementary', { name: 'Public evaluation demo' })).toContainText('synthetic data only')
  await page.getByRole('link', { name: 'New assessment', exact: true }).click()
  await page.getByRole('radio', { name: 'Clinical', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: /Tension|DASS/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Continue to Ready' }).click()
  await page.getByRole('button', { name: 'Start assessment', exact: true }).click()
  for (let i = 0; i < 4; i++) {
    await page.getByRole('radio', { name: 'Not at all', exact: true }).click()
    await expect(page.locator('.question-topline')).toContainText(`Question ${i + 2}`)
  }
  await page.getByRole('radio', { name: 'No', exact: true }).click()
  await page.getByRole('button', { name: 'Review clinician record', exact: true }).click()
  await expect(page.locator('#main')).toContainText('Below threshold')
  await expect(page.locator('#main')).not.toContainText('Below gate')
  await page.locator('#summary-preview-title').click()
  await expect(page.locator('#main')).toContainText('PHQ-2: 0/6')
  await expect(page.locator('#main')).toContainText('full form not administered')
  await expect(page.getByRole('complementary', { name: 'Public evaluation demo' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})
