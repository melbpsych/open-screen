import source from "./config/policy.json" with { type: "json" }
import { bands, identifier, immutableCopy, list, number, object, text, unique } from "./core/validation.js"

export const BUILTIN_TOPICS = Object.freeze(["depression", "anxiety", "trauma", "alcohol", "personality", "validity", "irritability"])

/** Validate a complete policy, not a partial patch. Typos must not silently fall back. */
export function validatePolicy(policy, extraTopicIds = []) {
  object(policy, "policy", ["schemaVersion", "id", "version", "rationale", "defaults", "thresholds", "personality", "responsePatterns"])
  if (policy.schemaVersion !== 1) throw new TypeError("Unsupported policy schemaVersion")
  identifier(policy.id, "policy.id")
  text(policy.version, "policy.version", 80)
  text(policy.rationale, "policy.rationale")
  const known = [...BUILTIN_TOPICS, ...extraTopicIds]
  object(policy.defaults, "defaults", ["context", "topics", "primaryTopics"])
  if (![null, "clinical", "forensic"].includes(policy.defaults.context)) throw new TypeError("Invalid default context")
  for (const key of ["topics", "primaryTopics"]) {
    list(policy.defaults[key], `defaults.${key}`, 50)
    unique(policy.defaults[key], `defaults.${key}`)
    for (const id of policy.defaults[key]) {
      identifier(id, `defaults.${key}`)
      if (!known.includes(id)) throw new TypeError(`Unknown topic ${id}`)
    }
  }
  object(policy.thresholds, "thresholds", ["depression", "anxiety", "alcohol", "trauma"])
  for (const [id, max] of [["depression", 27], ["anxiety", 21]]) {
    const row = policy.thresholds[id]
    object(row, id, ["gate", "screen", "bands"])
    number(row.gate, `${id}.gate`, 0, 6)
    number(row.screen, `${id}.screen`, 0, max)
    bands(row.bands, max, `${id}.bands`)
    if (!row.bands.length) throw new TypeError(`${id}.bands must cover all scores`)
  }
  const alcohol = policy.thresholds.alcohol
  object(alcohol, "alcohol", ["allowed", "default"])
  list(alcohol.allowed, "alcohol.allowed", 13)
  if (!alcohol.allowed.length) throw new TypeError("alcohol.allowed must not be empty")
  unique(alcohol.allowed, "alcohol.allowed")
  alcohol.allowed.forEach((value) => number(value, "alcohol.allowed", 0, 12))
  if (alcohol.default !== null && !alcohol.allowed.includes(alcohol.default)) throw new TypeError("Alcohol default must be null or an allowed threshold")
  object(policy.thresholds.trauma, "trauma", ["gate", "pclItem"])
  number(policy.thresholds.trauma.gate, "trauma.gate", 0, 5)
  number(policy.thresholds.trauma.pclItem, "trauma.pclItem", 1, 4)
  object(policy.personality, "personality", ["followUpBands"])
  list(policy.personality.followUpBands, "personality.followUpBands", 3)
  unique(policy.personality.followUpBands, "personality.followUpBands")
  if (policy.personality.followUpBands.some((id) => !["low", "middle", "high"].includes(id))) throw new TypeError("Unknown personality follow-up band")
  const patterns = policy.responsePatterns
  object(patterns, "responsePatterns", ["screenMean", "poleRate", "runLength", "sameRate", "withinSD"])
  number(patterns.screenMean, "screenMean", 1, 5, false)
  number(patterns.poleRate, "poleRate", 0, 1, false)
  number(patterns.runLength, "runLength", 1, 30)
  number(patterns.sameRate, "sameRate", 0, 1, false)
  number(patterns.withinSD, "withinSD", 0, 2, false)
  return immutableCopy(policy)
}

// Check the file's structure now. The factory checks declared topics against the
// real registry after definitions have loaded, including registered extensions.
export const DEFAULT_POLICY = validatePolicy(source, [...new Set([...source.defaults.topics, ...source.defaults.primaryTopics])])

/** Low-level engine callers may omit the policy; public integrations use a factory. */
export function policyFor(setup) {
  return setup?.policy || DEFAULT_POLICY
}

export function policyNote(policy) {
  return `Policy ${policy.id} · ${policy.version}. PHQ-2 ≥${policy.thresholds.depression.gate}; GAD-2 ≥${policy.thresholds.anxiety.gate}; PC-PTSD-5 ≥${policy.thresholds.trauma.gate}. ${policy.rationale}`
}
