import { readFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, setupSitting, answer, complete, openReview } from './helpers.mjs'

async function expectHomeLink(page) {
  await expect(page.getByRole('link', { name:'openscreen home', exact:true })).toHaveAttribute('href','index.html#/')
}
test('logo returns home from library, logic, guide and setup', async ({page}) => {
  for (const path of ['/index.html','/logic.html','/help.html','/interview.html']) {
    await page.goto(path)
    await expectHomeLink(page)
    await page.getByRole('link', {name:'openscreen home',exact:true}).click()
    await expect(page).toHaveURL(/\/index.html#\/$/)
    await expect(page.getByRole('link',{name:'New assessment',exact:true})).toBeVisible()
  }
})
test('logo remains a home link during questions, uninterrupted handoff and review', async ({page}) => {
  await setupSitting(page,{topics:['depression']})
  await expectHomeLink(page)
  await complete(page,id => id === 'phq-1' ? 2 : id === 'phq-9' ? 1 : 0)
  await expect(page.locator('#main')).toHaveAttribute('data-screen','handoff')
  await expectHomeLink(page)
  await openReview(page)
  await expectHomeLink(page)
})

test('homepage has one assessment entry and a direct standalone-tool link', async ({page}, testInfo) => {
  await page.goto('/index.html')
  await expect(page.getByRole('heading', {level:1})).toHaveText('Start an assessment')
  await expect(page.locator('#main .primary-link')).toHaveCount(1)
  await expect(page.locator('#main .card, #main .profile-preview')).toHaveCount(0)
  const legacy = page.locator('a[href="#/personality-5"]')
  await expect(legacy).toBeVisible()
  await legacy.click()
  await expect(page.getByRole('radiogroup')).toHaveCount(5)
  await page.getByRole('link', {name:'openscreen home',exact:true}).click()
  for (const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:900})
    await expect(page.getByRole('link',{name:'New assessment',exact:true})).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width===1440 || width===390) await page.screenshot({path:testInfo.outputPath(`home-${width}.png`),fullPage:true})
  }
})

test('home prompt protects a reference-only draft and supports Escape and save cancellation', async ({page}) => {
  await page.goto('/interview.html')
  await page.getByRole('radio',{name:'Clinical',exact:true}).click()
  await page.getByLabel('Reference (optional)',{exact:true}).fill('SYNTHETIC-HOME-DRAFT')
  const logo=page.getByRole('link',{name:'openscreen home',exact:true})
  await logo.click()
  const prompt=page.getByRole('dialog',{name:'Return home?',exact:true})
  await expect(prompt.getByRole('button',{name:'Keep working',exact:true})).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(logo).toBeFocused()
  await expect(page.getByLabel('Reference (optional)',{exact:true})).toHaveValue('SYNTHETIC-HOME-DRAFT')
  await logo.click()
  await prompt.getByRole('button',{name:'Save progress',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'Save encrypted assessment',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Cancel',exact:true}).click()
  await expect(logo).toBeFocused()
  await expect(page.getByLabel('Reference (optional)',{exact:true})).toHaveValue('SYNTHETIC-HOME-DRAFT')
})

test('logo can keep question progress or explicitly leave without a second warning', async ({page}) => {
  await setupSitting(page,{topics:['depression'],reference:'SYNTHETIC-HOME-QUESTION'})
  await answer(page,1)
  const step=await page.locator('#main').getAttribute('data-step')
  await page.getByRole('link',{name:'openscreen home',exact:true}).click()
  await page.getByRole('button',{name:'Keep working',exact:true}).click()
  await expect(page.locator('#main')).toHaveAttribute('data-step',step)
  await page.getByRole('button',{name:'Back',exact:true}).click()
  await expect(page.getByRole('radio',{name:'Several days',exact:true})).toHaveAttribute('aria-checked','true')
  const warnings=[]
  page.on('dialog',async dialog=>{warnings.push(dialog.type());await dialog.accept()})
  await page.getByRole('link',{name:'openscreen home',exact:true}).click()
  await page.getByRole('button',{name:'Leave without saving',exact:true}).click()
  await expect(page).toHaveURL(/\/index.html#\/$/)
  expect(warnings).toEqual([])
})

test('home save downloads a recoverable assessment and waits for the user to leave', async ({page}) => {
  const passphrase='Synthetic home recovery passphrase'
  await setupSitting(page,{topics:['depression'],reference:'SYNTHETIC-HOME-SAVE'})
  await answer(page,1)
  const step=await page.locator('#main').getAttribute('data-step')
  await page.getByRole('link',{name:'openscreen home',exact:true}).click()
  await page.getByRole('dialog',{name:'Return home?',exact:true}).getByRole('button',{name:'Save progress',exact:true}).click()
  await page.getByLabel('Passphrase (12+ characters)',{exact:true}).fill(passphrase)
  await page.getByLabel('Confirm passphrase',{exact:true}).fill(passphrase)
  const pending=page.waitForEvent('download')
  await page.getByRole('button',{name:'Encrypt & download',exact:true}).click()
  const download=await pending,path=await download.path()
  expect(await readFile(path,'utf8')).not.toContain('SYNTHETIC-HOME-SAVE')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('#main')).toHaveAttribute('data-step',step)
  await page.getByRole('link',{name:'openscreen home',exact:true}).click()
  await expect(page).toHaveURL(/\/index.html#\/$/)
  await page.getByRole('link',{name:'Resume assessment',exact:true}).click()
  await page.locator('#vault-file').setInputFiles(path)
  await page.getByLabel('Passphrase (12+ characters)',{exact:true}).fill(passphrase)
  await page.getByRole('button',{name:'Unlock file',exact:true}).click()
  await page.locator('#resume-reference').fill('SYNTHETIC-HOME-SAVE')
  await page.getByRole('button',{name:'Confirm & resume',exact:true}).click()
  await expect(page.locator('#main')).toHaveAttribute('data-step',step)
  await page.getByRole('button',{name:'Back',exact:true}).click()
  await expect(page.getByRole('radio',{name:'Several days',exact:true})).toHaveAttribute('aria-checked','true')
})

test('result home prompt fits enlarged phones and leaves the record intact', async ({page}) => {
  await setupSitting(page,{topics:['depression']})
  await complete(page);await openReview(page,{documentation:false})
  await page.setViewportSize({width:320,height:700})
  await page.evaluate(()=>document.documentElement.style.fontSize='200%')
  await page.getByRole('link',{name:'openscreen home',exact:true}).click()
  const prompt=page.getByRole('dialog',{name:'Return home?',exact:true})
  expect(await prompt.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true)
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
  await prompt.getByRole('button',{name:'Keep working',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Results',exact:true})).toBeVisible()
  await expect(page.locator('#main')).toContainText('PHQ-2')
})
