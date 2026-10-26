import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createScreener } from '../api.js'
import { newAssessment, finaliseAssessment } from './assessment.js'
import { createHostBridge, HostSaveError } from './host.js'
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
  practitionerId: p.target.practitionerId,
  sessionId: p.target.sessionId,
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

test('receipts must identify the exact session/practitioner and transport failures remain uncertain', async () => {
  const a = await fixture()
  for (const field of [
    'organisationId',
    'clientId',
    'practitionerId',
    'sessionId',
    'assessmentId',
    'attestationDigest',
    'idempotencyKey'
  ]) {
    const bridge = createHostBridge({
      getContext: async () => context,
      persist: async (p) => ({ ...receipt(p), [field]: 'wrong' })
    })
    await assert.rejects(
      bridge.save(a, context),
      (e) => e instanceof HostSaveError && e.code === 'WRITE_UNCONFIRMED'
    )
  }
  let writes = 0
  const lost = createHostBridge({
    getContext: async () => context,
    persist: async () => {
      writes++
      throw new Error('SYNTHETIC transport body must not escape')
    }
  })
  await assert.rejects(
    lost.save(a, context),
    (e) => e.code === 'WRITE_UNCONFIRMED' && !e.message.includes('SYNTHETIC')
  )
  assert.equal(writes, 1)
})

test('acknowledged storage survives receipt mutation and has a distinct post-write context outcome', async () => {
  const a = await fixture()
  for (const after of [
    async () => ({
      ...context,
      sessionId: '00000000-0000-0000-0000-000000000099'
    }),
    async () => ({ ...context, canWriteAssessments: false }),
    async () => {
      throw new Error('SYNTHETIC context failure')
    }
  ]) {
    let reads = 0,
      writes = 0
    const bridge = createHostBridge({
      getContext: async () => (++reads === 1 ? context : after()),
      persist: async (p) => {
        writes++
        return receipt(p)
      }
    })
    await assert.rejects(
      bridge.save(a, context),
      (e) =>
        e instanceof HostSaveError &&
        e.code === 'STORED_CONTEXT_UNCONFIRMED' &&
        !e.message.includes('SYNTHETIC')
    )
    assert.equal(writes, 1)
  }
  let reads = 0,
    received
  const bridge = createHostBridge({
    getContext: async () => {
      if (++reads > 1) received.sessionId = 'mutated'
      return context
    },
    persist: async (p) => {
      received = receipt(p)
      return received
    }
  })
  assert.equal((await bridge.save(a, context)).sessionId, context.sessionId)
})
