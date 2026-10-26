/** Declarative additive questionnaires. Complex published algorithms stay explicit
 * reviewed adapters; this module deliberately has no expression language or I/O.
 * Response `value` is the original code. `score` is its keyed contribution.
 */
import { OPEN_LICENSES } from "./score.js"
import { bands, identifier, immutableCopy, list, number, object, text, unique } from "./validation.js"
import { tapsPath, tapsResult } from "./taps.js"
import officialAsrs from "../questionnaires/asrs-v1-1.json" with { type: "json" }
import officialTaps from "../questionnaires/taps.json" with { type: "json" }

// Independent snapshots: a host importing the same JSON module cannot mutate
// the reference against which its supplied named form is validated.
const reviewedForms = immutableCopy({ asrs: officialAsrs, taps: officialTaps })

// These named algorithms cannot be attached to rewritten forms or altered keys.
// NYU permits an electronic ASRS, but does not permit modifying the instrument.
function same(a, b) {
  if (a === b) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]))
}

function https(value, label) {
  text(value, label, 2000)
  if (new URL(value).protocol !== "https:") throw new TypeError(`${label} must use HTTPS`)
}

/** Compile once at registration; malformed or ambiguous definitions fail early. */
export function defineQuestionnaire(input) {
  object(input, "questionnaire", ["schemaVersion", "id", "version", "label", "title", "stem", "license", "source", "items", "gate", "bands", "screenAt", "requirements", "scales", "phase", "locked", "algorithm", "formChoices"])
  if ((input.id === 'asrs-v1-1' && input.algorithm !== 'asrs-v1.1') || (input.id === 'taps' && input.algorithm !== 'taps')) throw new TypeError('Named algorithms require the unchanged reviewed form')
  if (input.algorithm != null && !['asrs-v1.1', 'taps'].includes(input.algorithm)) throw new TypeError('Unsupported questionnaire algorithm')
  if (input.algorithm && !same(input, input.algorithm === 'taps' ? reviewedForms.taps : reviewedForms.asrs)) throw new TypeError('Named algorithms require the unchanged reviewed form')
  if (input.locked != null && typeof input.locked !== 'boolean') throw new TypeError('locked must be boolean')
  if (input.phase != null && ![1, 2].includes(input.phase)) throw new TypeError('phase must be 1 or 2')
  if (input.schemaVersion !== 1) throw new TypeError("Unsupported questionnaire schemaVersion")
  identifier(input.id, "questionnaire.id")
  for (const key of ["version", "label", "title"]) text(input[key], key, 200)
  if (input.stem != null) text(input.stem, "stem")
  object(input.license, "license", ["id", "url", "attribution"])
  if (!OPEN_LICENSES.has(input.license.id) && !(input.algorithm === 'asrs-v1.1' && input.license.id === 'LicenseRef-NYU-ASRS-6')) throw new TypeError("Questionnaire requires an explicitly supported open license")
  https(input.license.url, "license.url")
  text(input.license.attribution, "license.attribution")
  object(input.source, "source", ["citation", "url", "limits"])
  text(input.source.citation, "source.citation")
  https(input.source.url, "source.url")
  text(input.source.limits, "source.limits")
  list(input.items, "items")
  if (!input.items.length) throw new TypeError("Questionnaire requires items")
  const itemIds = []
  let max = 0
  for (const item of input.items) {
    object(item, "item", ["id", "text", "options", "kind", "stem"])
    identifier(item.id, "item.id")
    if (!item.id.startsWith(`${input.id}-`)) throw new TypeError("Item ids must start with the questionnaire id and a hyphen")
    itemIds.push(item.id)
    text(item.text, "item.text")
    if (item.stem != null) text(item.stem, 'item.stem')
    if (item.kind === 'text') {
      if (input.algorithm !== 'taps' || item.options != null) throw new TypeError('Text items are only supported in the explicit TAPS adapter')
      continue
    }
    if (item.kind != null && item.kind !== 'choice') throw new TypeError('Invalid item kind')
    list(item.options, "item.options", 12)
    if (item.options.length < 2) throw new TypeError("Each item needs at least two options")
    for (const option of item.options) {
      object(option, "option", ["value", "score", "label"])
      number(option.value, "option.value", -100, 100)
      number(option.score, "option.score", 0, 100)
      text(option.label, "option.label", 500)
    }
    unique(item.options.map((option) => option.value), "Response codes")
    if (!input.scales?.length && input.algorithm !== 'taps' && !item.options.some((option) => option.score === 0)) throw new TypeError("Additive items must include a zero-scoring option")
    max += Math.max(...item.options.map((option) => option.score))
  }
  unique(itemIds, "Item ids")
  list(input.scales || [], 'scales', 50)
  if (input.scales?.length && (input.gate || input.screenAt != null || input.bands?.length || input.algorithm)) throw new TypeError('Trait profiles cannot have a combined total, gate or severity bands')
  for (const scale of input.scales || []) {
    object(scale, 'scale', ['id', 'label', 'itemIds', 'level'])
    identifier(scale.id, 'scale.id'); text(scale.label, 'scale.label', 200)
    list(scale.itemIds, 'scale.itemIds')
    if (!scale.itemIds.length || scale.itemIds.some((id) => !itemIds.includes(id))) throw new TypeError('Scale must reference registered items')
    unique(scale.itemIds, 'Scale items')
    if (!scale.itemIds.some((id) => { const scores = input.items.find((item) => item.id === id).options.map((o) => o.score); return Math.min(...scores) < Math.max(...scores) })) throw new TypeError('Scale needs a nonconstant score range')
    if (scale.level != null && !['domain', 'facet'].includes(scale.level)) throw new TypeError('Invalid scale level')
  }
  unique((input.scales || []).map((s) => s.id), 'Scale ids')
  if (input.scales?.length && itemIds.some((id) => !input.scales.some((s) => s.itemIds.includes(id)))) throw new TypeError('Every profile item must belong to a scale')
  list(input.formChoices || [], 'formChoices', 10)
  for (const form of input.formChoices || []) { object(form, 'form', ['id', 'label']); identifier(form.id, 'form.id'); text(form.label, 'form.label', 200) }
  unique((input.formChoices || []).map((f) => f.id), 'Form ids')
  if (max < 1) throw new TypeError("Questionnaire must have a positive score range")
  let gateMax = null
  if (input.gate != null) {
    if (input.phase === 2) throw new TypeError("Brief gates must start in stage one")
    object(input.gate, "gate", ["itemCount", "threshold", "title"])
    number(input.gate.itemCount, "gate.itemCount", 1, input.items.length - 1)
    gateMax = input.items.slice(0, input.gate.itemCount).reduce((sum, item) => sum + Math.max(...item.options.map((option) => option.score)), 0)
    if (gateMax < 1) throw new TypeError("A brief gate must have a positive score range")
    number(input.gate.threshold, "gate.threshold", 0, gateMax)
    text(input.gate.title, "gate.title", 200)
  }
  if (input.screenAt != null) number(input.screenAt, "screenAt", 0, max)
  bands(input.bands || [], max, "bands")
  list(input.requirements || [], "requirements", 12)
  for (const row of input.requirements || []) {
    object(row, "requirement", ["id", "label"])
    identifier(row.id, "requirement.id")
    text(row.label, "requirement.label", 500)
  }
  unique((input.requirements || []).map((row) => row.id), "Requirement ids")
  return immutableCopy({ ...input, bands: input.bands || [], requirements: input.requirements || [], formChoices: input.formChoices || [], max, gateMax })
}

