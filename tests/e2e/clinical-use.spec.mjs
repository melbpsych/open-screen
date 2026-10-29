import AxeBuilder from '@axe-core/playwright'
import { test, expect, setupSitting, complete, openReview, downloadJSON, noOverflow } from './helpers.mjs'

test('external totals preserve their source without importing self-harm responses or bypassing safety review', async ({ page }) => {
  await setupSitting(page, { topics: ['anxiety'] })
  await complete(page)
  await openReview(page)
  await page.locator('.review-checks > summary').click()
  await expect(page.locator('[data-card=suicide]')).toContainText('not the form’s official triage result')
  await expect(page.locator('[data-card=suicide]')).toContainText('do not import self-harm responses')
  await page.getByLabel('PHQ-9 total entered from the official form (0–27)', { exact: true }).fill('20')
  await expect(page.locator('#main')).toHaveAttribute('data-screen', 'record')
  await expect(page.locator('#review-checklist')).toContainText('Safety disposition')
  const record = await downloadJSON(page)
  expect(record.clinician.entered.phq9).toBe('20')
  // This flag specifically retains an administered PHQ-9 item 9 response.
  // An external total contains no item-level answer and cannot populate it.
  expect(record.safetyFlag).toBe(false)
  expect(record.symptoms.find(row => row.id === 'anxiety').total).toBeNull()
  expect(record.cards.find(row => row.id === 'suicide').body).toContain('official triage')
  await page.getByRole('button', { name: 'Close exports', exact: true }).click()
  await page.getByLabel('Reviewing clinician', { exact: true }).fill('Synthetic clinician')
  await page.getByLabel('I reviewed the responses, safety findings and follow-up plan.').check()
  await page.getByRole('button', { name: 'Finalise record', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Draft record', exact: true })).toBeVisible()
  await expect(page.locator('.review-signoff .practice-error')).toContainText('direct safety review')
})

test('clinical-use guidance works without JavaScript and separates permission from clinical validity', async ({ page, context }) => {
  const guideContext = await context.browser().newContext({ javaScriptEnabled: false, baseURL: 'http://127.0.0.1:8791' })
  const guide = await guideContext.newPage()
  try {
    await guide.goto('/help.html#clinical-use')
    await expect(guide.getByRole('heading', { name: 'Choosing measures & clinical use', exact: true })).toBeVisible()
    for (const summary of await guide.locator('#clinical-use summary').all()) await summary.click()
    await expect(guide.locator('#clinical-use')).toContainText('not official triage')
    await expect(guide.locator('#clinical-use')).toContainText('not newly administered here')
    await expect(guide.locator('#clinical-use')).toContainText('IPIP response patterns are not performance or symptom validity tests')
    await expect(guide.getByRole('link', { name: 'K6/K10 author terms ↗' })).toHaveAttribute('href', 'https://rckessler.scholars.harvard.edu/k10-and-k6-scales')
    for (const width of [1440, 390, 320]) {
      await guide.setViewportSize({ width, height: 800 })
      await noOverflow(guide)
    }
  } finally { await guideContext.close() }
  await page.goto('/help.html#clinical-use')
  for (const summary of await page.locator('#clinical-use summary').all()) await summary.click()
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([])
})
