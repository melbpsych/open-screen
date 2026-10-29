/** Clinical workflow metadata is sensitive, captured with the sitting and never
 * stored in practice templates. It does not turn screening into diagnosis. */
import { object } from './validation.js'
export const PRACTICE_FIELDS = {
  referral: 'Referral question', purpose: 'Assessment purpose', recipient: 'Intended report recipient',
  conditions: 'Administration conditions and adjustments', collateral: 'Collateral sources and findings',
  selfReport: 'Person’s account', observations: 'Clinician observations', uncertainty: 'Uncertainty and limitations',
  goals: 'Treatment goals', functioning: 'Functioning and everyday impact',
  safetyMethod: 'Safety assessment method', safetyOutcome: 'Safety assessment outcome', safetyReason: 'Reason assessment was deferred or declined',
  followUpAction: 'Follow-up action', followUpOwner: 'Responsible clinician', followUpDue: 'Follow-up due date'
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
/** Shared by finalisation and import verification; UI checks alone are insufficient. */
export function reviewIssues(record) {
  const c = record.clinician, p = c.practice || {}, issues = []
  const filled = key => typeof p[key] === 'string' && p[key].trim().length > 0
  const add = (id, target, label, message) => issues.push({ id, target, label, message })
  if (!['Reviewed in interview', 'Follow-up required', 'Deferred', 'Declined'].includes(c.safetyReview)) add('safety', 'safety-review', 'Safety disposition', 'Record a direct safety review independently of symptom scores.')
  else if (['Deferred', 'Declined'].includes(c.safetyReview)) {
    if (record.safetyFlag) add('safety', 'safety-review', 'Direct safety review', 'An endorsed safety item requires direct safety review before finalising.')
    if (!filled('safetyReason')) add('safety-reason', 'practice-safetyReason', 'Reason for deferral', 'Record why safety assessment was deferred or declined.')
  } else if (!filled('safetyMethod') || !filled('safetyOutcome')) add('safety-outcome', !filled('safetyMethod') ? 'practice-safetyMethod' : 'practice-safetyOutcome', 'Safety method & outcome', 'Record the safety assessment method and outcome.')
  if ((['Follow-up required', 'Deferred', 'Declined'].includes(c.safetyReview) || ['followUpAction','followUpOwner','followUpDue'].some(filled)) && (!filled('followUpAction') || !filled('followUpOwner') || !filled('followUpDue'))) add('follow-up', 'practice-' + ['followUpAction','followUpOwner','followUpDue'].find(key => !filled(key)), 'Follow-up plan', 'Record the follow-up action, responsible clinician and due date.')
  if (Object.values(record.omissions || {}).some(omissionReason) && !p.omissionsReviewed) add('missing', 'missing-answers', 'Missing-answer review', 'Review the missing answers and their implications before finalising.')
  if (record.forensic && ['referral','purpose','recipient','conditions','collateral','uncertainty'].some(key => !filled(key))) add('forensic', 'practice-' + ['referral','purpose','recipient','conditions','collateral','uncertainty'].find(key => !filled(key)), 'Forensic context', 'Complete the forensic context, including unavailable collateral and limitations where applicable.')
  return issues
}
/** Finalisation/import and the UI use the same requirements. */
export function reviewErrors(record) { return reviewIssues(record).map(issue => issue.message) }
export function workflowLines(record) {
  const p = record.clinician?.practice || {}
  return [
    `Administration: ${record.setup?.mode === 'monitoring' ? 'Monitoring with planned full measures' : 'Staged screening'}.`,
    ...Object.entries(PRACTICE_FIELDS).filter(([key]) => p[key]?.trim()).map(([key,label]) => `${label}: ${p[key]}`),
    ...Object.entries(record.omissions || record.responses || {}).filter(([,value]) => omissionReason(value)).map(([id,value]) => `Missing response ${id}: ${omissionReason(value)}. No score imputed.`)
  ]
}
