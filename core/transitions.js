/** Validated proposals. Callers commit these only after every check succeeds. */
import { verifyBundle } from './assessment.js'
import { assertVaultCapacity, plaintextBytes, VAULT_PLAINTEXT_LIMIT } from './vault.js'

export function rebaseSetup(factory, previous) {
  const ids = new Set(factory.catalog.map(row => row.id))
  const known = map => Object.fromEntries(Object.entries(map || {}).filter(([key]) => ids.has(key)))
  const candidate = factory.createSetup({ ...previous, topics: known(previous.topics), followUps: known(previous.followUps), followUpChoices: {}, confirmations: {}, forms: {},
    auditThreshold: factory.policy.thresholds.alcohol.allowed.includes(previous.auditThreshold) ? previous.auditThreshold : null })
  // Deployment changes invalidate sitting-specific confirmations and form choices.
  return candidate
}
export function freshSetup(factory, previous, { monitoring = false } = {}) {
  const rebased = rebaseSetup(factory, previous)
  const topics = Object.values(rebased.topics).some(Boolean) ? rebased.topics : factory.createSetup().topics
  return factory.createSetup({ context: rebased.context, advanceMode: rebased.advanceMode,
    mode: monitoring ? 'monitoring' : 'screening', topics,
    ...(monitoring ? {} : { auditFee: rebased.auditFee, definedPatientGroup: rebased.definedPatientGroup, scoresToClinician: rebased.scoresToClinician, scaleNotSold: rebased.scaleNotSold }) })
}
export function mergeHistory(current, history, incoming) {
  if (!current.clinician.reference?.trim() || incoming.current.clinician.reference !== current.clinician.reference) throw new Error('History requires the same nonempty patient reference as this assessment.')
  const additions = [...incoming.history, ...(incoming.current.review.status === 'final' ? [incoming.current] : [])]
  if (!additions.length) throw new Error('This file has no final assessments to add.')
  const key = a => a.id + ':' + a.review.digest
  const merged = new Map(history.map(a => [key(a), a]))
  for (const a of additions) {
    if (a.clinician.reference !== current.clinician.reference) throw new Error('History patient references do not match')
    if (!(current.review.status === 'final' && key(current) === key(a))) merged.set(key(a), a)
  }
  const next = [...merged.values()]
  if (next.length + (current.review.status === 'final' ? 1 : 0) > 40) throw new Error('An assessment file holds at most 40 final records. Archive the history before adding more.')
  assertVaultCapacity({ schemaVersion: 1, current, history: next })
  return next
}
/** Every part is independently recoverable; no history is discarded. */
export async function archiveParts(bundle) {
  const checked = await verifyBundle(bundle), parts = []
  let current = checked.current, history = []
  assertVaultCapacity({ schemaVersion: 1, current, history })
  for (const row of checked.history) {
    const candidate = { schemaVersion: 1, current, history: [...history, row] }
    if (plaintextBytes(candidate) <= VAULT_PLAINTEXT_LIMIT) history.push(row)
    else {
      parts.push(Object.freeze({ schemaVersion: 1, current, history: Object.freeze(history) }))
      current = row; history = []
      assertVaultCapacity({ schemaVersion: 1, current, history })
    }
  }
  parts.push(Object.freeze({ schemaVersion: 1, current, history: Object.freeze(history) }))
  return parts
}
