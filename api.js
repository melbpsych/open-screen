/** Public, synchronous integration boundary. No DOM, storage, network, or globals.
 * Each factory owns an immutable policy and registry; sessions never share answers.
 * Missing responses are normal. Invalid codes and unknown fields are errors.
 */
import { omissionReason, validatePractice, validateSafetyEvents, validatePriorSafetyReviews, riskReviewNotice, PRACTICE_FIELDS } from "./core/workflow.js"
import { ENGINE_VERSION, RULES_VERSION } from './core/version.js'
import { validateExternalTotals } from './core/external-fields.js'
import { answeredCount, compileRecord, emptySetup, licencesAdministered, patientPath, responseValid, setupErrors } from "./gates/engine.js"
import { clinicalScreens, configuredScreens } from "./gates/clinical.js"
import { audit, dassStress, ipipTraits, pcl, pcptsd } from "./gates/instruments.js"
import { validityItems } from "./gates/validity.js"
import personality from "./measures/personality-5.json" with { type: "json" }
import { defineQuestionnaire } from "./core/questionnaire.js"
import { immutableCopy, list, object } from "./core/validation.js"
import { BUILTIN_TOPICS, DEFAULT_POLICY, validatePolicy } from "./policy.js"

export const API_VERSION = 1
export { ENGINE_VERSION, RULES_VERSION }

const SETUP_KEYS = ["mode", "advanceMode", "context", "topics", "followUps", "followUpChoices", "confirmations", "forms", "auditFee", "auditThreshold", "definedPatientGroup", "scoresToClinician", "scaleNotSold"]
const CLINICIAN_KEYS = ["practice", "safetyEndorsed", "safetyEvents", "safetyPriorReviews", "safetyReviewedFindings", "reference", "facts", "flags", "entered", "auditSex", "safetyReview", "safetyAcknowledged"]

function builtinItems() {
  const items = clinicalScreens.flatMap((screen) => screen.items.map((_, index) => ({ id: `${screen.prefix}-${index + 1}`, values: [0, 1, 2, 3] })))
  items.push({ id: "phq-difficulty", values: [0, 1, 2, 3] })
  for (const item of audit.items) items.push({ id: item.id, values: item.options.map(([, value]) => value) })
  items.push({ id: pcptsd.exposureId, values: ["yes", "no"] })
  pcptsd.items.forEach((_, index) => items.push({ id: `pcptsd-${index + 1}`, values: ["yes", "no"] }))
  pcl.items.forEach((_, index) => items.push({ id: `pcl-${index + 1}`, values: [0, 1, 2, 3, 4] }))
  items.push({ id: pcl.eventId, text: true })
  for (const item of dassStress.items) items.push({ id: item.id, values: [0, 1, 2, 3] })
  for (const item of personality.items) items.push({ id: item.id, values: [1, 2, 3, 4, 5] })
  for (const trait of ipipTraits) for (const item of trait.items) if (item.id !== trait.screenId) items.push({ id: `ipip-${item.id}`, values: [1, 2, 3, 4, 5] })
  for (const item of validityItems) items.push({ id: item.id, values: [1, 2, 3, 4, 5] })
  return items
}

const BUILTIN_CATALOG = [
  { id: "depression", name: "Depression", detail: "PHQ-2 → PHQ-9", tag: "2 initial items" },
  { id: "anxiety", name: "Generalised anxiety", detail: "GAD-2 → GAD-7", tag: "2 initial items" },
  { id: "trauma", name: "Trauma", detail: "PC-PTSD-5 → PCL-5", tag: "Exposure + up to 5 items" },
  { id: "alcohol", name: "Alcohol", detail: "AUDIT-C → AUDIT", tag: "3 initial items" },
  { id: "personality", name: "Personality", detail: "IPIP markers → trait extension", tag: "Optional · not a symptom gate" },
  { id: "validity", name: "Response patterns", detail: "IPIP impression management", tag: "Optional · 30 items" },
  { id: "irritability", name: "Tension", detail: "DASS-21 Stress", tag: "Optional · 7 items" },
]

/** @param {{policy?: object, questionnaires?: object[], clock?: () => string}} [options]
 * `clock` is a trusted function for deterministic tests/replay, never configuration code.
 * JSON definitions support additive totals and an optional shared-item brief gate.
 */
