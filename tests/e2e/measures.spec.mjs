import { startAssessment } from './helpers.mjs'
import { setupView } from './helpers.mjs'
import { readFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, setupSitting, answer, complete, openReview, downloadJSON, noOverflow, more } from './helpers.mjs'

test('ASRS and DSS-B run with automatic advance and export distinct clinical results', async ({page})=>{
  await setupSitting(page,{topics:['asrs-v1-1','dss-b']})
  await expect(page.locator('#main')).toHaveAttribute('data-step','asrs-v1-1-1')
  const trace=await complete(page,id=>id.startsWith('asrs')?3:2)
  expect(trace).toHaveLength(14)
  await openReview(page)
  for(const row of await page.locator('.clinical-results .result-detail').all()) { if (!await row.evaluate(node=>node.open)) await row.locator(':scope > summary').click() }
  await expect(page.locator('[data-domain="asrs-v1-1"]:visible')).toContainText('Screen positive')
  await expect(page.locator('[data-domain="asrs-v1-1"]:visible .panel-score')).toContainText('6 / 6')
  await expect(page.locator('[data-domain="dss-b"]:visible .panel-score')).toContainText('16 / 32')
  const record=await downloadJSON(page)
  expect(record.additional.find(q=>q.id==='asrs-v1-1')).toMatchObject({total:6,continuousTotal:18,positive:true})
  expect(record.additional.find(q=>q.id==='dss-b')).toMatchObject({total:16,positive:null})
  expect(record.configuration.questionnaires).toHaveLength(9)
  const pending=page.waitForEvent('download')
  await more(page)
  await page.getByRole('button',{name:'Save report',exact:true}).click()
  const html=await readFile(await (await pending).path(),'utf8')
  expect(html).toContain('New York University and the President and Fellows of Harvard College')
  expect(html).toContain('18/24')
})

test('TAPS fails closed until its form and locale are acknowledged, then branches and records substance scores',async({page})=>{
  await page.goto('/interview.html')
  await page.getByRole('radio',{name:'Clinical',exact:true}).click()
  await page.locator('.additional-measures > summary').first().click()
  for(const id of ['depression','anxiety','trauma','taps']) await page.locator(`[data-focus-key="${id}"]`).click()
  await expect(page.getByRole('button',{name:'Continue to Ready'})).toBeDisabled()
  await expect(page.getByText(/Original US form: its drink examples/)).toBeVisible()
  await page.getByRole('radio',{name:'Female form · 4 or more US drinks',exact:true}).click()
  await expect(page.getByRole('button',{name:'Continue to Ready'})).toBeDisabled()
  await page.getByRole('checkbox',{name:'The original US drink sizes and sex-specific alcohol questions are appropriate for this administration.'}).check()
 await setupView(page, 'Measures')
  await startAssessment(page)
  // Never tobacco/alcohol/prescription; less-than-monthly illicit drugs.
  for(const option of [4,4,3,4]) await answer(page,option)
 // Four use questions can branch into ten scored questions plus a text prompt.
 await expect(page.getByRole('checkbox',{name:/TAPS/}).locator('..')).toContainText('4–10 more questions')
  await page.getByRole('button',{name:'Continue with selected',exact:true}).click()
  await expect(page.locator('#main')).toHaveAttribute('data-step','taps-cannabis-use')
  await answer(page,0) // yes
  await answer(page,0) // urge yes
  await answer(page,1) // concern no
  for(let i=0;i<3;i++) await answer(page,1) // other illicit classes no
  await expect(page.locator('#main')).toHaveAttribute('data-screen','handoff')
  await openReview(page)
  const record=await downloadJSON(page)
  const row=record.additional.find(q=>q.id==='taps')
  expect(row).toMatchObject({status:'scored',total:null,max:null})
  expect(row.scales.find(q=>q.id==='cannabis')).toMatchObject({sum:2})
  expect(row.scales.find(q=>q.id==='opioids')).toMatchObject({sum:0,stopRule:'No past-year use reported; follow-up not administered.'})
  await page.getByRole('button',{name:'Close exports',exact:true}).click()
  await page.locator('.profile-result > summary').click()
  await expect(page.locator('[data-profile="taps"]:visible')).toContainText('Substance scores remain separate')
  // Patient-specific form is cleared on new assessment.
  await more(page);page.once('dialog',d=>d.accept())
  await page.getByRole('button',{name:'New assessment',exact:true}).click()
  await expect(page.getByRole('radio',{name:'Female form · 4 or more US drinks',exact:true})).toHaveAttribute('aria-checked','false')
  await expect(page.getByRole('button',{name:'Continue to Ready'})).toBeDisabled()
})

