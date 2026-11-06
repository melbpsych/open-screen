import { riskDetails } from './helpers.mjs'
import { startAssessment } from './helpers.mjs'
import { workspaceAction } from './helpers.mjs'
import { writeFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, setupSitting, complete, openReview, more, noOverflow, downloadJSON } from './helpers.mjs'
import { createScreener } from '../../api.js'
import { questionnaires } from '../../questionnaires/registry.js'
import example from '../../examples/questionnaire.json' with { type: 'json' }
import { newAssessment, finaliseAssessment } from '../../core/assessment.js'
import { sealFile } from '../../core/vault.js'
const passphrase = 'Synthetic review regression passphrase'
const reviewed=()=>({reference:'SYNTHETIC-REVIEW',safetyReview:'Reviewed in interview',practice:{safetyMethod:'Synthetic direct interview',safetyOutcome:'Earlier synthetic outcome'}})
async function review(page) {
 await riskDetails(page)
 await page.getByRole('radio',{name:'Reviewed in interview',exact:true}).click()
 await page.getByLabel('Safety assessment method',{exact:true}).fill('Synthetic direct interview')
 await page.getByLabel('Safety assessment outcome',{exact:true}).fill('Earlier synthetic outcome')
}
async function sign(page) {
 await page.getByLabel('Reviewing clinician',{exact:true}).fill('Synthetic reviewer')
 await page.getByLabel('I reviewed this screening record.').check()
 await page.getByRole('button',{name:'Finalise record',exact:true}).click()
}
function factory(extended=false) {return createScreener({questionnaires:[...questionnaires,...(extended?[example]:[])]})}
function setup(f,topics=['depression']) {return f.createSetup({context:'clinical',topics:Object.fromEntries(f.catalog.map(x=>[x.id,topics.includes(x.id)]))})}
async function file(testInfo,bundle,name='synthetic.openscreen') {
 const path=testInfo.outputPath(name)
 await writeFile(path,await sealFile(bundle,passphrase))
 return path
}
async function resume(page,path) {
 await workspaceAction(page, 'Resume assessment')
 await page.locator('#vault-file').setInputFiles(path)
 await page.locator('#vault-passphrase').fill(passphrase)
 await page.getByRole('button',{name:'Unlock file',exact:true}).click()
 await page.locator('#resume-reference').fill('SYNTHETIC-REVIEW')
 await page.getByRole('button',{name:'Confirm & resume',exact:true}).click()
}
test('optional risk notes survive changed findings without creating finalisation gates',async({page})=>{
 await setupSitting(page,{topics:['depression'],reference:'SYNTHETIC-REVIEW'})
 await complete(page);await openReview(page);await review(page)
 await page.locator('[data-card=suicide]').getByRole('radio',{name:'Yes',exact:true}).click()
 await expect(page.locator('#review-checklist')).toHaveCount(0)
 await sign(page)
 await expect(page.getByRole('heading',{name:'Final record',exact:true})).toBeVisible()
 await page.locator('[data-card=harm]').getByRole('radio',{name:'Yes',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Draft record',exact:true})).toBeVisible()
 await expect(page.locator('#practice-safetyOutcome')).toHaveValue('Earlier synthetic outcome')
 await expect(page.locator('#review-checklist')).toHaveCount(0)
 await sign(page)
 const r=await downloadJSON(page,{responses:true})
 expect(r.clinician.safetyPriorReviews.length).toBeGreaterThan(0)
 expect(r.clinician.flags.harm).toBe('Yes')
 expect(r.text).toContain('Recorded risk documentation is not linked')
})

test('invalid external totals are actionable and cannot finalise or overwrite a valid value',async({page})=>{
 await setupSitting(page,{topics:['depression']});await complete(page);await openReview(page);await review(page)
 await page.locator('.review-checks > summary').click()
 const total=page.getByLabel('GAD-7 total entered from the official form (0–21)',{exact:true})
 await total.fill('999')
 await expect(total).toHaveAttribute('aria-invalid','true')
 await expect(page.locator('#review-checklist')).toContainText('Correct external gad7 total')
 await sign(page)
 await expect(page.locator('.review-signoff [role=alert]')).toContainText('invalid external total')
 await total.fill('21')
 await sign(page)
 await expect(page.getByRole('heading',{name:'Final record',exact:true})).toBeVisible()
 const r=await downloadJSON(page)
 expect(r.clinician.entered.gad7).toBe('21')
 await page.getByRole('button',{name:'Close exports',exact:true}).click()
 await total.fill('999')
 await expect(page.getByRole('heading',{name:'Draft record',exact:true})).toBeVisible()
 await expect(total).toHaveAttribute('aria-invalid','true')
 await total.fill('0')
 await sign(page)
 await expect(page.getByRole('heading',{name:'Final record',exact:true})).toBeVisible()
})

test('corrupt practice preferences block new sittings but not captured recovery',async({page},testInfo)=>{
 const f=factory(),s=setup(f)
 const current=newAssessment(f.configuration,s,{'phq-1':0},reviewed(),{phase:'question',cursor:'phq-2'})
 const path=await file(testInfo,{schemaVersion:1,current,history:[]})
 await page.addInitScript(()=>localStorage.setItem('open-screen.practice-preferences.v1','{corrupt'))
 await page.goto('/interview.html?resume=1')
 await expect(page.getByRole('heading',{name:'Resume encrypted assessment',exact:true})).toBeVisible()
 await page.locator('#vault-file').setInputFiles(path);await page.locator('#vault-passphrase').fill(passphrase)
 await page.getByRole('button',{name:'Unlock file',exact:true}).click()
 await page.locator('#resume-reference').fill('SYNTHETIC-REVIEW');await page.getByRole('button',{name:'Confirm & resume',exact:true}).click()
 await expect(page.locator('#main')).toHaveAttribute('data-step','phq-2')
 await page.getByRole('radio').first().click();await openReview(page)
 await expect(page.locator('.review-reference')).toContainText('SYNTHETIC-REVIEW')
})

test('a captured extended registry can start a fresh deployment-compatible assessment',async({page},testInfo)=>{
 const f=factory(true),s=setup(f)
 const current=newAssessment(f.configuration,s,{'phq-1':0},reviewed(),{phase:'question',cursor:'phq-2'})
 const path=await file(testInfo,{schemaVersion:1,current,history:[]})
 await page.goto('/interview.html');await resume(page,path)
 await page.getByRole('radio').first().click();await openReview(page);await more(page)
 page.once('dialog',d=>d.accept())
 await page.getByRole('button',{name:'New assessment',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Choose measures',exact:true})).toBeVisible()
 await expect(page.locator('[data-focus-key=example-checkin]')).toHaveCount(0)
 await startAssessment(page)
 await expect(page.locator('#main')).toHaveAttribute('data-step','phq-1')
})

test('archive download preserves history until explicit confirmation and enables capacity release',async({page},testInfo)=>{
 const f=factory(),s=setup(f),a={'phq-1':0,'phq-2':0}
 const old=await finaliseAssessment(newAssessment(f.configuration,s,a,reviewed(),{phase:'record',cursor:null}),'Synthetic reviewer')
 const current=newAssessment(f.configuration,s,a,reviewed(),{phase:'record',cursor:null})
 const path=await file(testInfo,{schemaVersion:1,current,history:[old]})
 await page.goto('/interview.html');await resume(page,path)
 await page.locator('.assessment-history > summary').click()
 const clear=page.getByRole('button',{name:'Remove archived history from this tab',exact:true})
 await expect(clear).toBeDisabled()
 await page.locator('.assessment-history').getByRole('button',{name:'Archive encrypted history',exact:true}).click()
 await page.locator('#vault-passphrase').fill(passphrase);await page.locator('#vault-confirm').fill(passphrase)
 const downloaded=page.waitForEvent('download')
 await page.getByRole('button',{name:'Encrypt & download',exact:true}).click()
 expect((await downloaded).suggestedFilename()).toBe('open-screen-archive-1-of-1.openscreen')
 await expect(page.locator('#assessment-history')).toBeFocused()
 await expect(page.locator('.assessment-history')).toContainText('1 previous final record')
 await expect(clear).toBeEnabled()
 page.once('dialog',d=>d.dismiss());await clear.click()
 await expect(page.locator('.assessment-history')).toContainText('1 previous final record')
 page.once('dialog',d=>d.accept());await clear.click()
 await expect(page.locator('.assessment-history')).toContainText('0 previous final records')
 await expect(page.locator('#assessment-history')).toBeFocused()
})

test('preparation explains identity and privacy, later recovered trauma items retain timeframe',async({page},testInfo)=>{
 await page.goto('/interview.html')
 await page.getByRole('radio',{name:'Clinical',exact:true}).click()
 await expect(page.getByText(/Needed for history. Locks after the first response/)).toBeVisible()
 await page.getByRole('button',{name:'Continue to Ready',exact:true}).click()
 await expect(page.locator('.handoff-preparation')).not.toHaveAttribute('open','')
 await page.locator('.handoff-preparation > summary').click()
 await expect(page.locator('.handoff-preparation')).toContainText('purpose, recipients and confidentiality')
 await page.locator('.handoff-preparation > summary').click()
 await expect(page.locator('.guided-recap')).toContainText('About 5–44 response tasks')
 for(const width of [1440,390,320]) {await page.setViewportSize({width,height:900});await noOverflow(page)}
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
 const f=factory(),s=setup(f,['trauma'])
 const current=newAssessment(f.configuration,s,{'pcptsd-exposure':'yes','pcptsd-1':'no'},reviewed(),{phase:'question',cursor:'pcptsd-2'})
 const path=await file(testInfo,{schemaVersion:1,current,history:[]})
 await resume(page,path)
 await expect(page.locator('#question-stem')).toContainText('past month')
 await expect(page.getByRole('radiogroup')).toHaveAccessibleDescription(/past month/)
 await expect(page.getByText('Pause or ask for help',{exact:true})).toBeVisible()
})


test('a legacy safety-pause file resumes at the next question without imposing a review',async({page},testInfo)=>{
 const f=factory(),s=setup(f),a=Object.fromEntries(Array.from({length:9},(_,i)=>['phq-'+(i+1),i===0?2:i===8?1:0]))
 const c={reference:'SYNTHETIC-REVIEW',safetyAcknowledged:false,practice:{safetyOutcome:'Synthetic legacy note preserved'}}
 const current=newAssessment(f.configuration,s,a,c,{phase:'safety',cursor:'phq-9'})
 const path=await file(testInfo,{schemaVersion:1,current,history:[]},'synthetic-legacy-pause.openscreen')
 await page.goto('/interview.html');await resume(page,path)
 await expect(page.locator('#main')).toHaveAttribute('data-screen','question')
 await expect(page.locator('#main')).toHaveAttribute('data-step','phq-difficulty')
 await complete(page);await openReview(page)
 await sign(page)
 await expect(page.locator('.review-reference')).toContainText('Final')
 const r=await downloadJSON(page,{responses:true})
 expect(r.responses['phq-9']).toBe(1)
 expect(r.clinician.practice.safetyOutcome).toBe('Synthetic legacy note preserved')
 expect(r.clinician.safetyAcknowledged).toBe(false)
})
