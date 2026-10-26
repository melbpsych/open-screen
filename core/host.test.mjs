import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createScreener } from '../api.js'
import { newAssessment, finaliseAssessment } from './assessment.js'
import { createHostBridge } from './host.js'
const context = {
  organisationId: '00000000-0000-0000-0000-000000000001',
  clientId: '00000000-0000-0000-0000-000000000002',
  practitionerId: '00000000-0000-0000-0000-000000000003',
  sessionId: '00000000-0000-0000-0000-000000000004',
  patientReference: 'SYNTHETIC',
  canWriteAssessments: true
}
async function fixture() {
  const f = createScreener(),
    s = f.createSetup({
      context: 'clinical',
      topics: Object.fromEntries(
        f.catalog.map((x) => [x.id, x.id === 'depression'])
      )
    }),
    a = {}
  while (f.nextStep(s, a)) a[f.nextStep(s, a).id] = 0
  return finaliseAssessment(
    newAssessment(
      f.configuration,
      s,
      a,
      { reference: 'SYNTHETIC' },
      { phase: 'record', cursor: null }
    ),
    'Synthetic reviewer'
  )
}
const receipt = (p) => ({
  status: 'stored',
  recordId: 'synthetic-stored',
  organisationId: p.target.organisationId,
  clientId: p.target.clientId,
  assessmentId: p.assessmentId,
  attestationDigest: p.attestationDigest,
  idempotencyKey: p.idempotencyKey
})
test('host saves are explicit, immutable, minimal by default and idempotently identified', async () => {
  const a = await fixture(),
    calls = []
  const b = createHostBridge({
    getContext: async () => context,
    persist: async (p) => {
      calls.push(p)
      return receipt(p)
    }
  })
  await b.save(a, context)
  await b.save(a, context)
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey)
  assert.equal(calls[0].record.responses, undefined)
  assert.ok(calls[0].record.configuration)
  assert.ok(Object.isFrozen(calls[0].record))
  await b.save(a, context, { includeResponses: true })
  assert.ok(calls[2].record.responses)
})
test('wrong patient, revoked permission, context changes and mismatched receipts fail closed', async () => {
  const a = await fixture()
  let writes = 0
  const b = createHostBridge({
    getContext: async () => ({
      ...context,
      clientId: '00000000-0000-0000-0000-000000000099'
    }),
    persist: async (p) => {
      writes++
      return receipt(p)
    }
  })
  await assert.rejects(b.save(a, context), /context changed/)
  assert.equal(writes, 0)
  await assert.rejects(
    b.save(a, { ...context, patientReference: 'OTHER' }),
    /do not match/
  )
  await assert.rejects(
    b.save(a, { ...context, canWriteAssessments: false }),
    /not authorised/
  )
  const bad = createHostBridge({
    getContext: async () => context,
    persist: async (p) => ({ ...receipt(p), clientId: 'other' })
  })
  await assert.rejects(bad.save(a, context), /did not acknowledge/)
})