function ready(item, answers) {
  if (item.kind === 'text') return typeof answers[item.id] === 'string'
  return item.options.some((option) => option.value === answers[item.id])
}

function sum(items, answers) {
  return items.reduce((total, item) => total + item.options.find((option) => option.value === answers[item.id]).score, 0)
}

export function requirementsMet(definition, setup) {
  return definition.requirements.every((row) => setup.confirmations?.[`${definition.id}:${row.id}`] === true)
    && (!definition.formChoices.length || definition.formChoices.some((form) => setup.forms?.[definition.id] === form.id))
}

/** Shared answers are counted once; unopened follow-up responses remain inactive. */
export function questionnaireResult(definition, setup, answers) {
  if (!setup.topics[definition.id]) return { id: definition.id, status: "not-selected" }
  const common = { id: definition.id, label: definition.label, full: definition.title, brief: definition.gate?.title || definition.title, max: definition.scales?.length || definition.algorithm === 'taps' ? null : definition.max, gateMax: definition.gateMax, bands: definition.bands, threshold: definition.gate?.threshold ?? null, source: definition.source, license: definition.license, version: definition.version }
  if (!requirementsMet(definition, setup)) return { ...common, status: "omitted", ...(definition.scales?.length || definition.algorithm === "taps" ? { scales: [], total: null } : {}), reason: "Administration requirements are not confirmed." }
  if (definition.algorithm === 'taps') return { ...common, ...tapsResult(setup, answers) }
  if (definition.scales?.length) {
    const scales = definition.scales.map((scale) => {
      const items = scale.itemIds.map((id) => definition.items.find((item) => item.id === id))
      const complete = items.every((item) => ready(item, answers))
      const total = complete ? sum(items, answers) : null
      return { id: scale.id, label: scale.label, level: scale.level || 'domain', status: complete ? 'scored' : 'incomplete', sum: total,
        min: items.reduce((n, item) => n + Math.min(...item.options.map((o) => o.score)), 0),
        max: items.reduce((n, item) => n + Math.max(...item.options.map((o) => o.score)), 0),
        mean: complete ? total / items.length : null, count: items.length }
    })
    return { ...common, status: scales.every((s) => s.status === 'scored') ? 'scored' : 'incomplete', scales, total: null, gateScore: null, threshold: null, positive: null, band: null }
  }
  const gateItems = definition.gate ? definition.items.slice(0, definition.gate.itemCount) : definition.items
  const gateReady = gateItems.every((item) => ready(item, answers))
  const gateScore = gateReady ? sum(gateItems, answers) : null
  const override = !!setup.followUps?.[definition.id]
  const opened = gateReady && (!definition.gate || gateScore >= definition.gate.threshold || override)
  const complete = opened && definition.items.every((item) => ready(item, answers))
  const total = complete ? sum(definition.items, answers) : null
  return {
    ...common, gateScore, override, opened, total, screenAt: definition.screenAt ?? null,
    ...(definition.algorithm === 'asrs-v1.1' ? { algorithm: definition.algorithm, continuousTotal: complete ? definition.items.reduce((n, item) => n + answers[item.id], 0) : null } : {}),
    thresholdMet: definition.gate && gateReady ? gateScore >= definition.gate.threshold : null,
    status: !gateReady ? "incomplete" : !opened ? "gate-closed" : complete ? "scored" : "incomplete",
    band: complete ? definition.bands.find(([upper]) => total < upper)?.[1] || null : null,
    positive: complete && definition.screenAt != null ? total >= definition.screenAt : null,
  }
}

