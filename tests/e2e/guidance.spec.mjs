import { workspaceMenu } from './helpers.mjs'
import { workspaceAction } from './helpers.mjs'
import { setupView } from './helpers.mjs'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, setupSitting, complete, openReview, noOverflow } from './helpers.mjs'

test('help opens separately from a assessment and works without JavaScript', async ({ page, context }, testInfo) => {
  await page.goto('/interview.html')
  await setupView(page, 'Measures')
  await page.getByLabel('Reference (optional)', { exact: true }).fill('SYNTHETIC-GUIDE')
  await workspaceMenu(page)
  const pending = context.waitForEvent('page')
  await page.getByRole('link', { name: 'Help ↗', exact: true }).click()
  const guide = await pending
  await expect(guide.getByRole('heading', { name: 'A guide to your assessment.' })).toBeVisible()
  await expect(page.getByLabel('Reference (optional)', { exact: true })).toHaveValue('SYNTHETIC-GUIDE')
  await guide.screenshot({ path: testInfo.outputPath('guide.png'), fullPage: true })
  const noScript = await context.browser().newContext({ javaScriptEnabled: false })
  try {
    const tab = await noScript.newPage()
    await tab.goto(new URL('/help.html', page.url()).href)
    await tab.getByText('The file will not unlock', { exact: true }).click()
    await expect(tab.getByText('Check the file, passphrase and application version.', { exact: false })).toBeVisible()
    await tab.getByRole('link', { name: '5. Save & resume', exact: true }).click()
    await expect(tab).toHaveURL(/#save$/)
  } finally { await noScript.close() }
})

test('guide and clinical review support text spacing, narrow and landscape layouts', async ({ page }) => {
  await page.goto('/help.html')
  for (const disclosure of await page.locator('details').all()) await disclosure.evaluate(node => { node.open = true })
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' })
  for (const size of [{width:320,height:700},{width:768,height:1024},{width:1024,height:768},{width:844,height:390},{width:1920,height:1080}]) {
    await page.setViewportSize(size); await noOverflow(page)
  }
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()).violations).toEqual([])
  await setupSitting(page, { topics:['depression'] }); await complete(page); await openReview(page)
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' })
  for (const size of [{width:320,height:700},{width:844,height:390}]) {
    await page.setViewportSize(size); await noOverflow(page)
    // Re-enter the field after resizing, then observe the browser's settled
    // native focus scrolling (do not scroll the target in the test).
    await page.locator('#main h1').first().focus()
    await page.getByLabel('Reviewing clinician', { exact:true }).focus()
    await expect.poll(async () => {
      const bounds = await page.getByLabel('Reviewing clinician', {exact:true}).boundingBox()
      return bounds.y >= 0 && bounds.y + bounds.height <= size.height
    }).toBe(true)
  }
})

test('resuming cannot silently replace a reference-only draft', async ({page, context}) => {
  const passphrase = 'Synthetic guide regression passphrase'
  await page.goto('/interview.html')
  await setupView(page, 'Measures')
  await page.getByLabel('Reference (optional)', {exact:true}).fill('SYNTHETIC-SAVED')
  await workspaceAction(page, 'Save encrypted assessment')
  await page.getByLabel('Passphrase (12+ characters)', {exact:true}).fill(passphrase)
  await page.getByLabel('Confirm passphrase', {exact:true}).fill(passphrase)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', {name:'Encrypt & download'}).click()
  const path = await (await pending).path()
  const tab = await context.newPage()
  await tab.goto('/interview.html')
  await setupView(tab, 'Measures')
  await tab.getByLabel('Reference (optional)', {exact:true}).fill('SYNTHETIC-UNSAVED')
  await workspaceAction(tab, 'Resume assessment')
  await tab.getByLabel('Encrypted assessment file', {exact:true}).setInputFiles(path)
  await tab.getByLabel('Passphrase (12+ characters)', {exact:true}).fill(passphrase)
  await tab.getByRole('button', {name:'Unlock file'}).click()
  await tab.locator('#resume-reference').fill('SYNTHETIC-SAVED')
  const dialog = tab.waitForEvent('dialog')
  const click = tab.getByRole('button', {name:'Confirm & resume'}).click()
  const confirmation = await dialog
  expect(confirmation.message()).toContain('Replace the current assessment')
  await confirmation.dismiss(); await click
  await expect(tab.getByLabel('Reference (optional)', {exact:true})).toHaveValue('SYNTHETIC-UNSAVED')
})

test('visual workflow follows administration mode and icon actions retain their names', async ({ page }, testInfo) => {
  await page.goto('/interview.html')
  await setupView(page, 'Measures')
 await setupView(page, 'Guide')
  const workflow = page.getByRole('list', { name: 'Assessment workflow', exact:true })
  await expect(workflow.getByRole('listitem')).toHaveCount(4)
  await expect(workflow).toContainText('Indicated follow-ups')
 await setupView(page, 'Options')
  await page.locator('.administration-disclosure').evaluate(node => { node.open = true })
 await setupView(page, 'Options')
  await page.locator('#administration-mode').selectOption('monitoring')
 await setupView(page, 'Guide')
  await expect(workflow.getByRole('listitem')).toHaveCount(3)
  await expect(workflow).toContainText('Full measures')
  await workspaceMenu(page)
  for (const name of ['Save encrypted assessment', 'Resume assessment']) {
    await expect(page.getByRole('button', {name,exact:true})).toBeVisible()
  }
  for (const width of [1440,390,320]) { await page.setViewportSize({width,height:900}); await noOverflow(page) }
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
  await page.screenshot({path:testInfo.outputPath('visual-setup.png'),fullPage:true})
  await page.goto('/help.html')
  await page.getByRole('list',{name:'Assessment at a glance'}).getByRole('link',{name:'Save',exact:true}).click()
  await expect(page).toHaveURL(/#save$/)
})
