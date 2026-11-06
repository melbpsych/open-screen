/** Clinical workflow metadata is sensitive, captured with the sitting and never
 * stored in practice templates. It does not turn screening into diagnosis. */
import { object, list } from './validation.js'
export const PRACTICE_FIELDS = {
  riskNotes: 'Risk notes', referral: 'Referral question', purpose: 'Assessment purpose', recipient: 'Intended report recipient',
  conditions: 'Administration conditions and adjustments', collateral: 'Collateral sources and findings',
  selfReport: 'Person’s account', observations: 'Clinician observations', uncertainty: 'Uncertainty and limitations',
  goals: 'Treatment goals', functioning: 'Functioning and everyday impact',
  safetyMethod: 'Safety assessment method', safetyOutcome: 'Safety assessment outcome', safetyReason: 'Reason assessment was deferred or declined',
  followUpAction: 'Follow-up action', followUpOwner: 'Responsible clinician', followUpDue: 'Follow-up due date',
  notification: 'Participation and notification record',
  pclEventId: 'PCL event reference for comparisons',
  safetyRecheck: 'Safety review update or explanation'
}

const safetyKeys = ['suicide','harm','harmTarget','harmMeans','harmRecency','harmIntoxication','weapon','withdrawalNow','withdrawalHistory','overdosePrior','overdoseSedation','overdoseAlone']
/** A reproducible binding to observations, not a clinical risk classification. */
export function safetyFindings(answers = {}, clinician = {}) {
  return JSON.stringify([answers['phq-9'] ?? null, clinician.safetyEndorsed === true,
    (clinician.safetyEvents || []).map(({ at, from, to }) => [at, from, to]), safetyKeys.map(key => [key, clinician.flags?.[key] ?? null])])
}
export function safetyReviewCurrent(record) {
  const c = record.clinician
  const needsBinding = record.safetyFlag || c.safetyReviewedFindings != null || safetyKeys.some(key => c.flags?.[key] === 'Yes')
  return !needsBinding || c.safetyReviewedFindings === safetyFindings(record.responses, c)
}
const safetyResponse = value => value === null || Number.isInteger(value) && value >= 0 && value <= 3 || !!omissionReason(value)
export function validateSafetyEvents(events) {
  list(events, 'Safety observations', 200)
  for (const event of events) {
    object(event, 'Safety observation', ['at','from','to','reason'])
    if (typeof event.at !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(event.at) || !Number.isFinite(Date.parse(event.at)) || !safetyResponse(event.from) || !safetyResponse(event.to) || typeof event.reason !== 'string' || event.reason.length > 4000) throw new TypeError('Invalid safety observation')
  }
}
/** Apply before changing the answer, so a bounded trail cannot lose evidence. */
export function validatePriorSafetyReviews(reviews) {
  list(reviews, 'Prior safety reviews', 200)
  for (const review of reviews) {
    object(review, 'Prior safety review', ['at','findings','disposition','method','outcome'])
    if (typeof review.at !== 'string' || !Number.isFinite(Date.parse(review.at))) throw new TypeError('Invalid prior safety review date')
    for (const key of ['findings','disposition','method','outcome']) if (typeof review[key] !== 'string' || review[key].length > (key === 'findings' ? 60000 : 4000)) throw new TypeError('Invalid prior safety review')
  }
}
export function preserveSafetyReview(record, at = new Date().toISOString()) {
  const c = record.clinician
  if (!c.practice?.safetyOutcome || !safetyReviewCurrent(record)) return c
  const review = { at, findings: safetyFindings(record.responses, c), disposition: c.safetyReview || 'Not recorded', method: c.practice.safetyMethod || '', outcome: c.practice.safetyOutcome }
  const prior = c.safetyPriorReviews || []
  if (prior.at(-1)?.findings === review.findings && prior.at(-1)?.outcome === review.outcome) return c
  const safetyPriorReviews = [...prior, review]
  validatePriorSafetyReviews(safetyPriorReviews)
  return { ...c, safetyPriorReviews }
}
export function safetyResponseChange(clinician, from, to, at = new Date().toISOString()) {
  const prior = clinician.safetyEvents || []
  const positive = value => Number.isInteger(value) && value > 0 && value <= 3
  if (JSON.stringify(from ?? null) === JSON.stringify(to) || !(positive(from) || positive(to) || clinician.safetyEndorsed)) return clinician
  const safetyEvents = [...prior, { at, from: from ?? null, to, reason: clinician.practice?.safetyRecheck || '' }]
  validateSafetyEvents(safetyEvents)
  return { ...clinician, safetyEndorsed: clinician.safetyEndorsed || positive(from) || positive(to), safetyEvents }
}
export function validatePractice(value = {}) {
  object(value, 'Practice review', [...Object.keys(PRACTICE_FIELDS), 'omissionsReviewed'])
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'omissionsReviewed') { if (typeof entry !== 'boolean') throw new TypeError('Invalid missing-answer review'); continue }
    if (typeof entry !== 'string' || entry.length > 4000) throw new TypeError('Invalid practice review field')
    if (key === 'followUpDue' && entry && (!/^\d{4}-\d{2}-\d{2}$/.test(entry) || !Number.isFinite(Date.parse(entry)) || new Date(entry).toISOString().slice(0,10) !== entry)) throw new TypeError('Invalid follow-up date')
  }
  return value
}
export function omissionReason(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)) || Object.keys(value).length !== 1 || !Object.hasOwn(value, 'missing')) return null
  return value.missing === 'prefer-not-to-answer' ? 'Prefer not to answer' : value.missing === 'unable-to-answer' ? 'Unable to answer' : null
}
/** Documentation is optional. Completion and input validity are checked separately. */
export function reviewIssues(record) { return [] }
export function reviewErrors(record) { return [] }

