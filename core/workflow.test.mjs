import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createScreener, exportJSON } from '../api.js'
import { newAssessment, finaliseAssessment } from './assessment.js'
import { buildReport, clinicalSummary } from '../presentation.js'
import { scoreValidity, validityItems } from '../gates/validity.js'
const f = createScreener()
const setup = (overrides = {}) => f.createSetup({ context: 'clinical', ...overrides, topics: { depression: true, anxiety: false, trauma: false, ...overrides.topics } })
const reviewed = () => ({ safetyReview: 'Reviewed in interview', practice: { safetyMethod: 'Synthetic interview', safetyOutcome: 'Synthetic outcome' } })
const draft = (s,a,c) => newAssessment(f.configuration,s,a,c,{phase:'record',cursor:null})
test('screening finalisation does not require risk documentation', async () => {
 const s=setup(), a={'phq-1':0,'phq-2':0}
 await finaliseAssessment(draft(s,a,{}),'Reviewer')
 await finaliseAssessment(draft(s,a,{safetyReview:'Reviewed in interview'}),'Reviewer')
 await finaliseAssessment(draft(s,a,reviewed()),'Reviewer')
})
test('optional risk and follow-up notes can be partial, while entered dates stay valid', async () => {
 const s=setup(),a={'phq-1':0,'phq-2':0},c={safetyReview:'Deferred',practice:{safetyReason:'Synthetic interruption'}}
 await finaliseAssessment(draft(s,a,c),'Reviewer')
 Object.assign(c.practice,{followUpOwner:'Clinician',followUpAction:'Direct review',followUpDue:'2026-11-02'})
 await finaliseAssessment(draft(s,a,c),'Reviewer')
 c.practice.followUpDue='2026-02-30'
 assert.throws(()=>draft(s,a,c),/Invalid follow-up date/)
})
test('declined answers remain unscored and do not require an extra acknowledgement', async () => {
 const s=setup(),a={'phq-1':{missing:'prefer-not-to-answer'},'phq-2':0},c=reviewed()
 assert.equal(f.progress(s,a).finished,true)
 assert.equal(f.record(s,a,c).symptoms[0].total,null)
 assert.equal(f.record(s,a,c).symptoms[0].gateScore,null)
 await finaliseAssessment(draft(s,a,c),'Reviewer')
 c.practice.omissionsReviewed=true
 await finaliseAssessment(draft(s,a,c),'Reviewer')
 const r=f.record(s,a,c)
 assert.match(clinicalSummary(r),/Prefer not to answer/)
 assert.match(r.text,/phq-1: Prefer not to answer \(missing: prefer-not-to-answer\)\. No score imputed\./)
 assert.match(buildReport(r,undefined,{appendix:true}),/phq-1: Prefer not to answer \(missing: prefer-not-to-answer\)/)
 assert.equal(JSON.parse(exportJSON(r,{includeResponses:true})).text,r.text)
 assert.equal(JSON.parse(exportJSON(r)).omissions['phq-1'].missing,'prefer-not-to-answer')
 assert.throws(()=>f.record(s,{'phq-1':{reason:'skip'}},c),/Invalid answers/)
})
test('monitoring collects full PHQ even with a low or declined brief response', () => {
 const s=setup({mode:'monitoring'}),a={'phq-1':{missing:'unable-to-answer'},'phq-2':0}
 assert.ok(f.getSteps(s,a).some(q=>q.id==='phq-9'))
 for(const q of f.getSteps(s,a)) if(!(q.id in a)) a[q.id]=0
 assert.equal(f.progress(s,a).finished,true)
 assert.equal(f.record(s,a,reviewed()).symptoms[0].total,null)
 a['phq-1']=0
 assert.equal(f.record(s,a,reviewed()).symptoms[0].total,0)
})
test('optional forensic context exports entered evidence sources safely', async () => {
 const s=setup({context:'forensic'}),a={'phq-1':0,'phq-2':0},c=reviewed()
 await finaliseAssessment(draft(s,a,c),'Reviewer')
 for(const key of ['referral','purpose','recipient','conditions','collateral','uncertainty','notification']) c.practice[key]='<script>synthetic</script>'
 await finaliseAssessment(draft(s,a,c),'Reviewer')
 assert.match(buildReport(f.record(s,a,c)),/&lt;script&gt;synthetic/)
 assert.doesNotMatch(buildReport(f.record(s,a,c)),/<script>/)
})
test('response descriptions report actual distributions without claiming validity', () => {
 const a=Object.fromEntries(validityItems.map(q=>[q.id,4]));a[validityItems[0].id]=3
 const r=scoreValidity(a)
 assert.equal(r.label,'Frequent agreement')
 assert.deepEqual(r.responseCounts,[0,0,1,29,0])
 assert.doesNotMatch(r.label,/All-true|Inconsistent|valid/i)
})
test('missing-answer metadata is strict and does not collide with narrative text',()=>{
 const s=setup({topics:{depression:false,trauma:true}})
 assert.throws(()=>f.record(s,{'pcptsd-exposure':{missing:'unable-to-answer',score:0}},{}),/Invalid answers/)
 const r=f.record(s,{'pcl-event':'unable-to-answer'}, {})
 assert.deepEqual(r.omissions,{})
 assert.equal(r.responses['pcl-event'],'unable-to-answer')
})
test('monitoring keeps all five trait forms and never imputes a declined marker',()=>{
 const s=setup({mode:'monitoring',topics:{depression:false,personality:true}}),a={}
 const path=f.getSteps(s,a)
 assert.equal(path.length,50)
 for(const q of path) a[q.id]=3
 a[path[0].id]={missing:'unable-to-answer'}
 const r=f.record(s,a,reviewed())
 assert.equal(r.ipip.filter(row=>row.status==='scored').length,4)
 assert.equal(r.ipip.filter(row=>row.status==='incomplete').length,1)
 assert.equal(f.progress(s,a).finished,true)
})
test('inactive missing answers stay in raw data but are not current omissions',()=>{
 const s=setup({topics:{depression:false,anxiety:true}})
 const r=f.record(s,{'phq-1':{missing:'unable-to-answer'},'gad-1':0,'gad-2':0},reviewed())
 assert.deepEqual(r.omissions,{})
 assert.equal(r.responses['phq-1'].missing,'unable-to-answer')
 assert.match(r.text,/phq-1: Unable to answer .*Outside the current scoring path; not used in current totals\./)
 assert.equal(r.symptoms[0].gateScore,0)
})

