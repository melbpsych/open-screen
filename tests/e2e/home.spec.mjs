import { test, expect, setupSitting, complete, openReview } from './helpers.mjs'

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