export function questionnaireSteps(definition, setup, answers) {
  if (!setup.topics[definition.id] || !requirementsMet(definition, setup)) return []
  const result = questionnaireResult(definition, setup, answers)
  const path = definition.algorithm === 'taps' ? tapsPath(setup, answers) : definition.items.slice(0, result.opened ? definition.items.length : definition.gate?.itemCount || definition.items.length).map((item, index) => ({ id: item.id, stage: definition.gate && index >= definition.gate.itemCount ? 2 : definition.phase || 1 }))
  return path.map(({ id, stage }, index) => {
    const item = definition.items.find((item) => item.id === id)
    return {
    id: item.id, instrument: definition.id, kind: item.kind || "choice", kicker: definition.label,
    title: item.text, stem: item.stem || (definition.algorithm === 'taps' && stage === 2 ? 'The TAPS Tool Part 2 is a brief assessment for tobacco, alcohol, and illicit substance use and prescription medication misuse in the PAST 3 MONTHS ONLY.' : definition.stem), index: index + 1, count: path.length,
    stage,
    // The existing UI names original response codes `score`; only this adapter
    // translates that legacy property. Keyed scoring remains in the definition.
    ...(item.options ? { options: item.options.map((option) => ({ label: option.label, score: option.value })) } : {}),
    footer: `${definition.license.attribution} ${definition.source.limits}`,
  } })
}
