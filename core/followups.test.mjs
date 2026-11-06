import test from 'node:test'
import assert from 'node:assert/strict'
import {createScreener,exportJSON} from '../api.js'
import {questionnaires} from '../questionnaires/registry.js'
import {newAssessment,finaliseAssessment,assessmentRecord,verifyBundle} from './assessment.js'
import {clinicalSummary,buildReport} from '../presentation.js'
import {historySeries} from './history.js'
import {sealFile,openFile} from './vault.js'
const f=createScreener({questionnaires})
const setup=(extra={})=>f.createSetup({context:'clinical',topics:Object.fromEntries(f.catalog.map(row=>[row.id,['depression','anxiety'].includes(row.id)])),...extra})
const brief={'phq-1':2,'phq-2':0,'gad-1':2,'gad-2':0}
const notes={reference:'SYNTHETIC-FOLLOWUPS',safetyReview:'Reviewed in interview',practice:{safetyMethod:'Synthetic interview',safetyOutcome:'Synthetic disposition'}}

test('full-form choices preserve briefs, shared answers and the unmodified default path',()=>{
  const defaults=f.getSteps(setup(),brief).map(step=>step.id)
  assert.deepEqual(defaults,['phq-1','phq-2','gad-1','gad-2','phq-3','phq-4','phq-5','phq-6','phq-7','phq-8','phq-9','phq-difficulty','gad-3','gad-4','gad-5','gad-6','gad-7'])
  const s=setup({followUpChoices:{depression:false,anxiety:false}})
  assert.deepEqual(f.getSteps(s,brief).map(step=>step.id),['phq-1','phq-2','gad-1','gad-2'])
  assert.equal(f.progress(s,brief).finished,true)
  const r=f.record(s,brief)
  assert.deepEqual(r.symptoms.map(row=>[row.status,row.gateScore,row.total]),[['omitted',2,null],['omitted',2,null]])
})

test('chosen brief-only records can be attested, recovered and reported without implying a negative gate',async()=>{
  const s=setup({followUpChoices:{depression:false,anxiety:false}})
  const draft=newAssessment(f.configuration,s,brief,notes,{phase:'record',cursor:null})
  const a=await finaliseAssessment(draft,'Synthetic clinician')
  const r=assessmentRecord(a)
  for(const output of [r.text,clinicalSummary(r),clinicalSummary(r,undefined,{concise:true}),buildReport(r),exportJSON(r)]) {
    assert.match(output,/not selected after initial screening/i)
    assert.doesNotMatch(output,/gate below threshold|Below gate|Brief screen is incomplete/)
  }
  assert.equal(historySeries([a]).filter(row=>row.label==='PHQ-2')[0].points[0].value,2)
  const encrypted=await sealFile({schemaVersion:1,current:a,history:[]},'Synthetic followups passphrase')
  const restored=await verifyBundle(await openFile(encrypted,'Synthetic followups passphrase'))
  assert.deepEqual(restored.current.setup.followUpChoices,{depression:false,anxiety:false})
  assert.equal(assessmentRecord(restored.current).symptoms[0].total,null)
})

test('deferred full scores never use stale answers or erase known safety endorsements',()=>{
  const s=setup({followUpChoices:{depression:false,anxiety:false}})
  const a={...brief,...Object.fromEntries(Array.from({length:7},(_,i)=>['phq-'+(i+3),3]))}
  const r=f.record(s,a)
  assert.equal(r.symptoms[0].total,null)
  assert.equal(r.safetyFlag,true)
  assert.equal(r.responses['phq-9'],3)
  assert.match(r.text,/PHQ-9 item 9/)
})

test('invalid choices fail closed and monitoring still administers planned full measures',()=>{
  assert.throws(()=>setup({followUpChoices:{unknown:false}}),/unknown/)
  assert.throws(()=>setup({followUpChoices:{'asrs-v1-1':false}}),/unknown/)
  assert.throws(()=>setup({followUpChoices:{depression:'false'}}),/boolean/)
  const s=setup({mode:'monitoring',followUpChoices:{depression:false,anxiety:false}})
  assert.equal(f.getSteps(s,brief).some(step=>step.id==='phq-9'),true)
  assert.equal(f.record(s,brief).symptoms[0].followUpDeferred,false)
})

test('a saved decision screen remains a valid recoverable draft',async()=>{
  const a=newAssessment(f.configuration,setup({followUpChoices:{anxiety:false}}),brief,notes,{phase:'followups',cursor:null})
  const restored=await verifyBundle({schemaVersion:1,current:a,history:[]})
  assert.equal(restored.current.workflow.phase,'followups')
  assert.equal(restored.current.setup.followUpChoices.anxiety,false)
})

test('deferred alcohol and trauma retain their brief scores and correctly identify the omitted full forms',()=>{
  const s=f.createSetup({context:'clinical',auditFee:'no',auditThreshold:3,topics:Object.fromEntries(f.catalog.map(row=>[row.id,['alcohol','trauma'].includes(row.id)])),followUpChoices:{alcohol:false,trauma:false}})
  const a={'audit-1':3,'audit-2':0,'audit-3':0,'pcptsd-exposure':'yes',...Object.fromEntries([1,2,3,4,5].map(n=>['pcptsd-'+n,'yes']))}
  const r=f.record(s,a)
  assert.equal(r.alcohol.gateScore,3)
  assert.equal(r.trauma.count,5)
  assert.equal(r.trauma.pcl,null)
  assert.equal(f.progress(s,a).finished,true)
  for(const output of [r.text,clinicalSummary(r),buildReport(r)]) {
    assert.match(output,/AUDIT-C.*3\/12/)
    assert.match(output,/not selected after initial screening/i)
    assert.doesNotMatch(output,/gate below threshold|Below gate/)
  }
})

test('deferred TAPS follow-ups retain independent negative brief branches without scoring stale positive branches',()=>{
  const s=f.createSetup({context:'clinical',topics:Object.fromEntries(f.catalog.map(row=>[row.id,row.id==='taps'])),forms:{taps:'female'},confirmations:{'taps:us-form':true},followUpChoices:{taps:false}})
  const a={'taps-brief-tobacco':4,'taps-brief-alcohol-female':4,'taps-brief-drugs':3,'taps-brief-prescription':4,'taps-cannabis-use':1,'taps-cannabis-a':1,'taps-cannabis-b':1}
  const r=f.record(s,a),taps=r.additional[0]
  assert.equal(f.progress(s,a).finished,true)
  assert.equal(taps.status,'omitted')
  assert.equal(taps.scales.find(row=>row.id==='tobacco').sum,0)
  assert.equal(taps.scales.find(row=>row.id==='cannabis').sum,null)
  assert.equal(taps.scales.find(row=>row.id==='cannabis').status,'omitted')
  assert.equal(r.responses['taps-cannabis-a'],1)
})

test('deferred supplemental modules retain explicit administration status without full scores',()=>{
  const s=f.createSetup({context:'clinical',topics:Object.fromEntries(f.catalog.map(row=>[row.id,['irritability','validity','mini-ipip'].includes(row.id)])),definedPatientGroup:true,scoresToClinician:true,scaleNotSold:true,followUpChoices:{irritability:false,validity:false,'mini-ipip':false}})
  const r=f.record(s,{})
  assert.equal(f.progress(s,{}).finished,true)
  assert.equal(r.stress.status,'omitted')
  assert.equal(r.validity.status,'omitted')
  assert.equal(r.additional[0].total,null)
  assert.ok(r.administration.every(row=>row.status==='omitted'))
  assert.equal(r.stress.raw,undefined)
})
