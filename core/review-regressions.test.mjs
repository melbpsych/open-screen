import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createScreener, exportJSON, ENGINE_VERSION, RULES_VERSION } from '../api.js'
import { questionnaires } from '../questionnaires/registry.js'
import example from '../examples/questionnaire.json' with { type: 'json' }
import { newAssessment, finaliseAssessment, verifyAssessment, verifyBundle, assessmentRecord } from './assessment.js'
import { safetyFindings, safetyResponseChange, preserveSafetyReview, reviewIssues } from './workflow.js'
import { clinicalSummary, buildReport, historyMarkup } from '../presentation.js'
import { historySeries } from './history.js'
import { freshSetup, mergeHistory, archiveParts } from './transitions.js'
import { sealFile, openFile, assertVaultCapacity, plaintextBytes, VAULT_PLAINTEXT_LIMIT } from './vault.js'
import { externalTotals } from './external-fields.js'
const f = createScreener({ questionnaires })
const setup = (topics = ['depression'], extra = {}, factory = f) => factory.createSetup({ context: 'clinical', topics: Object.fromEntries(factory.catalog.map(row => [row.id, topics.includes(row.id)])), ...extra })
const answers = { 'phq-1': 0, 'phq-2': 0 }
const clinician = extra => ({ reference: 'SYNTHETIC-REVIEW', safetyReview: 'Reviewed in interview', practice: { safetyMethod: 'Synthetic interview', safetyOutcome: 'Earlier synthetic outcome' }, ...extra })
const draft = (s = setup(), a = answers, c = clinician(), identity = {}, factory = f) => newAssessment(factory.configuration, s, a, c, { phase: 'record', cursor: null }, identity)
const final = async (s = setup(), a = answers, c = clinician(), identity = {}, at) => finaliseAssessment(draft(s,a,c,identity), 'Synthetic reviewer', at)

test('changed findings retain optional historical notes without blocking finalisation', async () => {
  const s = setup(), c = clinician()
  const prior = preserveSafetyReview(f.record(s, answers, c), '2026-10-30T01:00:00Z')
  const changed = { ...prior, flags: { suicide: 'Yes', harm: 'Yes', overdoseSedation: 'Yes', withdrawalNow: 'Yes' } }
  assert.equal(changed.safetyPriorReviews[0].outcome, 'Earlier synthetic outcome')
  const stale = f.record(s,answers,changed)
  assert.deepEqual(reviewIssues(stale),[])
  for (const output of [stale.text,clinicalSummary(stale),buildReport(stale),exportJSON(stale,{includeResponses:true})]) assert.match(output,/Recorded risk documentation is not linked to the current responses or observations/)
  await final(s,answers,changed)
  changed.safetyReviewedFindings = safetyFindings(answers,changed)
  assert.doesNotMatch(f.record(s,answers,changed).text,/Recorded risk documentation is not linked/)
  const accepted = await final(s,answers,changed)
  assert.equal(accepted.clinician.practice.safetyOutcome,'Earlier synthetic outcome')
  const revised = structuredClone(accepted)
  revised.review = { status: 'draft' }; revised.clinician.flags.suicide = 'No'
  await finaliseAssessment(revised,'Reviewer')
  revised.clinician.safetyReviewedFindings = safetyFindings(revised.answers,revised.clinician)
  await finaliseAssessment(revised,'Reviewer')
})

test('retained endorsement and correction provenance agree across every output', () => {
  for (const correction of [0, { missing: 'prefer-not-to-answer' }]) {
    let c = safetyResponseChange(clinician(), null, 1, '2026-10-30T01:00:00Z')
    c = safetyResponseChange(c, 1, correction, '2026-10-30T01:01:00Z')
    const r = f.record(setup(), { ...answers, 'phq-9': correction }, c)
    assert.equal(r.safetyFlag,true)
    for (const output of [r.text, clinicalSummary(r), buildReport(r), exportJSON(r,{includeResponses:true})]) {
      assert.match(output,/endorse|Endorse/)
      assert.match(output,/2026-10-30T01:01:00Z/)
      assert.match(output,/2026-10-30T01:00:00Z/)
    }
    assert.match(r.text,/Retained safety observation/)
    assert.equal(c.safetyEvents[1].from,1)
    const minimal=JSON.parse(exportJSON(r))
    assert.equal(minimal.clinician.safetyEvents,undefined)
    assert.equal(minimal.clinician.safetyReviewedFindings,undefined)
  }
})

