/** Validated raw assessments are the source of truth. Imported derived scores
 * are never trusted. Finalisation records a local attestation, not identity auth.
 */
import { reviewErrors } from './workflow.js'
import { createScreener, ENGINE_VERSION, RULES_VERSION } from '../api.js'
import { object, text, immutableCopy, list } from './validation.js'
export const timestamp = (value) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d\d-\d\dT/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new TypeError('Invalid assessment date')
  return value
}
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonical(value[k]))
        .join(',') +
      '}'
    )
  return JSON.stringify(value)
}
export function assessmentContent(value) {
  return canonical({
    id: value.id,
    startedAt: value.startedAt,
    configuration: value.configuration,
    setup: value.setup,
    answers: value.answers,
    clinician: value.clinician
  })
}
export async function digest(value) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
    )
  ]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
}
export function assessmentFactory(value) {
  object(value.configuration, 'Captured configuration', [
    'engineVersion',
    'rulesVersion',
    'policy',
    'questionnaires'
  ])
  if (
    value.configuration.engineVersion !== ENGINE_VERSION ||
    value.configuration.rulesVersion !== RULES_VERSION
  )
    throw new TypeError(
      'This file requires its original engine/rules version. Do not silently rescore it with a different release.'
    )
  return createScreener({
    policy: value.configuration.policy,
    questionnaires: value.configuration.questionnaires,
    clock: () =>
      value.review.status === 'final' ? value.review.at : value.updatedAt
  })
}
export function validateAssessment(value) {
  object(value, 'Assessment', [
    'schemaVersion',
    'id',
    'startedAt',
    'updatedAt',
    'configuration',
    'setup',
    'answers',
    'clinician',
    'workflow',
    'review'
  ])
  if (
    value.schemaVersion !== 1 ||
    typeof value.id !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
      value.id
    )
  )
    throw new TypeError('Unsupported assessment identity/schema')
  timestamp(value.startedAt)
  timestamp(value.updatedAt)
  if (Date.parse(value.updatedAt) < Date.parse(value.startedAt))
    throw new TypeError('Assessment dates are out of order')
  object(
    value.review,
    'Review',
    value.review?.status === 'final'
      ? ['status', 'by', 'at', 'digest']
      : ['status']
  )
  if (!['draft', 'final'].includes(value.review.status))
    throw new TypeError('Invalid review state')
  if (value.review.status === 'final') {
    text(value.review.by, 'Clinician name', 200)
    timestamp(value.review.at)
    if (!/^[a-f0-9]{64}$/.test(value.review.digest))
      throw new TypeError('Invalid attestation digest')
  }
  object(value.workflow, 'Workflow', ['phase', 'cursor'])
  if (
    !['setup', 'question', 'safety', 'handoff', 'record'].includes(
      value.workflow.phase
    ) ||
    (value.workflow.cursor !== null &&
      typeof value.workflow.cursor !== 'string')
  )
    throw new TypeError('Invalid saved workflow')
  const factory = assessmentFactory(value)
  factory.createSetup(value.setup)
  // A null setting is valid for a saved setup. record() also validates notes.
  factory.record(
    { ...value.setup, context: value.setup.context || 'clinical' },
    value.answers,
    value.clinician
  )
  if (
    value.workflow.cursor !== null &&
    !factory
      .getSteps(value.setup, value.answers)
      .some((s) => s.id === value.workflow.cursor)
  )
    throw new TypeError('Saved question is not in this pathway')
  const progress = factory.progress(value.setup, value.answers)
  if (
    (value.workflow.phase === 'handoff' || value.review.status === 'final') &&
    !progress.finished
  )
    throw new TypeError('Incomplete assessment cannot be reviewed as complete')
  if (value.review.status === 'final') {
    if (
      value.setup.context === null ||
      value.updatedAt !== value.review.at ||
      Date.parse(value.review.at) < Date.parse(value.startedAt)
    )
      throw new TypeError('Invalid final record setting/date')
    const record = factory.record(value.setup, value.answers, value.clinician)
    const errors = reviewErrors(record)
    if (errors.length) throw new TypeError(errors.join(" "))
    if (
      record.safetyFlag &&
      !['Reviewed in interview', 'Follow-up required'].includes(
        value.clinician.safetyReview
      )
    )
      throw new TypeError(
        'Final record requires a recorded direct safety review'
      )
  }
  return immutableCopy(value)
}
export async function verifyAssessment(value) {
  const checked = validateAssessment(value)
  if (
    checked.review.status === 'final' &&
    (await digest(
      canonical({
        content: assessmentContent(checked),
        by: checked.review.by,
        at: checked.review.at
      })
    )) !== checked.review.digest
  )
    throw new TypeError('The final attestation does not match this assessment')
  return checked
}
export function newAssessment(
  configuration,
  setup,
  answers,
  clinician,
  workflow,
  identity = {}
) {
  const now = new Date().toISOString()
  return validateAssessment({
    schemaVersion: 1,
    id: identity.id || crypto.randomUUID(),
    startedAt: identity.startedAt || now,
    updatedAt: now,
    configuration,
    setup,
    answers,
    clinician,
    workflow,
    review: { status: 'draft' }
  })
}
export async function finaliseAssessment(
  value,
  by,
  at = new Date().toISOString()
) {
  text(by, 'Clinician name', 200)
  timestamp(at)
  const checked = validateAssessment(value),
    factory = assessmentFactory(checked)
  if (!factory.progress(checked.setup, checked.answers).finished)
    throw new TypeError('Complete the selected questions before finalising.')
  const record = factory.record(
    checked.setup,
    checked.answers,
    checked.clinician
  )
  if (
    record.safetyFlag &&
    !['Reviewed in interview', 'Follow-up required'].includes(
      checked.clinician.safetyReview
    )
  )
    throw new TypeError('Record a direct safety review before finalising.')
  const errors = reviewErrors(record)
  if (errors.length) throw new TypeError(errors.join(" "))
  return verifyAssessment({
    ...checked,
    updatedAt: at,
    review: {
      status: 'final',
      by: by.trim(),
      at,
      digest: await digest(
        canonical({ content: assessmentContent(checked), by: by.trim(), at })
      )
    }
  })
}
export function assessmentRecord(value) {
  const checked = validateAssessment(value)
  return immutableCopy({
    ...assessmentFactory(checked).record(
      checked.setup,
      checked.answers,
      checked.clinician
    ),
    assessment: {
      id: checked.id,
      startedAt: checked.startedAt,
      updatedAt: checked.updatedAt,
      review: checked.review
    }
  })
}
export async function verifyBundle(value) {
  object(value, 'Sitting file', ['schemaVersion', 'current', 'history'])
  if (value.schemaVersion !== 1)
    throw new TypeError('Unsupported sitting file version')
  list(value.history, 'History', 40)
  const current = await verifyAssessment(value.current),
    history = []
  for (const row of value.history) {
    const checked = await verifyAssessment(row)
    if (checked.review.status !== 'final')
      throw new TypeError('History must contain final assessments')
    if (
      checked.clinician.reference !== current.clinician.reference ||
      (!current.clinician.reference?.trim() && checked.id !== current.id)
    )
      throw new TypeError(
        'History must have the same nonempty patient reference'
      )
    history.push(checked)
  }
  if (history.length + (current.review.status === 'final' ? 1 : 0) > 40)
    throw new TypeError('A sitting file holds at most 40 final records')
  const keys = history.map((row) => row.id + ':' + row.review.digest)
  if (current.review.status === 'final')
    keys.push(current.id + ':' + current.review.digest)
  if (new Set(keys).size !== keys.length)
    throw new TypeError('Duplicate history entry')
  return immutableCopy({ schemaVersion: 1, current, history })
}
