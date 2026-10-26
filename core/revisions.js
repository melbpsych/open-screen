/** A single localStorage value holds journal and active pointer, so quota errors
 * cannot leave a new active policy without its review record. Not authentication
 * or tamper-proof audit: a receiving host must enforce its own roles and audit.
 */
import { createScreener } from '../api.js'
import { object, text, list, immutableCopy } from './validation.js'
import { configurePractice, restorePractice } from './practice.js'
import { timestamp } from './assessment.js'
export function validateJournal(base, value) {
  object(value, 'Settings journal', ['schemaVersion', 'active', 'revisions'])
  if (
    value.schemaVersion !== 2 ||
    (value.active !== null && typeof value.active !== 'string')
  )
    throw new TypeError('Invalid settings journal')
  list(value.revisions, 'Settings revisions', 20)
  const ids = new Set()
  for (const r of value.revisions) {
    object(r, 'Settings revision', [
      'id',
      'name',
      'createdAt',
      'preferences',
      'review'
    ])
    if (
      typeof r.id !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
        r.id
      ) ||
      ids.has(r.id)
    )
      throw new TypeError('Invalid revision identity')
    ids.add(r.id)
    text(r.name, 'Revision name', 80)
    timestamp(r.createdAt)
    if (r.preferences !== null) restorePractice(base, r.preferences)
    if (r.review !== null) {
      object(r.review, 'Revision review', ['by', 'at'])
      text(r.review.by, 'Reviewer', 200)
      timestamp(r.review.at)
    }
  }
  if (
    value.active !== null &&
    !value.revisions.some((r) => r.id === value.active && r.review)
  )
    throw new TypeError('Active settings require a reviewed revision')
  return immutableCopy(value)
}
export function emptyJournal() {
  return { schemaVersion: 2, active: null, revisions: [] }
}
export function stageRevision(
  base,
  journal,
  { overrides, reason, name },
  now = new Date().toISOString()
) {
  validateJournal(base, journal)
  text(name, 'Revision name', 80)
  timestamp(now)
  if (journal.revisions.length >= 20)
    throw new TypeError(
      'Settings journal is full (20 revisions). Export it and ask your deployment administrator to archive it before adding revisions.'
    )
  const { preferences } = configurePractice(base, overrides, reason, now)
  return validateJournal(base, {
    ...journal,
    revisions: [
      ...journal.revisions,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: now,
        preferences,
        review: null
      }
    ]
  })
}
export function activateRevision(
  base,
  journal,
  id,
  by,
  now = new Date().toISOString()
) {
  validateJournal(base, journal)
  text(by, 'Reviewing clinician', 200)
  timestamp(now)
  const target = journal.revisions.find((r) => r.id === id)
  if (!target) throw new TypeError('Settings revision is unavailable')
  if (target.review)
    throw new TypeError(
      'Reviewed revisions are immutable. Create a new draft to reactivate earlier values.'
    )
  return validateJournal(base, {
    ...journal,
    active: id,
    revisions: journal.revisions.map((r) =>
      r.id === id ? { ...r, review: { by: by.trim(), at: now } } : r
    )
  })
}

/** Compose before persistence as well as on load. Long review metadata must not
 * turn a valid activated journal into an unreadable policy. Full values remain
 * in the immutable configuration and journal when the prose summary is bounded.
 */
export function revisionState(base, input) {
  const journal = validateJournal(base, input)
  const active = journal.revisions.find((r) => r.id === journal.active)
  const result = active?.preferences
    ? restorePractice(base, active.preferences)
    : { screener: base, preferences: null, changes: [] }
  if (!active?.preferences) return result
  const prefix = `Revision: ${active.name}. Reviewed by ${active.review.by} at ${active.review.at}. `
  const original = result.screener.policy.rationale
  const suffix =
    '… See the configuration snapshot and journal for complete settings.'
  const available = 4000 - prefix.length
  const rationale =
    prefix +
    (original.length > available
      ? original.slice(0, available - suffix.length) + suffix
      : original)
  return {
    ...result,
    screener: createScreener({
      questionnaires: result.screener.configuration.questionnaires,
      policy: {
        ...result.screener.policy,
        rationale,
        version: `revision-${active.id}`
      }
    })
  }
}