test('later PC-PTSD, PCL and DASS items retain visible source recall periods', async () => {
  const s = setup(['trauma','irritability'],{ followUps:{trauma:true}, definedPatientGroup:true, scoresToClinician:true, scaleNotSold:true })
  const a = { 'pcptsd-exposure':'yes', ...Object.fromEntries([1,2,3,4,5].map(n=>['pcptsd-'+n,'no'])) }
  const steps = f.getSteps(s,a)
  assert.match(steps.find(q=>q.id==='pcptsd-2').stem,/past month/i)
  assert.match(steps.find(q=>q.id==='pcl-2').stem,/past month/i)
  assert.match(steps.find(q=>q.id==='dass-6').stem,/past week/i)
  const value = newAssessment(f.configuration,s,a,clinician(),{phase:'question',cursor:'pcl-2'})
  const restored = await verifyBundle({schemaVersion:1,current:value,history:[]})
  assert.match(f.getSteps(restored.current.setup,restored.current.answers).find(q=>q.id==='pcl-2').stem,/past month/i)
})

test('selected incomplete modules remain named in ordinary summary and HTML without an appendix', async () => {
  const s = setup(['irritability','validity','personality'], {definedPatientGroup:true,scoresToClinician:true,scaleNotSold:true})
  const a = {}
  for (let i=0;i<120;i++) {
    const q = f.nextStep(s,a)
    if (!q) break
    a[q.id] = q.kind==='text' ? '' : q.options.find(o=>o.value===3)?.value ?? q.options[0].value
  }
  for (const id of ['dass-1','valid-im-1','EXT7']) {
    const q = f.getSteps(s,a).find(q=>q.id===id)
    if(q) a[id]={missing:'prefer-not-to-answer'}
  }
  // Find actual response-pattern ID independently of its item wording.
  const validityId=f.getSteps(s,a).find(q=>q.instrument==='validity').id
  a[validityId]={missing:'prefer-not-to-answer'}
  const c = clinician(); c.practice.omissionsReviewed=true
  const r = assessmentRecord(await final(s,a,c))
  for (const output of [clinicalSummary(r),buildReport(r)]) {
    assert.match(output,/DASS-21 Stress: incomplete/)
    assert.match(output,/IPIP response patterns: incomplete/)
    assert.match(output,/Personality: incomplete/)
    assert.match(output,/explicitly missing/)
  }
  assert.equal(r.stress.raw,undefined)
})

test('external fixed-form totals reject invalid transcriptions throughout the API and finalisation boundary', async () => {
  // Independent fixed-form limits: deriving this oracle from externalTotals
  // would let an accidental range change pass its own regression test.
  const expected = { phq9: { min: 0, max: 27 }, gad7: { min: 0, max: 21 }, scoff: { min: 0, max: 5 }, sleep: { min: 0, max: 28 }, fourat: { min: 0, max: 12 }, epds: { min: 0, max: 30 } }
  assert.deepEqual(externalTotals, expected)
  for (const [id,{max}] of Object.entries(expected)) {
    for (const invalid of [-1,max+1,0.5,'999','NaN',' ','1.5']) {
      assert.throws(()=>f.record(setup(),answers,clinician({entered:{[id]:invalid}})),/whole-number/)
    }
    for (const valid of [0,max,String(max),'']) f.record(setup(),answers,clinician({entered:{[id]:valid}}))
  }
  const changed=structuredClone(draft())
  changed.clinician.entered={phq9:999}
  await assert.rejects(finaliseAssessment(changed,'Reviewer'),/whole-number/)
})

test('only verified immutable content can carry a Final reporting label', async () => {
  const original = await final()
  const record=assessmentRecord(original)
  assert.match(clinicalSummary(record),/Final · attested/)
  const mutated=structuredClone(original);mutated.clinician.facts='UNSIGNED EDIT'
  await assert.rejects(verifyAssessment(mutated),/does not match/)
  assert.throws(()=>assessmentRecord(mutated),/Verify the final/)
  const verified=await verifyAssessment(JSON.parse(JSON.stringify(original)))
  assert.match(buildReport(assessmentRecord(verified)),/Final · attested/)
  for(const output of [clinicalSummary(record,{...record.clinician,facts:'UNSIGNED EDIT'}),buildReport(record,{...record.clinician,facts:'UNSIGNED EDIT'})]) {
    assert.match(output,/Draft · unsigned/)
    assert.match(output,/UNSIGNED EDIT/)
    assert.doesNotMatch(output,/Final · attested/)
  }
  const forged=structuredClone(record);forged.clinician.facts='CLONED EDIT'
  assert.match(clinicalSummary(forged),/Draft · unsigned/)
})