test('documentation fields never create finalisation checklist requirements', async()=>{
 const {reviewIssues,reviewErrors}=await import('./workflow.js')
 for(const c of [{}, {safetyReview:'Deferred'}, {flags:{suicide:'Yes'}}, {practice:{followUpAction:'Optional follow-up'}}]) {
  const r=f.record(setup({context:'forensic'}),{'phq-1':0,'phq-2':0},c)
  assert.deepEqual(reviewIssues(r),[])
  assert.deepEqual(reviewErrors(r),[])
  await finaliseAssessment(draft(r.setup,r.responses,c),'Reviewer')
 }
})

test('optional risk notes round trip and empty risk documentation is omitted from exports',async()=>{
 const {sealFile,openFile}=await import('./vault.js')
 const {assessmentRecord,verifyBundle}=await import('./assessment.js')
 const s=setup(),a={'phq-1':0,'phq-2':0}
 const empty=f.record(s,a,{})
 for(const text of [empty.text,clinicalSummary(empty),buildReport(empty)]) assert.doesNotMatch(text,/Safety review:|Risk documentation:|not recorded|not acknowledged/i)
 const record=await finaliseAssessment(draft(s,a,{practice:{riskNotes:'Synthetic optional risk note'}}),'Reviewer')
 const restored=await openFile(await sealFile({schemaVersion:1,current:record,history:[]},'Synthetic optional notes passphrase'),'Synthetic optional notes passphrase')
 const r=assessmentRecord((await verifyBundle(restored)).current)
 for(const text of [r.text,clinicalSummary(r),buildReport(r),exportJSON(r,{includeResponses:true})]) assert.match(text,/Synthetic optional risk note/)
 assert.equal(r.assessment.review.status,'final')
})
