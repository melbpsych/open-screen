/** Editable preferences are an explicit whitelist, never executable rules or a
 * deep merge of browser input. The public factory validates every effective
 * policy and questionnaire before it can be saved or used for a sitting.
 */
import { createScreener } from "../api.js"
import { object, text, immutableCopy } from "./validation.js"

export function practiceFields(base) {
  const fields = []
  const add = (key, label, path, min, max, section = "Follow-up gates", step = 1, kind = "number") => {
    let value = base.configuration
    for (const part of path) value = value[part]
    fields.push({ key, label, path, min, max, section, step, kind, defaultValue: structuredClone(value) })
  }
  for (const [id, brief, full, max] of [["depression", "PHQ-2", "PHQ-9", 27], ["anxiety", "GAD-2", "GAD-7", 21]]) {
    add(`${id}.gate`, `${brief} follow-up gate`, ["policy", "thresholds", id, "gate"], 0, 6)
    add(`${id}.screen`, `${full} screen threshold`, ["policy", "thresholds", id, "screen"], 0, max, "Additional rules")
    base.policy.thresholds[id].bands.slice(0, -1).forEach(([upper, label], index) => {
      add(`${id}.band-${index}`, `${full}: upper bound for ${label}`, ["policy", "thresholds", id, "bands", index, 0], 1, max, "Severity bands")
    })
  }
  add("trauma.gate", "PC-PTSD-5 follow-up gate", ["policy", "thresholds", "trauma", "gate"], 0, 5)
  add("alcohol.allowed", "Allowed AUDIT-C gates", ["policy", "thresholds", "alcohol", "allowed"], 0, 12, "Follow-up gates", 1, "list")
  add("alcohol.default", "Default AUDIT-C gate", ["policy", "thresholds", "alcohol", "default"], 0, 12, "Additional rules", 1, "nullable")
  add("trauma.pclItem", "PCL-5 item endorsement", ["policy", "thresholds", "trauma", "pclItem"], 1, 4, "Additional rules")
  add("personality.bands", "Personality extension bands", ["policy", "personality", "followUpBands"], null, null, "Additional rules", 1, "bands")
  for (const [key, label, min, max, step] of [
    ["screenMean", "Response-pattern keyed mean", 1, 5, .01], ["poleRate", "Response-pattern pole rate", 0, 1, .01],
    ["runLength", "Response-pattern run length", 1, 30, 1], ["sameRate", "Response-pattern same-response rate", 0, 1, .01],
    ["withinSD", "Response-pattern within-person SD", 0, 2, .01],
  ]) add(`patterns.${key}`, label, ["policy", "responsePatterns", key], min, max, "Additional rules", step)
  base.configuration.questionnaires.forEach((q, index) => {
    if (q.locked || q.scales?.length || q.algorithm) return
    const max = q.items.reduce((sum, item) => sum + Math.max(...item.options.map((option) => option.score)), 0)
    if (q.gate) add(`${q.id}.gate`, `${q.label} follow-up gate`, ["questionnaires", index, "gate", "threshold"], 0,
      q.items.slice(0, q.gate.itemCount).reduce((sum, item) => sum + Math.max(...item.options.map((option) => option.score)), 0))
    if (q.screenAt != null) add(`${q.id}.screen`, `${q.label} screen threshold`, ["questionnaires", index, "screenAt"], 0, max, "Additional rules")
    q.bands?.slice(0, -1).forEach(([, label], band) => add(`${q.id}.band-${band}`, `${q.label}: upper bound for ${label}`, ["questionnaires", index, "bands", band, 0], 1, max, "Severity bands"))
  })
  return immutableCopy(fields)
}

export const displayPreference = (value) => Array.isArray(value) ? value.length ? value.join(", ") : "None" : value === null ? "Ask each sitting" : String(value)
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Bind saved overrides to the deployment's reviewed defaults. A changed default
// or questionnaire revision requires review instead of silently rebasing cuts.
function signature(base) {
  return JSON.stringify({ policy: base.policy, questionnaires: base.configuration.questionnaires.map(({ id, version, gate, screenAt, bands }) => ({ id, version, gate, screenAt, bands })) })
}

export function configurePractice(base, overrides, reason, savedAt) {
  const fields = practiceFields(base)
  object(overrides, "Practice preferences", fields.map((field) => field.key))
  const effective = structuredClone(base.configuration)
  const changes = []
  const clean = {}
  for (const field of fields) {
    if (!Object.hasOwn(overrides, field.key)) continue
    const value = overrides[field.key]
    if (equal(value, field.defaultValue)) continue
    let parent = effective
    for (const part of field.path.slice(0, -1)) parent = parent[part]
    parent[field.path.at(-1)] = structuredClone(value)
    changes.push({ key: field.key, label: field.label, before: field.defaultValue, after: value })
    clean[field.key] = structuredClone(value)
  }
  if (!changes.length) return { screener: base, preferences: null, changes: [] }
  text(reason, "Reason for customisation", 600)
  if (typeof savedAt !== "string" || !/^\d{4}-\d\d-\d\dT/.test(savedAt) || !Number.isFinite(Date.parse(savedAt))) throw new TypeError("Invalid settings date")
  effective.policy.id = "practice-custom"
  effective.policy.version = `practice-${savedAt}`
  const summary = changes.map((change) => `${change.key}: ${displayPreference(change.before)} → ${displayPreference(change.after)}`).join("; ")
  effective.policy.rationale = `Custom practice preferences, not validation of altered thresholds. Based on ${base.policy.id} (${base.policy.version}). Saved ${savedAt}. Reason: ${reason.trim()}. Changes: ${summary.length > 2800 ? summary.slice(0, 2800) + "… See configuration snapshot for all values." : summary}`
  const screener = createScreener({ policy: effective.policy, questionnaires: effective.questionnaires })
  return { screener, changes: immutableCopy(changes), preferences: immutableCopy({ schemaVersion: 1, baseSignature: signature(base), savedAt, reason: reason.trim(), overrides: clean }) }
}

export function restorePractice(base, saved) {
  object(saved, "Saved preferences", ["schemaVersion", "baseSignature", "savedAt", "reason", "overrides"])
  if (saved.schemaVersion !== 1 || saved.baseSignature !== signature(base)) throw new TypeError("Saved preferences need review against the current project defaults")
  text(saved.reason, "Saved rationale", 600)
  if (typeof saved.savedAt !== "string" || !Number.isFinite(Date.parse(saved.savedAt))) throw new TypeError("Invalid saved settings date")
  return configurePractice(base, saved.overrides, saved.reason, saved.savedAt)
}