test('offsets and equal instants have deterministic chronological history', async () => {
  const earlier=await final(setup(),answers,clinician(),{startedAt:'2026-10-25T10:00:00+11:00'})
  const later=await final(setup(),{'phq-1':1,'phq-2':0},clinician(),{startedAt:'2026-10-25T00:00:00Z'})
  const forward=historySeries([earlier,later]),reverse=historySeries([later,earlier])
  assert.deepEqual(forward,reverse)
  assert.deepEqual(forward[0].points.map(p=>p.value),[0,1])
  assert.match(historyMarkup(forward),/Latest 1/)
  const same=await final(setup(),answers,clinician(),{startedAt:'2026-10-25T11:00:00+11:00'})
  assert.deepEqual(historySeries([same,later]),historySeries([later,same]))
})

test('PCL event anchors split changed and unknown events without comparing narratives', async () => {
  const s=setup(['trauma'],{followUps:{trauma:true}})
  const traumaAnswers=(score,narrative)=>({'pcptsd-exposure':'yes', ...Object.fromEntries([1,2,3,4,5].map(n=>['pcptsd-'+n,'no'])), 'pcl-event':narrative, ...Object.fromEntries(Array.from({length:20},(_,i)=>['pcl-'+(i+1),score]))})
  const c=id=>clinician({practice:{...clinician().practice,...(id?{pclEventId:id}:{})}})
  const a=await final(s,traumaAnswers(3,'Synthetic narrative A'),c('event-a'))
  const b=await final(s,traumaAnswers(1,'Reworded same event'),c('event-a'))
  assert.equal(historySeries([a,b]).filter(g=>g.label==='PCL-5').length,1)
  const changed=await final(s,traumaAnswers(1,'Synthetic narrative B'),c('event-b'))
  assert.equal(historySeries([a,changed]).filter(g=>g.label==='PCL-5').length,2)
  const unknownA=await final(s,traumaAnswers(1,''),c())
  const unknownB=await final(s,traumaAnswers(1,''),c())
  const groups=historySeries([unknownA,unknownB]).filter(g=>g.label==='PCL-5')
  assert.equal(groups.length,2)
  assert.match(historyMarkup(groups),/continuity unverified/)
})

test('fresh setup discards foreign registry keys atomically and monitoring clears conditions', () => {
  const extended=createScreener({questionnaires:[...questionnaires,example]})
  const old=setup(['depression','example-checkin','irritability'],{definedPatientGroup:true,scoresToClinician:true,scaleNotSold:true},extended)
  const fresh=freshSetup(f,old)
  assert.equal(Object.hasOwn(fresh.topics,'example-checkin'),false)
  assert.equal(fresh.topics.depression,true)
  assert.equal(fresh.definedPatientGroup,true)
  f.getSteps(fresh,{})
  assert.equal(old.topics['example-checkin'],true)
  const monitoring=freshSetup(f,old,{monitoring:true})
  assert.equal(monitoring.definedPatientGroup,false)
  assert.deepEqual(monitoring.forms,{})
  assert.deepEqual(monitoring.confirmations,{})
})

test('history preflight rejects unsavable additions while encrypted archives retain every record', async () => {
  const records=[]
  for(let i=0;i<36;i++) records.push(await final(setup(),answers,clinician({facts:'Synthetic note '.padEnd(20000,'x')})))
  const current=draft(setup(),answers,clinician({facts:'Synthetic current'.padEnd(20000,'x')}))
  const bundle=await verifyBundle({schemaVersion:1,current,history:records})
  assert.ok(plaintextBytes(bundle)>VAULT_PLAINTEXT_LIMIT)
  assert.throws(()=>assertVaultCapacity(bundle),/Archive/)
  const prior=records.slice(0,30)
  const incoming={schemaVersion:1,current:records.at(-1),history:records.slice(30,-1)}
  assert.throws(()=>mergeHistory(current,prior,incoming),/Archive/)
  assert.equal(prior.length,30)
  const parts=await archiveParts(bundle)
  assert.ok(parts.length>1)
  const all=[]
  for(const part of parts) {
    assertVaultCapacity(part)
    const encrypted=await sealFile(part,'Synthetic archive passphrase')
    const recovered=await verifyBundle(await openFile(encrypted,'Synthetic archive passphrase'))
    all.push(recovered.current,...recovered.history)
  }
  assert.deepEqual(all.map(a=>a.id).sort(),[current,...records].map(a=>a.id).sort())
})

test('every representation identifies the captured engine and rules release', () => {
  const r=f.record(setup(),answers,clinician())
  for(const output of [r.text,clinicalSummary(r),buildReport(r),exportJSON(r)]) {
    assert.ok(output.includes(ENGINE_VERSION))
    assert.ok(output.includes(RULES_VERSION))
    assert.ok(!output.includes('Application rules: 2026-10-26'))
  }
})

