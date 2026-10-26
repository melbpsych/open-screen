/** Transport-free host boundary. The host owns authenticated access, tenant/RLS,
 * revocation, encrypted persistence, audit and atomic idempotency enforcement.
 * Browser assertions are not authorisation. Never infer identity from a URL.
 */
import { verifyAssessment, assessmentRecord, canonical } from './assessment.js'
import { exportJSON } from '../api.js'
import { object, text, immutableCopy } from './validation.js'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function validateHostContext(value) {
  object(value, 'Host context', [
    'organisationId',
    'clientId',
    'practitionerId',
    'sessionId',
    'patientReference',
    'canWriteAssessments'
  ])
  for (const k of ['organisationId', 'clientId', 'practitionerId', 'sessionId'])
    if (typeof value[k] !== 'string' || !uuid.test(value[k]))
      throw new TypeError('Invalid host identity')
  text(value.patientReference, 'Host patient reference', 200)
  if (value.canWriteAssessments !== true)
    throw new Error('The host has not authorised assessment writes.')
  return immutableCopy(value)
}
export function createHostBridge({ getContext, persist }) {
  if (typeof getContext !== 'function' || typeof persist !== 'function')
    throw new TypeError(
      'The host must supply context and persistence callbacks'
    )
  return Object.freeze({
    async save(assessment, expectedContext, { includeResponses = false } = {}) {
      if (typeof includeResponses !== 'boolean')
        throw new TypeError('Choose whether to include responses explicitly')
      const expected = validateHostContext(expectedContext),
        checked = await verifyAssessment(assessment)
      if (checked.review.status !== 'final')
        throw new Error('Finalise this assessment before saving to the host.')
      if (checked.clinician.reference !== expected.patientReference)
        throw new Error(
          'The assessment and host patient references do not match.'
        )
      const live = validateHostContext(await getContext())
      if (canonical(live) !== canonical(expected))
        throw new Error(
          'The host context changed. Reconfirm the practice, client and session.'
        )
      const idempotencyKey = `open-screen:${checked.id}:${checked.review.digest}`
      const payload = immutableCopy({
        schemaVersion: 1,
        source: 'open-screen',
        target: expected,
        idempotencyKey,
        assessmentId: checked.id,
        attestationDigest: checked.review.digest,
        record: JSON.parse(
          exportJSON(assessmentRecord(checked), { includeResponses })
        )
      })
      // The receiving transaction must compare target with its authenticated
      // context and enforce idempotency; this callback must not queue blindly.
      const receipt = await persist(payload)
      object(receipt, 'Persistence receipt', [
        'status',
        'recordId',
        'organisationId',
        'clientId',
        'assessmentId',
        'attestationDigest',
        'idempotencyKey'
      ])
      text(receipt.recordId, 'Stored record ID', 200)
      if (
        receipt.status !== 'stored' ||
        receipt.organisationId !== expected.organisationId ||
        receipt.clientId !== expected.clientId ||
        receipt.assessmentId !== checked.id ||
        receipt.attestationDigest !== checked.review.digest ||
        receipt.idempotencyKey !== idempotencyKey
      )
        throw new Error(
          'The host did not acknowledge this exact assessment and patient. Check its record before retrying.'
        )
      const after = validateHostContext(await getContext())
      if (canonical(after) !== canonical(expected))
        throw new Error(
          'The host acknowledged storage for the original patient, but the current context has changed. Verify that record before continuing.'
        )
      return immutableCopy(receipt)
    }
  })
}
