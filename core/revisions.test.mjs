import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createScreener } from '../api.js'
import {
  emptyJournal,
  stageRevision,
  activateRevision,
  validateJournal
} from './revisions.js'
const base = createScreener()
test('staging never activates; explicit review captures identity, locks version and keeps predecessors', () => {
  const draft = stageRevision(base, emptyJournal(), {
    overrides: { 'depression.gate': 3 },
    reason: 'Synthetic verification',
    name: 'Intake v2'
  })
  assert.equal(draft.active, null)
  const id = draft.revisions[0].id
  assert.throws(
    () => activateRevision(base, draft, id, ''),
    /Reviewing clinician/
  )
  const active = activateRevision(base, draft, id, 'Synthetic reviewer')
  assert.equal(active.active, id)
  assert.equal(active.revisions[0].review.by, 'Synthetic reviewer')
  assert.throws(() => activateRevision(base, active, id, 'Other'), /immutable/)
  const next = stageRevision(base, active, {
    overrides: { 'depression.gate': 4 },
    reason: 'Different',
    name: 'Next'
  })
  assert.equal(next.active, id)
  assert.equal(next.revisions.length, 2)
  assert.throws(
    () => validateJournal(base, { ...draft, active: id }),
    /reviewed/
  )
})

test('long legitimate source/review metadata remains a readable bounded active policy', async () => {
  const { revisionState } = await import('./revisions.js')
  const example = (
    await import('../examples/questionnaire.json', { with: { type: 'json' } })
  ).default
  const definitions = Array.from({ length: 25 }, (_, i) => ({
    ...structuredClone(example),
    id: `synthetic-${i}`,
    label: 'Synthetic ' + String(i) + ' ' + 'x'.repeat(100),
    items: example.items.map((item, j) => ({
      ...item,
      id: `synthetic-${i}-${j}`
    }))
  }))
  const policy = structuredClone(base.policy)
  policy.id = 'a'.repeat(80)
  policy.version = 'v'.repeat(80)
  const expanded = createScreener({ policy, questionnaires: definitions })
  const draft = stageRevision(expanded, emptyJournal(), {
    overrides: Object.fromEntries(definitions.map((q) => [q.id + '.gate', 0])),
    reason: 'r'.repeat(600),
    name: 'n'.repeat(80)
  })
  const active = activateRevision(
    expanded,
    draft,
    draft.revisions[0].id,
    'c'.repeat(200)
  )
  const result = revisionState(expanded, active)
  assert.ok(result.screener.policy.rationale.length <= 4000)
  assert.ok(result.screener.policy.rationale.includes('r'.repeat(600)))
  assert.equal(result.changes.length, 25)
})