/** Historical documentation remains factual without imposing a new assessment. */
export function riskReviewNotice(record) {
  const c = record.clinician || {}, p = c.practice || {}
  const documented = p.riskNotes?.trim() || p.safetyMethod?.trim() || p.safetyOutcome?.trim() || ['Reviewed in interview','Follow-up required','Deferred','Declined'].includes(c.safetyReview)
  return documented && !safetyReviewCurrent(record) ? 'Recorded risk documentation is not linked to the current responses or observations.' : ''
}
export function workflowLines(record) {
  const p = record.clinician?.practice || {}
  return [
    ...Object.entries(record.setup?.followUpChoices || {}).filter(([,selected]) => !selected && record.setup?.mode !== 'monitoring').map(([id]) => `${id}: full questionnaire not selected after initial screening; no full score reported.`),
    `Administration: ${record.setup?.mode === 'monitoring' ? 'Monitoring with planned full measures' : 'Staged screening'}.`,
    ...(['Reviewed in interview','Follow-up required','Deferred','Declined'].includes(record.clinician?.safetyReview) ? [`Risk documentation: ${record.clinician.safetyReview}.`] : []),
    ...(riskReviewNotice(record) ? [riskReviewNotice(record)] : []),
    ...Object.entries(PRACTICE_FIELDS).filter(([key]) => p[key]?.trim()).map(([key,label]) => `${label}: ${p[key]}`),
    ...(record.safetyFlag && !(record.responses?.['phq-9'] > 0) ? ['Retained safety observation: earlier PHQ-9 item 9 endorsement; the current response is corrected, declined or unavailable.'] : []),
    ...(record.clinician?.safetyEvents || []).filter(event => event.reason || record.clinician.safetyEvents.some(row => row.from !== null)).map(event => `PHQ-9 item 9 ${event.from === null ? 'endorsement recorded' : 'response amended after endorsement'} at ${event.at}.${event.reason ? ` Reason: ${event.reason}.` : ''}`),
    ...(record.clinician?.safetyPriorReviews || []).map(review => `Earlier safety review preserved at ${review.at}: ${review.disposition}; method: ${review.method}; outcome: ${review.outcome}. Its findings binding is retained in the encrypted record.`),
    ...Object.entries(record.omissions || record.responses || {}).filter(([,value]) => omissionReason(value)).map(([id,value]) => `Missing response ${id}: ${omissionReason(value)}. No score imputed.`)
  ]
}
