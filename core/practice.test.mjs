import test from "node:test"
import assert from "node:assert/strict"
import { createScreener } from "../api.js"
import { configurePractice, practiceFields, restorePractice } from "./practice.js"
import example from "../examples/questionnaire.json" with { type: "json" }
const base = createScreener()
const stamp = "2026-10-26T01:02:03.000Z"
const reason = "Synthetic practice policy for software tests."

test("practice preferences preserve defaults and replay a documented immutable snapshot", () => {
  const input = { "depression.gate": 3, "anxiety.screen": 12, "alcohol.allowed": [4] }
  const configured = configurePractice(base, input, reason, stamp)
  assert.equal(configured.screener.policy.thresholds.depression.gate, 3)
  assert.equal(base.policy.thresholds.depression.gate, 2)
  assert.equal(configured.screener.policy.id, "practice-custom")
  assert.match(configured.screener.policy.rationale, /depression.gate: 2 → 3/)
  assert.match(configured.screener.policy.rationale, /not validation/)
  assert.equal(configured.changes.length, 3)
  input["depression.gate"] = 6
  assert.equal(configured.preferences.overrides["depression.gate"], 3)
  assert.deepEqual(restorePractice(base, JSON.parse(JSON.stringify(configured.preferences))).screener.configuration, configured.screener.configuration)
  assert.equal(configurePractice(base, { "depression.gate": 2 }, "", stamp).preferences, null)
})

test("practice settings reject invalid, unknown, unsafe and inconsistent overrides", () => {
  for (const overrides of [
    { "depression.gate": -1 }, { "depression.gate": 7 }, { "depression.gate": 2.5 }, { "depression.gate": "3" },
    { "depression.gate": NaN }, { "depression.screen": 28 }, { "trauma.pclItem": 0 },
    { "alcohol.allowed": [] }, { "alcohol.allowed": [3, 3] }, { "alcohol.allowed": [13] },
    { "alcohol.allowed": [4], "alcohol.default": 3 }, { "personality.bands": ["invented"] },
    { "depression.band-0": 12 }, { "patterns.sameRate": 1.1 }, { "phq.safety": 0 },
    JSON.parse('{"__proto__":{}}'),
  ]) assert.throws(() => configurePractice(base, overrides, reason, stamp), TypeError)
  assert.throws(() => configurePractice(base, { "depression.gate": 3 }, "", stamp))
  assert.throws(() => configurePractice(base, { "depression.gate": 3 }, reason, "invalid"))
})

test("saved preferences require review when deployment defaults or questionnaire versions change", () => {
  const saved = configurePractice(base, { "depression.gate": 3 }, reason, stamp).preferences
  const changed = structuredClone(base.policy)
  changed.version = "new-defaults"
  assert.throws(() => restorePractice(createScreener({ policy: changed }), saved), /review/)
  assert.throws(() => restorePractice(base, { ...saved, schemaVersion: 9 }), /review/)
  assert.throws(() => restorePractice(base, { ...saved, responses: {} }), /unknown field/)
})

test("registered brief and full thresholds are editable without changing instrument content", () => {
  const q = { ...example, screenAt: 2 }
  const initial = createScreener({ questionnaires: [q] })
  const result = configurePractice(initial, { "example-checkin.gate": 0, "example-checkin.screen": 3 }, reason, stamp)
  const setup = result.screener.createSetup({ context: "clinical", topics: { depression: false, anxiety: false, trauma: false, "example-checkin": true }, confirmations: { "example-checkin:demonstration": true } })
  assert.equal(result.screener.getSteps(setup, { "example-checkin-1": 0 }).length, 3)
  assert.deepEqual(result.screener.configuration.questionnaires[0].items, example.items)
  assert.equal(result.screener.configuration.questionnaires[0].screenAt, 3)
  assert.equal(practiceFields(initial).find((field) => field.key === "example-checkin.gate").max, 1)
})

test("practice thresholds cannot weaken the independent safety observation", () => {
  const result = configurePractice(base, { "depression.gate": 6 }, reason, stamp)
  const setup = result.screener.createSetup({ context: "clinical" })
  const record = result.screener.record(setup, { "phq-1": 0, "phq-2": 0, "phq-9": 1 })
  assert.equal(record.safetyFlag, true)
  assert.equal(record.symptoms[0].total, null)
})