test('an exposure stop is not represented as a completed symptom administration', () => {
  const r=f.record(setup(['trauma']),{'pcptsd-exposure':'no'},clinician())
  assert.equal(r.administration[0].status,'omitted')
  assert.equal(r.administration[0].answered,1)
  assert.match(clinicalSummary(r),/Trauma: not administered/)
  assert.match(buildReport(r),/Exposure not endorsed; symptom questions were not administered/)
})

test('a correction trail alone retains an earlier positive observation', () => {
  const r=f.record(setup(),answers,clinician({safetyEvents:[{at:'2026-10-30T01:00:00Z',from:1,to:0,reason:'Synthetic correction'}]}))
  assert.equal(r.safetyFlag,true)
  assert.match(r.text,/earlier PHQ-9 item 9 endorsement/)
})


test('concise notes show each brief score once without technical or irrelevant forensic copy', () => {
  const s=setup(['depression','anxiety','trauma'])
  const r=f.record(s,{'phq-1':0,'phq-2':0,'gad-1':0,'gad-2':0,'pcptsd-exposure':'no'})
  const note=clinicalSummary(r,undefined,{concise:true})
  assert.equal(note.match(/PHQ-2/g).length,1)
  assert.equal(note.match(/GAD-2/g).length,1)
  assert.match(note,/PHQ-2: 0\/6/)
  assert.match(note,/GAD-2: 0\/6/)
  assert.match(note,/not administered \(exposure not endorsed\)/)
  assert.match(note,/No PCL-5 score/)
  assert.match(note,/Draft/)
  assert.doesNotMatch(note,/Safety review: not recorded/)
  assert.match(note,/Negative screens do not exclude/)
  assert.doesNotMatch(note,/Engine:|Policy:|Assessment:|forensic|current-path/)
  assert.match(clinicalSummary(r),/Engine:/)
  assert.ok(note.length < clinicalSummary(r).length)
})

test('concise notes retain safety amendments, clinician findings, missingness and plans', () => {
  const s=setup(),a={...answers,'phq-9':{missing:'prefer-not-to-answer'}}
  let c=safetyResponseChange(clinician(),null,1,'2026-10-30T01:00:00Z')
  c=safetyResponseChange(c,1,a['phq-9'],'2026-10-30T01:01:00Z')
  c.facts='Synthetic note for the clinical record'
  c.practice.followUpAction='Synthetic follow-up';c.practice.followUpOwner='Synthetic clinician';c.practice.followUpDue='2026-11-01'
  c.flags={harm:'Yes'}
  const note=clinicalSummary(f.record(s,a,c),undefined,{concise:true})
  for(const fragment of ['PHQ-9 item 9','Retained safety observation','2026-10-30T01:00:00Z','2026-10-30T01:01:00Z',c.facts,c.practice.followUpAction,c.practice.followUpOwner,c.practice.followUpDue]) assert.ok(note.includes(fragment),fragment)
  assert.match(note,/harm|Harm/)
})

test('concise notes name unscorable supplemental modules and preserve custom settings', () => {
  const custom=createScreener({policy:{...f.policy,id:'practice-custom',rationale:'Synthetic custom gate',thresholds:{...f.policy.thresholds,depression:{...f.policy.thresholds.depression,gate:3}}}})
  const s=setup(['irritability'],{definedPatientGroup:true,scoresToClinician:true,scaleNotSold:true},custom)
  const a=Object.fromEntries(custom.getSteps(s,{}).slice(0,6).map(step=>[step.id,0]))
  const note=clinicalSummary(custom.record(s,a),undefined,{concise:true})
  assert.match(note,/DASS-21 Stress: incomplete/)
  assert.match(note,/6\/7/)
  assert.match(note,/Synthetic custom gate/)
})

test('concise final labels require verified content and forensic limits stay contextual', async () => {
  const checked=await final(),r=assessmentRecord(checked)
  assert.match(clinicalSummary(r,undefined,{concise:true}),/Final · attested/)
  const edited=clinicalSummary(r,{...r.clinician,facts:'Unsigned change'},{concise:true})
  assert.match(edited,/Draft · unsigned/)
  assert.match(edited,/Unsigned change/)
  const s=setup(['depression'],{context:'forensic'})
  assert.match(clinicalSummary(f.record(s,answers),undefined,{concise:true}),/not calibrated for forensic decisions/)
})

test('concise full results retain the brief score and separate functional impact', () => {
  const s=setup(['depression']),a={...Object.fromEntries(Array.from({length:9},(_,i)=>['phq-'+(i+1),0])),'phq-1':2,'phq-difficulty':2}
  const note=clinicalSummary(f.record(s,a),undefined,{concise:true})
  assert.match(note,/PHQ-9: 2\/27/)
  assert.match(note,/PHQ-2 2\/6/)
  assert.match(note,/Follow-up ≥2/)
  assert.match(note,/Functional impact: very difficult/)
})