export function createScreener(options = {}) {
  object(options, "screener options", ["policy", "questionnaires", "clock"])
  const { policy: inputPolicy = DEFAULT_POLICY, questionnaires: incoming = [], clock = () => new Date().toISOString() } = options
  list(incoming, "questionnaires", 50)
  if (typeof clock !== "function") throw new TypeError("clock must be a function")
  const definitions = incoming.map(defineQuestionnaire)
  const ids = [...BUILTIN_TOPICS]
  const items = new Map(builtinItems().map((row) => [row.id, row]))
  for (const definition of definitions) {
    if (ids.includes(definition.id)) throw new TypeError(`Duplicate topic ${definition.id}`)
    ids.push(definition.id)
    for (const item of definition.items) {
      if (items.has(item.id)) throw new TypeError(`Duplicate response id ${item.id}`)
      items.set(item.id, item.kind === 'text' ? { id: item.id, text: true } : { id: item.id, values: item.options.map((option) => option.value) })
    }
  }
  const policy = validatePolicy(inputPolicy, definitions.map((row) => row.id))
  const confirmations = definitions.flatMap((row) => row.requirements.map((requirement) => `${row.id}:${requirement.id}`))
  const catalog = immutableCopy([...BUILTIN_CATALOG, ...definitions.map((row) => ({ id: row.id, name: row.label, detail: row.gate ? `${row.gate.title} → ${row.title}` : row.title, tag: row.algorithm === 'taps' ? '4 initial items · US form' : `${row.gate?.itemCount || row.items.length} ${row.phase === 2 ? 'optional' : 'initial'} items${row.scales?.length ? ' · traits only' : ''}`, requirements: row.requirements, formChoices: row.formChoices }))])
  const configuration = immutableCopy({ engineVersion: ENGINE_VERSION, rulesVersion: RULES_VERSION, policy, questionnaires: incoming })

  function validateSetup(setup) {
    object(setup, "setup", SETUP_KEYS)
    if (setup.mode != null && !["screening", "monitoring"].includes(setup.mode)) throw new TypeError("Invalid administration mode")
    if (setup.advanceMode != null && !["automatic", "manual"].includes(setup.advanceMode)) throw new TypeError("Invalid advance mode")
    if (![null, "clinical", "forensic"].includes(setup.context)) throw new TypeError("Invalid context")
    if (![null, "yes", "no"].includes(setup.auditFee)) throw new TypeError("Invalid auditFee")
    if (setup.auditThreshold !== null && !policy.thresholds.alcohol.allowed.includes(setup.auditThreshold)) throw new TypeError("AUDIT-C threshold is not allowed by this policy")
    for (const key of ["definedPatientGroup", "scoresToClinician", "scaleNotSold"]) if (typeof setup[key] !== "boolean") throw new TypeError(`${key} must be boolean`)
    object('forms' in setup ? setup.forms : {}, 'forms', definitions.filter((q) => q.formChoices.length).map((q) => q.id))
    for (const [id, value] of Object.entries(setup.forms || {})) if (!definitions.find((q) => q.id === id).formChoices.some((form) => form.id === value)) throw new TypeError('Invalid questionnaire form')
    for (const [key, allowed] of [["topics", ids], ["followUps", ids], ["confirmations", confirmations]]) {
      object(setup[key], key, allowed)
      for (const value of Object.values(setup[key])) if (typeof value !== "boolean") throw new TypeError(`${key} values must be boolean`)
    }
    const followUpIds = [...BUILTIN_CATALOG.map(row => row.id), ...definitions.filter(row => row.phase === 2 || row.gate || row.algorithm === 'taps').map(row => row.id)]
    object(setup.followUpChoices || {}, 'followUpChoices', followUpIds)
    for (const value of Object.values(setup.followUpChoices || {})) if (typeof value !== 'boolean') throw new TypeError('followUpChoices values must be boolean')
    return { ...setup, topics: Object.assign(Object.create(null), setup.topics), followUps: Object.assign(Object.create(null), setup.followUps, setup.mode === "monitoring" ? Object.fromEntries(ids.filter(id => setup.topics[id]).map(id => [id,true])) : {}), confirmations: Object.assign(Object.create(null), setup.confirmations), policy, questionnaires: definitions }
  }

  function createSetup(overrides = {}) {
    object(overrides, "setup overrides", SETUP_KEYS)
    const base = emptySetup(policy, definitions)
    delete base.policy
    delete base.questionnaires
    base.topics = Object.fromEntries(ids.map((id) => [id, false]))
    base.context = policy.defaults.context
    base.auditThreshold = policy.thresholds.alcohol.default
    for (const id of policy.defaults.topics) base.topics[id] = true
    const setup = { ...base, ...overrides, forms: { ...object('forms' in overrides ? overrides.forms : {}, 'forms') }, topics: { ...base.topics, ...object("topics" in overrides ? overrides.topics : {}, "topics", ids) }, followUps: { ...object("followUps" in overrides ? overrides.followUps : {}, "followUps", ids) }, confirmations: { ...object("confirmations" in overrides ? overrides.confirmations : {}, "confirmations", confirmations) } }
    validateSetup(setup)
    return setup
  }

  function validateAnswers(answers = {}) {
    object(answers, "answers")
    const errors = []
    for (const [id, value] of Object.entries(answers)) {
      const item = items.get(id)
      if (!item) errors.push({ id, code: "unknown-item" })
      else if (omissionReason(value)) continue
      else if (item.text ? typeof value !== "string" || value.length > 4000 : !item.values.includes(value)) errors.push({ id, code: "invalid-response" })
    }
    return errors
  }

  function checkedAnswers(answers = {}) {
    const errors = validateAnswers(answers)
    // Never echo response values into error messages or logs.
    if (errors.length) throw new TypeError(`Invalid answers: ${errors.map((row) => row.code).join(", ")}`)
    // Missing reasons are administration metadata. Scorers receive only original
    // response codes, so a declined answer cannot be coerced into a numeric score.
    return Object.assign(Object.create(null), Object.fromEntries(Object.entries(answers).filter(([,value]) => !omissionReason(value))))
  }

  function checkedClinician(clinician = {}) {
    object(clinician, "clinician", CLINICIAN_KEYS)
    if (clinician.practice !== undefined) validatePractice(clinician.practice)
    if (clinician.safetyEvents !== undefined) validateSafetyEvents(clinician.safetyEvents)
    if (clinician.safetyPriorReviews !== undefined) validatePriorSafetyReviews(clinician.safetyPriorReviews)
    if (clinician.safetyReviewedFindings != null && (typeof clinician.safetyReviewedFindings !== 'string' || clinician.safetyReviewedFindings.length > 60000)) throw new TypeError('Invalid safety findings acknowledgement')
    for (const key of ["reference", "facts"]) if (clinician[key] != null && (typeof clinician[key] !== "string" || clinician[key].length > (key === "reference" ? 200 : 20000))) throw new TypeError(`Invalid clinician.${key}`)
    if (clinician.auditSex != null && !["woman", "man", "not-recorded"].includes(clinician.auditSex)) throw new TypeError("Invalid clinician.auditSex")
    if (clinician.safetyReview != null && !["Not recorded", "Reviewed in interview", "Follow-up required", "Deferred", "Declined"].includes(clinician.safetyReview)) throw new TypeError("Invalid safetyReview")
    if (clinician.safetyEndorsed != null && typeof clinician.safetyEndorsed !== "boolean") throw new TypeError("Invalid retained safety endorsement")
    if (clinician.safetyAcknowledged != null && typeof clinician.safetyAcknowledged !== "boolean") throw new TypeError("Invalid safetyAcknowledged")
    for (const key of ["flags", "entered"]) {
      object(key in clinician ? clinician[key] : {}, `clinician.${key}`)
      if (Object.keys(clinician[key] || {}).length > 200) throw new TypeError("Too many clinician fields")
      for (const value of Object.values(clinician[key] || {})) if ((typeof value !== "string" || value.length > 4000) && !(typeof value === "number" && Number.isFinite(value))) throw new TypeError(`Invalid clinician.${key} value`)
    }
    validateExternalTotals(clinician.entered || {})
    return structuredClone(clinician)
  }

  function getSteps(setup, answers = {}) {
    return structuredClone(patientPath(validateSetup(setup), checkedAnswers(answers))).map((step) => ({ ...step, ...(step.options ? { options: step.options.map((option) => ({ ...option, value: option.score })) } : {}) }))
  }

  function record(setup, answers = {}, clinician = {}) {
    const bound = validateSetup(setup)
    if (bound.context === null) throw new TypeError("Choose a clinical or forensic context before creating a record")
    const raw = checkedAnswers(answers)
    const notes = checkedClinician(clinician)
    const generatedAt = clock()
    if (typeof generatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(generatedAt) || !Number.isFinite(Date.parse(generatedAt))) throw new TypeError("clock must return an ISO timestamp")
    const activeIds = new Set(patientPath(bound, raw).map(step => step.id))
    const result = compileRecord(bound, raw, notes, { generatedAt })
    const path = patientPath(bound, raw)
    const instruments = { depression: ['phq'], anxiety: ['gad'], trauma: ['pcptsd','pcl'], alcohol: ['audit'], personality: ['personality','ipip'], validity: ['validity'], irritability: ['dass'] }
    const administration = catalog.filter(row => setup.topics[row.id]).map(row => {
      const steps = path.filter(step => (instruments[row.id] || [row.id]).includes(step.instrument))
      const measured = result.symptoms.find(s => s.id === row.id) || result.additional.find(s => s.id === row.id) || ({ alcohol: result.alcohol, trauma: result.trauma, irritability: result.stress, validity: result.validity, personality: result.personality })[row.id]
      const status = row.id === 'trauma' && result.trauma.exposure === 'no' ? 'omitted' : row.id === 'personality' ? result.personality?.ready && result.ipip.every(trait => trait.status === 'scored') ? 'scored' : 'incomplete' : measured?.status || 'incomplete'
      return { id: row.id, label: row.id === 'irritability' ? 'DASS-21 Stress' : row.id === 'validity' ? 'IPIP response patterns' : row.name, status,
        answered: steps.filter(step => Object.hasOwn(raw, step.id)).length, required: steps.length,
        missing: steps.filter(step => omissionReason(answers[step.id])).length,
        reason: row.id === 'trauma' && result.trauma.exposure === 'no' ? 'Exposure not endorsed; symptom questions were not administered.' : measured?.reason || (status === 'incomplete' ? 'Selected module incomplete; missing responses are not imputed.' : status === 'omitted' ? 'Not administered under the selected administration conditions.' : '') }
    })
    const missingResponses = Object.entries(answers).filter(([, value]) => omissionReason(value))
    const riskNotice = riskReviewNotice({ ...result, safetyFlag: result.safetyFlag || notes.safetyEndorsed === true, clinician: notes, responses: answers })
    const documentation = Object.entries(PRACTICE_FIELDS).filter(([key]) => notes.practice?.[key]?.trim()).map(([key,label]) => `${label}: ${notes.practice[key]}`)
    const text = result.text + (riskNotice ? '\n\n' + riskNotice : '') + (documentation.length ? '\n\n' + documentation.join('\n') : '') + (missingResponses.length ? '\n\nRecorded missing responses\n' + missingResponses.map(([id, value]) => `${id}: ${omissionReason(value)} (missing: ${value.missing}). ${activeIds.has(id) ? 'No score imputed.' : 'Outside the current scoring path; not used in current totals.'}`).join('\n') : '')
    return immutableCopy({ ...result, text, administration, safetyFlag: result.safetyFlag || notes.safetyEndorsed === true, schemaVersion: API_VERSION, configuration, setup, clinician: notes, omissions: Object.fromEntries(Object.entries(answers).filter(([id,value]) => activeIds.has(id) && omissionReason(value))), responses: structuredClone(answers) })
  }

  return Object.freeze({
    apiVersion: API_VERSION, policy, catalog, configuration,
    createSetup, validateAnswers, getSteps, record,
    setupErrors: (setup) => setupErrors(validateSetup(setup)),
    progress: (setup, answers = {}) => {
      const bound = validateSetup(setup)
      const path = getSteps(setup, answers)
      const progress = { done: path.filter(s => isAnswered(s, answers)).length, total: path.length, finished: path.every(s => isAnswered(s, answers)) }
      return { ...progress, finished: setupErrors(bound).length === 0 && progress.finished }
    },
    nextStep: (setup, answers = {}) => getSteps(setup, answers).find((step) => !isAnswered(step, answers)) || null,
    licences: (setup, answers = {}) => licencesAdministered(validateSetup(setup), checkedAnswers(answers)),
    symptomDefinitions: (setup) => immutableCopy(configuredScreens(validateSetup(setup))),
  })
}

/** Test an original response against a public question, without coercion. */
export function isAnswered(step, answers) {
  if (omissionReason(answers[step.id])) return true
  if (step.kind === "text") return typeof answers[step.id] === "string"
  return !!step.options?.some((option) => option.value === answers[step.id])
}

/** Explicit serialization, never automatic transport. Raw responses are opt-in.
 * The default omits the legacy text appendix and the patient's event description.
 * Clinician notes and derived scores are still sensitive clinical information.
 */
export function exportJSON(record, { includeResponses = false } = {}) {
  if (record.schemaVersion !== API_VERSION || !record.configuration) throw new TypeError("Expected a versioned Open Screen record")
  if (typeof includeResponses !== "boolean") throw new TypeError("includeResponses must be boolean")
  const copy = structuredClone(record)
  if (!includeResponses) {
    delete copy.responses
    delete copy.text
    if (copy.trauma.pcl) delete copy.trauma.pcl.event
    // These internal bindings/trails contain original answer codes as well.
    if (copy.clinician) {
      delete copy.clinician.safetyReviewedFindings
      delete copy.clinician.safetyEvents
      for (const review of copy.clinician.safetyPriorReviews || []) delete review.findings
    }
  }
  return `${JSON.stringify(copy, null, 2)}\n`
}
