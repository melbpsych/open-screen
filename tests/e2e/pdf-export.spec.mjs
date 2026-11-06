import { riskDetails } from './helpers.mjs'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, setupSitting, complete, openReview, more, noOverflow, downloadJSON } from './helpers.mjs'

async function observePrint(page) {
 await page.evaluate(()=>{
  window.syntheticPrintCalls=0
  window.print=()=>{window.syntheticPrintCalls++;window.dispatchEvent(new Event('beforeprint'));window.dispatchEvent(new Event('afterprint'))}
 })
}

test('Export PDF is directly available and always prepares the complete current report',async({page})=>{
 await setupSitting(page,{topics:['depression'],reference:'SYNTHETIC-PDF'})
 await complete(page);await openReview(page)
 await page.getByLabel('Formulation & follow-up',{exact:true}).fill('Synthetic PDF note before cancellation')
 const state=await page.locator('#save-state').textContent()
 await more(page)
 await expect(page.getByRole('checkbox',{name:'Include response appendix'})).not.toBeChecked()
 await page.getByRole('button',{name:'Close exports',exact:true}).click()
 await observePrint(page)
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:700})
  await page.evaluate(()=>scrollTo(0,0))
  await expect(page.getByRole('button',{name:'Export PDF',exact:true})).toBeInViewport()
  await noOverflow(page)
 }
 await page.getByRole('button',{name:'Export PDF',exact:true}).click()
 expect(await page.evaluate(()=>window.syntheticPrintCalls)).toBe(1)
 await expect(page.locator('#export-status')).toContainText('Choose Save as PDF')
 await expect(page.locator('#print-record .report-appendix')).toContainText('phq-1')
 await expect(page.locator('#print-record .report-appendix')).toContainText('phq-2')
 await expect(page.locator('#print-record .report-notes')).toHaveText('Synthetic PDF note before cancellation')
 await expect(page.locator('#save-state')).toHaveText(state)
 await expect(page.locator('.review-reference')).toContainText('Draft')
 await expect(page.getByRole('button',{name:'Export PDF',exact:true})).toBeFocused()
 await page.getByLabel('Formulation & follow-up',{exact:true}).fill('Synthetic corrected PDF note')
 await page.getByRole('button',{name:'Export PDF',exact:true}).click()
 await expect(page.locator('#print-record .report-notes')).toHaveText('Synthetic corrected PDF note')
 const data=await downloadJSON(page)
 expect(data).not.toHaveProperty('responses')
 await expect(page.getByRole('checkbox',{name:'Include response appendix'})).not.toBeChecked()
 await page.getByRole('button',{name:'Close exports',exact:true}).click()
 await page.evaluate(()=>document.documentElement.style.fontSize='200%')
 await noOverflow(page)
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
})

test('a partial PDF keeps missing answers, incomplete results and draft status explicit',async({page})=>{
 await setupSitting(page,{topics:['depression','anxiety']})
 await page.getByRole('button',{name:'Prefer not to answer',exact:true}).click()
 page.once('dialog',dialog=>dialog.accept())
 await page.getByRole('button',{name:'Review partial assessment',exact:true}).click()
 await riskDetails(page)
 await page.getByRole('radio',{name:'Reviewed in interview',exact:true}).click()
 await page.getByLabel('Safety assessment method',{exact:true}).fill('Synthetic direct review')
 await page.getByLabel('Safety assessment outcome',{exact:true}).fill('Synthetic earlier outcome')
 await page.locator('[data-card=suicide]').getByRole('radio',{name:'Yes',exact:true}).click()
 await observePrint(page)
 await page.getByRole('button',{name:'Export PDF',exact:true}).click()
 await expect(page.locator('#print-record .report-status')).toContainText('Draft')
 await expect(page.locator('#print-record')).toContainText('Recorded risk documentation is not linked')
 await expect(page.locator('#summary-preview-text')).toContainText('Recorded risk documentation is not linked')
 await expect(page.locator('#print-record .report-appendix')).toContainText('Prefer not to answer')
 await expect(page.locator('#print-record')).toContainText('No complete score available')
 await expect(page.locator('#print-record .report-panels')).toContainText('PHQ-2')
 await expect(page.locator('#print-record .report-panels')).toContainText('GAD-2')
 const data=await downloadJSON(page,{responses:true})
 expect(data.responses['phq-1']).toEqual({missing:'prefer-not-to-answer'})
 const withoutTimestamp=text=>text.replace(/^Generated: .*?\. Engine:/m,'Generated: [snapshot time]. Engine:')
 expect(withoutTimestamp(await page.locator('#print-record .report-appendix pre').textContent())).toBe(withoutTimestamp(data.text))
})