test('all six new personality options produce separate keyed profiles and accessible charts',async({page,context})=>{
  const ids=['mini-ipip','ipip-neo-120','catpd-anger','catpd-affective-lability','catpd-non-planfulness','catpd-mistrust']
  await setupSitting(page,{topics:ids})
  const trace=await complete(page,()=>2)
  expect(trace).toHaveLength(164)
  expect(trace.every(q=>q.stage.includes('Stage 2'))).toBe(true)
  await openReview(page)
  for(const row of await page.locator('.profile-result').all()) { if (!await row.evaluate(node=>node.open)) await row.locator(':scope > summary').click() }
  await expect(page.locator('[data-profile]:visible')).toHaveCount(6)
  await page.locator('.profile-facets:visible > summary').click()
  const record=await downloadJSON(page)
  for(const row of record.additional){expect(row.total).toBeNull();expect(row.scales.every(s=>s.mean===3)).toBe(true)}
  expect(record.additional.find(q=>q.id==='ipip-neo-120').scales).toHaveLength(35)
  for(const width of [1280,390,320]) { await page.setViewportSize({width,height:900});await noOverflow(page) }
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%'})
  await noOverflow(page)
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect(scan.violations).toEqual([])
  const pending=page.waitForEvent('download')
  await more(page)
  await page.getByRole('button',{name:'Save report',exact:true}).click()
  const html=await readFile(await (await pending).path(),'utf8')
  expect(html).toContain('30 facet scores');expect(html).toContain('keyed mean')
  // The downloadable report includes facet content even when its disclosure is closed.
  expect(html).toContain('Cautiousness')
  const report=await context.newPage()
  await report.setContent(html)
  await report.setViewportSize({width:320,height:900})
  await noOverflow(report)
  await expect(report.locator('[data-scale="c6"]')).toBeVisible()
  await report.emulateMedia({media:'print'})
  await expect(report.locator('[data-scale="c6"]')).toBeVisible()
})

test('logic distinguishes fixed screening rules, optional profiles and external permission requirements',async({page})=>{
  await page.goto('/logic.html')
  await expect(page.locator('[data-pathway="asrs-v1-1"]')).toContainText('≥4 endorsements')
  await expect(page.locator('[data-pathway="taps"]')).toContainText('Any use by class')
  await expect(page.locator('[data-pathway="taps"] button')).toHaveCount(0)
  await page.locator('.logic-optional').filter({has:page.getByText('Optional measures',{exact:true})}).locator('summary').click()
  await expect(page.getByText('Personality · IPIP-NEO-120',{exact:true})).toBeVisible()
  await page.getByText('External measures',{exact:true}).click()
  for(const name of ['Sleep · SCI-02 / SCI-8 ↗','OCD · OCI-4 / OCI-R ↗','Functioning · WHODAS 2.0 ↗','Substance use · WHO ASSIST ↗']) await expect(page.getByRole('link',{name,exact:true})).toBeVisible()
  await page.getByText('Edit thresholds',{exact:true}).click()
  await expect(page.getByRole('spinbutton',{name:/ASRS|DSS|TAPS/})).toHaveCount(0)
  await noOverflow(page)
})

test('external results remain explicitly clinician-entered and survive exports without protected items',async({page})=>{
  await setupSitting(page,{topics:['asrs-v1-1']})
  await complete(page)
  await openReview(page)
  await page.getByText('Interview & external measures',{exact:false}).click()
  const box=page.getByRole('textbox',{name:'WHODAS form, respondent, scoring method, date and result',exact:true})
  await box.fill('SYNTHETIC: WHODAS-12, self-report, simple 0–48 sum 6, 26 October 2026')
  const record=await downloadJSON(page)
  expect(record.clinician.entered['external-whodas']).toContain('simple 0–48')
  expect(record.cards.find(q=>q.id==='external-whodas').sentence).toContain('not calculated by Open Screen')
  await expect(page.locator('[data-card="external-whodas"] a')).toHaveAttribute('href',/who.int/)
  await expect(page.locator('[data-card="external-whodas"]')).toContainText('No deployment licence')
})
