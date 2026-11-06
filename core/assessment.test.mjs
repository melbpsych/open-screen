import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createScreener } from '../api.js'
import {
  newAssessment,
  finaliseAssessment,
  verifyAssessment,
  verifyBundle,
  assessmentRecord
} from './assessment.js'
import { historySeries } from './history.js'
import { validateTemplates, templateSetup } from './templates.js'
const f = createScreener()
function example(ref = 'SYNTHETIC', full = false) {
  const s = f.createSetup({
      context: 'clinical',
      topics: Object.fromEntries(
        f.catalog.map((x) => [x.id, x.id === 'depression'])
      )
    }),
    a = {}
  if (full) s.followUps.depression = true
  while (f.nextStep(s, a)) a[f.nextStep(s, a).id] = 0
  return newAssessment(
    f.configuration,
    s,
    a,
    { reference: ref, flags: {}, entered: {}, facts: '', safetyReview: 'Reviewed in interview', practice: { safetyMethod: 'Synthetic direct interview', safetyOutcome: 'Synthetic outcome' } },
    { phase: 'record', cursor: null }
  )
}
test('final attestation binds notes/configuration and imported scores are recomputed', async () => {
  const a = await finaliseAssessment(example(), 'Synthetic clinician')
  assert.equal(assessmentRecord(a).assessment.review.status, 'final')
  const edited = structuredClone(a)
  edited.clinician.facts = 'changed'
  await assert.rejects(verifyAssessment(edited), /does not match/)
  const bad = structuredClone(a)
  bad.scores = { total: 99 }
  assert.throws(() => assessmentRecord(bad), /unknown field/)
  const older = structuredClone(a)
  older.configuration.engineVersion = '0.0.1'
  assert.throws(() => assessmentRecord(older), /original engine/)
})
test('question completion and patient-matched history remain enforced with optional risk notes', async () => {
  const a = structuredClone(example())
  delete a.answers['phq-2']
  a.workflow.phase = 'question'
  await assert.rejects(finaliseAssessment(a, 'Clinician'), /Complete/)
  const b = structuredClone(example('SYNTHETIC', true))
  b.clinician.safetyReview = null
  b.answers['phq-9'] = 1
  b.answers['phq-difficulty'] = 0
  const completed = await finaliseAssessment(b, 'Clinician')
  assert.equal(assessmentRecord(completed).safetyFlag,true)
  const first = await finaliseAssessment(example(), 'Clinician'),
    other = await finaliseAssessment(example('OTHER'), 'Clinician')
  await assert.rejects(
    verifyBundle({ schemaVersion: 1, current: first, history: [other] }),
    /same nonempty patient/
  )
  await assert.rejects(
    verifyBundle({ schemaVersion: 1, current: first, history: [first, first] }),
    /Duplicate/
  )
})
test('history separates brief/full and detects settings differences', async () => {
  const a = await finaliseAssessment(example(), 'Clinician'),
    b = await finaliseAssessment(example('SYNTHETIC', true), 'Clinician')
  assert.deepEqual(
    historySeries([a, b])
      .map((x) => x.label)
      .sort(),
    ['PHQ-2', 'PHQ-9']
  )
  assert.throws(
    () =>
      historySeries([
        a,
        { ...a, clinician: { ...a.clinician, reference: 'OTHER' } }
      ]),
    /do not match/
  )
})
test('templates preserve choices only and clear permissions/forms', () => {
  const row = { name: 'Intake', context: 'clinical', topics: ['depression'] }
  const s = templateSetup(row, f)
  assert.equal(s.topics.depression, true)
  assert.deepEqual(s.confirmations, {})
  assert.throws(
    () => validateTemplates([{ ...row, reference: 'PATIENT' }], f),
    /unknown/
  )
  assert.throws(
    () => validateTemplates([row, { ...row, name: ' intake ' }], f),
    /unique/
  )
})

test('attestation binds reviewer/date, revisions do not become repeated measurements, blank-reference revisions remain recoverable', async () => {
  const a = await finaliseAssessment(example(), 'Clinician')
  const name = structuredClone(a)
  name.review.by = 'Someone else'
  await assert.rejects(verifyAssessment(name), /does not match/)
  const date = structuredClone(a)
  date.review.at = new Date(Date.parse(a.review.at) + 1000).toISOString()
  date.updatedAt = date.review.at // Remain structurally valid; exercise the digest check.
  await assert.rejects(verifyAssessment(date), /does not match/)
  const changed = structuredClone(a)
  changed.review = { status: 'draft' }
  changed.clinician.facts = 'Corrected plan'
  const b = await finaliseAssessment(
    changed,
    'Clinician',
    new Date(Date.parse(a.review.at) + 1000).toISOString()
  )
  assert.equal(historySeries([a, b])[0].points.length, 1)
  const blank = await finaliseAssessment(example(''), 'Clinician')
  const draft = { ...blank, review: { status: 'draft' } }
  await verifyBundle({ schemaVersion: 1, current: draft, history: [blank] })
  assert.deepEqual(historySeries([blank]), [])
})

test('matching raw instruments disclose changed interpretation policies', async () => {
  const first = await finaliseAssessment(example(), 'Clinician')
  const changed = structuredClone(example())
  changed.configuration.policy.thresholds.depression.gate = 3
  changed.configuration.policy.version = 'synthetic-change'
  changed.configuration.policy.rationale = 'Synthetic altered gate'
  const second = await finaliseAssessment(changed, 'Clinician')
  const series = historySeries([first, second])
  assert.equal(series.length, 1)
  assert.equal(series[0].points.length, 2)
  assert.equal(series[0].settingsChanged, true)
})

test('optional undefined properties survive JSON recovery without invalidating final content', async () => {
  const value = structuredClone(example())
  value.clinician.facts = undefined
  const final = await finaliseAssessment(value, 'Clinician')
  await verifyAssessment(JSON.parse(JSON.stringify(final)))
})
