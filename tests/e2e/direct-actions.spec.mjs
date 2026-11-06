import AxeBuilder from '@axe-core/playwright'
import { test, expect, setupSitting, answer, complete, openReview, downloadJSON, noOverflow, more } from './helpers.mjs'

test('question actions are direct and help preserves the answer, keyboard state and focus', async ({ page },testInfo) => {
  await setupSitting(page, { topics: ['depression'] })
  await expect(page.locator('.omission-options,.item-source')).toHaveCount(0)
  for (const name of ['Prefer not to answer','Unable to answer','Pause or ask for help','Review partial assessment']) await expect(page.getByRole('button',{name,exact:true})).toBeVisible()
  const help=page.getByRole('button',{name:'About this questionnaire',exact:true})
  await help.click()
  await expect(page.getByRole('dialog')).toContainText('Missing answers are never scored as zero')
  await page.keyboard.press('1')
  await expect(page.locator('#main')).toHaveAttribute('data-step','phq-1')
  await page.keyboard.press('Escape')
  await expect(help).toBeFocused()
  await page.getByRole('button',{name:'Pause or ask for help',exact:true}).click()
  await expect(page.getByRole('dialog')).toContainText('Assessment paused')
  await page.keyboard.press('Escape')
  await page.getByRole('button',{name:'Unable to answer',exact:true}).click()
  await expect(page.locator('#main')).toHaveAttribute('data-step','phq-2')
  for(const width of [1440,390,320]) { await page.setViewportSize({width,height:844}); await noOverflow(page) }
  await page.screenshot({path:testInfo.outputPath('direct-question-actions.png'),fullPage:true})
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
})

test('brief findings precede full forms and give a single selection step with honest remaining counts', async ({page},testInfo) => {
  await setupSitting(page,{topics:['depression','anxiety']})
  for(const value of [2,0,2,0]) await answer(page,value)
  await expect(page.locator('#main')).toHaveAttribute('data-screen','followups')
  await expect(page.getByRole('heading',{name:'Initial results',exact:true})).toBeVisible()
  await expect(page.locator('.brief-readout')).toContainText('PHQ-2')
  await expect(page.locator('.brief-readout')).toContainText('Depression: explore further')
  await expect(page.locator('.brief-readout')).not.toContainText('Moderate')
  const phq=page.getByRole('checkbox',{name:/PHQ-9/}), gad=page.getByRole('checkbox',{name:/GAD-7/})
  await expect(phq).toBeChecked(); await expect(gad).toBeChecked()
  await expect(phq.locator('..')).toContainText('8 more questions') // 7 new symptoms + unscored impact
  await expect(gad.locator('..')).toContainText('5 more questions')
  await gad.uncheck()
  for(const width of [1440,390,320]) { await page.setViewportSize({width,height:844}); await noOverflow(page) }
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
  await page.screenshot({path:testInfo.outputPath('initial-results.png'),fullPage:true})
  await page.getByRole('button',{name:'Continue with selected',exact:true}).click()
  await expect(page.locator('#main')).toHaveAttribute('data-step','phq-3')
  const trace=await complete(page)
  expect(trace.some(row=>row.id==='gad-3')).toBe(false)
  await openReview(page)
  const r=await downloadJSON(page,{responses:true})
  expect(r.symptoms.find(row=>row.id==='anxiety')).toMatchObject({gateScore:2,total:null,status:'omitted'})
  expect(r.symptoms.find(row=>row.id==='depression')).toMatchObject({gateScore:2,total:2,status:'scored'})
  expect(r.setup.followUpChoices.anxiety).toBe(false)
  expect(r.text).toContain('Full questionnaire not selected after initial screening')
})

test('brief results can be used without answering any full measure', async ({page}) => {
  await setupSitting(page,{topics:['depression']})
  await answer(page,2);await answer(page,0)
  await page.getByRole('button',{name:'Use brief results',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Results',exact:true})).toBeVisible()
  await expect(page.locator('.clinical-results')).toContainText('Full questionnaire not selected')
  const r=await downloadJSON(page)
  expect(r.symptoms[0]).toMatchObject({gateScore:2,total:null,status:'omitted'})
})

test('a below-threshold optional extension is available without repeating brief items', async ({page}) => {
  await setupSitting(page,{topics:['depression','anxiety']})
  for(const value of [2,0,0,0]) await answer(page,value)
  const gad=page.getByRole('checkbox',{name:/GAD-7/})
  await expect(gad).not.toBeChecked()
  await expect(gad.locator('..')).toContainText('Optional')
  await gad.check()
  await page.getByRole('button',{name:'Continue with selected',exact:true}).click()
  const trace=await complete(page)
  expect(trace.some(row=>row.id==='gad-3')).toBe(true)
  expect(trace.some(row=>row.id==='gad-1')).toBe(false)
})

test('deselecting every full form leaves one direct action to use the brief results',async({page})=>{
  await setupSitting(page,{topics:['depression']})
  await answer(page,2);await answer(page,0)
  await page.getByRole('checkbox',{name:/PHQ-9/}).uncheck()
  await expect(page.getByRole('button',{name:'Use brief results',exact:true})).toHaveCount(1)
  await page.getByRole('button',{name:'Use brief results',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Results',exact:true})).toBeVisible()
})


test('reviewing completed answers does not add an empty full-form chooser',async({page})=>{
  await setupSitting(page,{topics:['depression']})
  await complete(page,id=>id==='phq-1'?2:0);await openReview(page)
  await more(page);await page.getByRole('button',{name:'Review responses',exact:true}).click()
  await answer(page,3);await answer(page,0)
  await expect(page.locator('#main')).toHaveAttribute('data-screen','question')
  await expect(page.locator('#main')).toHaveAttribute('data-step','phq-3')
})

test('a complete short measure keeps its actual range in the initial readout',async({page})=>{
  await setupSitting(page,{topics:['depression','asrs-v1-1']})
  await answer(page,2);await answer(page,0)
  for(let i=0;i<6;i++) await answer(page,4)
  await expect(page.locator('#main')).toHaveAttribute('data-screen','followups')
  const asrs=page.locator('.brief-row').filter({hasText:'ASRS'})
  await expect(asrs).toContainText('6/6')
  await expect(asrs).not.toContainText('null')
})

test('negative brief readout includes the exposure stop without another decision step',async({page})=>{
  await setupSitting(page)
  await complete(page)
  await expect(page.locator('#main')).toHaveAttribute('data-screen','handoff')
  await expect(page.locator('.brief-readout')).toContainText('Exposure not endorsed')
  await expect(page.getByRole('button',{name:'Review clinician record',exact:true})).toBeVisible()
})
