import { readFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import {
  test,
  expect,
  setupSitting,
  answer,
  complete,
  openReview,
  downloadJSON,
  more,
  noOverflow
} from './helpers.mjs'
const pass = 'Synthetic browser testing passphrase'
async function saveEncrypted(page, button = 'Save encrypted sitting') {
  await page.getByRole('button', { name: button, exact: true }).click()
  await page
    .getByLabel('Passphrase (12+ characters)', { exact: true })
    .fill(pass)
  await page.getByLabel('Confirm passphrase', { exact: true }).fill(pass)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Encrypt & download' }).click()
  const d = await pending
  expect(d.suggestedFilename()).toBe('open-screen-sitting.openscreen')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  return { path: await d.path(), raw: await readFile(await d.path(), 'utf8') }
}
async function unlock(page, path, mode = 'Resume sitting') {
  await page.getByRole('button', { name: mode, exact: true }).click()
  await page
    .getByLabel('Encrypted sitting file', { exact: true })
    .setInputFiles(path)
  await page
    .getByLabel('Passphrase (12+ characters)', { exact: true })
    .fill(pass)
  await page.getByRole('button', { name: 'Unlock file' }).click()
  await expect(page.locator('#resume-reference')).toBeVisible()
}
async function finalise(page, name = 'Synthetic clinician') {
  await page.getByLabel('Reviewing clinician', { exact: true }).fill(name)
  await page
    .getByLabel('I reviewed the responses, safety findings and follow-up plan.')
    .check()
  await page
    .getByRole('button', { name: 'Finalise record', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Final record', exact: true })
  ).toBeVisible()
}
test('encrypted recovery requires correct password/reference and restores exact question/settings without browser persistence', async ({
  page,
  context
}) => {
  await setupSitting(page, {
    topics: ['depression'],
    reference: 'SYNTHETIC-RECOVERY'
  })
  await answer(page, 2)
  const step = await page.locator('#main').getAttribute('data-step'),
    saved = await saveEncrypted(page, 'Save progress')
  expect(saved.raw).not.toContain('SYNTHETIC-RECOVERY')
  expect(saved.raw).not.toContain('phq-1')
  expect(
    await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage)
    }))
  ).toEqual({ local: [], session: [] })
  const tab = await context.newPage()
  await tab.goto('/interview.html')
  await tab.getByRole('button', { name: 'Resume sitting', exact: true }).click()
  await tab
    .getByLabel('Encrypted sitting file', { exact: true })
    .setInputFiles(saved.path)
  await tab
    .getByLabel('Passphrase (12+ characters)', { exact: true })
    .fill('Incorrect passphrase')
  await tab.getByRole('button', { name: 'Unlock file' }).click()
  await expect(tab.getByRole('alert')).toContainText('Unable to unlock')
  await tab
    .getByLabel('Passphrase (12+ characters)', { exact: true })
    .fill(pass)
  await tab.getByRole('button', { name: 'Unlock file' }).click()
  await tab.locator('#resume-reference').fill('WRONG')
  await tab.getByRole('button', { name: 'Confirm & resume' }).click()
  await expect(tab.getByRole('alert')).toContainText('does not match')
  await tab.locator('#resume-reference').fill('SYNTHETIC-RECOVERY')
  await tab.getByRole('button', { name: 'Confirm & resume' }).click()
  await expect(tab.locator('#main')).toHaveAttribute('data-step', step)
  await complete(tab)
  await openReview(tab)
  const r = await downloadJSON(tab, { responses: true })
  expect(r.responses['phq-1']).toBe(2)
  expect(r.assessment.review.status).toBe('draft')
})
test('finalisation appears in every output, edits invalidate it, history compares matching final records', async ({
  page,
  context
}) => {
  await setupSitting(page, {
    topics: ['depression'],
    reference: 'SYNTHETIC-HISTORY'
  })
  await complete(page)
  await openReview(page)
  await page
    .getByLabel('Formulation & follow-up')
    .fill('Synthetic review and follow-up plan.')
  await finalise(page)
  let r = await downloadJSON(page)
  expect(r.assessment.review.by).toBe('Synthetic clinician')
  await more(page)
  const first = await saveEncrypted(page)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save report', exact: true }).click()
  expect(await readFile(await (await pending).path(), 'utf8')).toContain(
    'Final · attested by Synthetic clinician'
  )
  await page
    .getByLabel('Formulation & follow-up')
    .fill('Edited plan after finalisation.')
  await expect(
    page.getByRole('heading', { name: 'Draft record', exact: true })
  ).toBeVisible()
  r = await downloadJSON(page)
  expect(r.assessment.review.status).toBe('draft')
  const tab = await context.newPage()
  await setupSitting(tab, {
    topics: ['depression'],
    reference: 'SYNTHETIC-HISTORY'
  })
  await complete(tab)
  await openReview(tab)
  await finalise(tab, 'Second clinician')
  await tab.locator('.assessment-history > summary').click()
  await unlock(tab, first.path, 'Add from encrypted file')
  await tab.locator('#resume-reference').fill('SYNTHETIC-HISTORY')
  await tab
    .getByRole('button', { name: 'Add final assessments', exact: true })
    .click()
  await expect(
    tab.locator('.assessment-history .history-series h3')
  ).toHaveText('PHQ-2')
  await expect(
    tab.locator('.assessment-history .history-series tbody tr')
  ).toHaveCount(2)
  await expect(tab.locator('.assessment-history')).toContainText(
    'not evidence of reliable'
  )
  await noOverflow(tab)
})
test('templates exclude permissions/patient details; measure search and overlap warnings are accessible', async ({
  page
}) => {
  await page.goto('/interview.html')
  await page.getByRole('radio', { name: 'Forensic', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Reference (optional)' })
    .fill('SYNTHETIC-PRIVATE')
  await page.locator('[data-section=templates] > summary').click()
  await page
    .getByLabel('New template name', { exact: true })
    .fill('Synthetic intake')
  await page.getByRole('button', { name: 'Save selection as template' }).click()
  const raw = await page.evaluate(() =>
    localStorage.getItem('open-screen.templates.v1')
  )
  expect(raw).not.toContain('SYNTHETIC-PRIVATE')
  expect(raw).not.toContain('confirmations')
  await page.getByLabel('Saved template', { exact: true }).selectOption('0')
  await page
    .getByRole('button', { name: 'Apply template', exact: true })
    .click()
  await expect(
    page.getByRole('radio', { name: 'Forensic', exact: true })
  ).toHaveAttribute('aria-checked', 'true')
  await page
    .getByRole('searchbox', { name: 'Find a measure' })
    .fill('Mini-IPIP')
  await expect(page.locator('[data-focus-key=mini-ipip]')).toBeVisible()
  await expect(page.locator('[data-focus-key=depression]')).toBeHidden()
  await page.locator('[data-focus-key=mini-ipip]').click()
  await page
    .getByRole('searchbox', { name: 'Find a measure' })
    .fill('personality')
  await page.locator('[data-focus-key=personality]').click()
  await expect(
    page.getByText(/Overlapping personality measures selected/)
  ).toBeVisible()
  await page.getByRole('searchbox', { name: 'Find a measure' }).fill('')
  await page.setViewportSize({ width: 320, height: 900 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await noOverflow(page)
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(scan.violations.map((v) => v.id)).toEqual([])
})
test('recovery dialog supports Escape/focus return and enlarged text', async ({
  page
}) => {
  await page.goto('/interview.html')
  await page
    .getByRole('button', { name: 'Resume sitting', exact: true })
    .click()
  await page.setViewportSize({ width: 320, height: 600 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await noOverflow(page)
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(scan.violations.map((v) => v.id)).toEqual([])
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Resume sitting', exact: true })
  ).toBeFocused()
})

test('safety pause survives encrypted recovery and finalisation requires direct review', async ({
  page,
  context
}) => {
  await setupSitting(page, {
    topics: ['depression'],
    reference: 'SYNTHETIC-SAFETY'
  })
  await complete(page, (id) => (id === 'phq-1' ? 2 : id === 'phq-9' ? 1 : 0))
  const saved = await saveEncrypted(page, 'Save progress')
  const tab = await context.newPage()
  await tab.goto('/interview.html')
  await unlock(tab, saved.path)
  await tab.locator('#resume-reference').fill('SYNTHETIC-SAFETY')
  await tab.locator('#resume-reference').press('Enter')
  await expect(tab.locator('#main')).toHaveAttribute('data-screen', 'safety')
  await tab
    .getByRole('button', {
      name: 'Clinician: reviewed; continue under supervision'
    })
    .click()
  await complete(tab)
  await openReview(tab)
  await tab
    .getByLabel('Reviewing clinician', { exact: true })
    .fill('Synthetic clinician')
  await tab
    .getByLabel('I reviewed the responses, safety findings and follow-up plan.')
    .check()
  await tab
    .getByRole('button', { name: 'Finalise record', exact: true })
    .click()
  await expect(tab.locator('.review-signoff [role=alert]')).toContainText(
    'direct safety review'
  )
  await tab
    .getByRole('radio', { name: 'Follow-up required', exact: true })
    .click()
  await finalise(tab)
  const r = await downloadJSON(tab)
  expect(r.safetyFlag).toBe(true)
  expect(r.clinician.safetyReview).toBe('Follow-up required')
})

test('cancelling encryption produces no later download', async ({ page }) => {
  await page.goto('/interview.html')
  await page
    .getByRole('button', { name: 'Save encrypted sitting', exact: true })
    .click()
  await page
    .getByLabel('Passphrase (12+ characters)', { exact: true })
    .fill(pass)
  await page.getByLabel('Confirm passphrase', { exact: true }).fill(pass)
  const downloads = []
  page.on('download', (d) => downloads.push(d))
  // Trigger and cancel in the same browser task, before the asynchronous crypto resolves.
  await page.evaluate(() => {
    const form = document.querySelector('dialog form')
    form.requestSubmit()
    document.querySelector('dialog').close()
  })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  // A second successful encryption is a completion barrier for the earlier one.
  await saveEncrypted(page)
  expect(downloads).toHaveLength(1)
})

test('a clinician can review an interrupted sitting without turning missing answers into scores',async({page})=>{
 await setupSitting(page,{topics:['depression'],reference:'SYNTHETIC-PARTIAL'});await answer(page,0)
 await page.getByText('Clinician options',{exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Review partial sitting',exact:true}).click()
 await expect(page.locator('.review-priorities')).toContainText('Incomplete: PHQ-2')
 await page.getByLabel('Reviewing clinician',{exact:true}).fill('Synthetic clinician');await page.getByLabel('I reviewed the responses, safety findings and follow-up plan.').check();await page.getByRole('button',{name:'Finalise record',exact:true}).click()
 await expect(page.locator('.review-signoff [role=alert]')).toContainText('Complete the selected questions')
 const r=await downloadJSON(page);expect(r.symptoms[0].total).toBeNull();expect(r.symptoms[0].gateScore).toBeNull();expect(r.assessment.review.status).toBe('draft')
 await page.locator('.export-menu > summary').click();await page.getByRole('button',{name:'Continue unanswered questions',exact:true}).click();await expect(page.locator('#main')).toHaveAttribute('data-step','phq-2');await complete(page);await openReview(page);await finalise(page)
})

test('partial review names the unfinished full form and unfinished personality profiles',async({page})=>{
 await setupSitting(page,{topics:['depression','mini-ipip'],reference:'SYNTHETIC-PARTIAL-PROFILE'});await answer(page,2);await answer(page,0)
 await page.getByText('Clinician options',{exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Review partial sitting',exact:true}).click()
 await expect(page.locator('.review-priorities')).toContainText('Incomplete: PHQ-9, Big Five · Mini-IPIP')
 const r=await downloadJSON(page);expect(r.symptoms[0].gateScore).toBe(2);expect(r.symptoms[0].total).toBeNull();expect(r.additional[0].status).toBe('incomplete')
})
