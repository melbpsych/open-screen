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
test('a negative depression gate still requires an independent safety review', async () => {
 const s=setup(), a={'phq-1':0,'phq-2':0}
 await assert.rejects(finaliseAssessment(draft(s,a,{}),'Reviewer'), /independently/)
 await assert.rejects(finaliseAssessment(draft(s,a,{safetyReview:'Reviewed in interview'}),'Reviewer'), /method and outcome/)
 await finaliseAssessment(draft(s,a,reviewed()),'Reviewer')
})
test('deferred safety and follow-up outcomes require a reason, owner, action and valid date', async () => {
 const s=setup(),a={'phq-1':0,'phq-2':0},c={safetyReview:'Deferred',practice:{safetyReason:'Synthetic interruption'}}
 await assert.rejects(finaliseAssessment(draft(s,a,c),'Reviewer'),/follow-up action/)
 Object.assign(c.practice,{followUpOwner:'Clinician',followUpAction:'Direct review',followUpDue:'2026-11-02'})
 await finaliseAssessment(draft(s,a,c),'Reviewer')
 c.practice.followUpDue='2026-02-30'
 assert.throws(()=>draft(s,a,c),/Invalid follow-up date/)
})
test('declined answers finish administration but never enter scoring, and require missingness review', async () => {
 const s=setup(),a={'phq-1':{missing:'prefer-not-to-answer'},'phq-2':0},c=reviewed()
 assert.equal(f.progress(s,a).finished,true)
 assert.equal(f.record(s,a,c).symptoms[0].total,null)
 assert.equal(f.record(s,a,c).symptoms[0].gateScore,null)
 await assert.rejects(finaliseAssessment(draft(s,a,c),'Reviewer'),/missing answers/)
 c.practice.omissionsReviewed=true
 await finaliseAssessment(draft(s,a,c),'Reviewer')
 const r=f.record(s,a,c)
 assert.match(clinicalSummary(r),/Prefer not to answer/)
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
test('forensic review requires context and exports separate evidence sources safely', async () => {
 const s=setup({context:'forensic'}),a={'phq-1':0,'phq-2':0},c=reviewed()
 await assert.rejects(finaliseAssessment(draft(s,a,c),'Reviewer'),/forensic context/)
 for(const key of ['referral','purpose','recipient','conditions','collateral','uncertainty']) c.practice[key]='<script>synthetic</script>'
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
})

test('review issue targets and finalisation messages have one source of truth', async()=>{
 const {reviewIssues,reviewErrors}=await import('./workflow.js')
 const s=setup({context:'forensic'}),r=f.record(s,{'phq-1':0,'phq-2':0},{})
 let issues=reviewIssues(r)
 assert.deepEqual(reviewErrors(r),issues.map(issue=>issue.message))
 assert.equal(issues.find(issue=>issue.id==='safety').target,'safety-review')
 assert.equal(issues.find(issue=>issue.id==='forensic').target,'practice-referral')
 const updated=f.record(s,{'phq-1':0,'phq-2':0},{safetyReview:'Reviewed in interview',practice:{safetyMethod:'Direct interview',referral:'Synthetic referral'}})
 issues=reviewIssues(updated)
 assert.equal(issues.find(issue=>issue.id==='safety-outcome').target,'practice-safetyOutcome')
 assert.equal(issues.find(issue=>issue.id==='forensic').target,'practice-purpose')
})
