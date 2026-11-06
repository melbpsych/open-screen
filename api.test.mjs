import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import example from "./examples/questionnaire.json" with { type: "json" }
import { API_VERSION, createScreener, exportJSON } from "./api.js"
import { DEFAULT_POLICY, validatePolicy } from "./policy.js"
import { buildReport, clinicalSummary, resultPanels } from "./presentation.js"
import { validityItems } from "./gates/validity.js"

const clock = () => "2026-10-25T12:00:00.000Z"
const copyPolicy = () => structuredClone(DEFAULT_POLICY)
const mood = { "phq-1": 2, "phq-2": 0, "gad-1": 0, "gad-2": 0, "pcptsd-exposure": "no" }
const only = (id) => Object.fromEntries(["depression", "anxiety", "trauma", "alcohol", "personality", "validity", "irritability", id].map((key) => [key, key === id]))

test("the public factory retains default clinical routes and records versioned configuration", () => {
  const app = createScreener({ clock })
  const setup = app.createSetup({ context: "clinical" })
  assert.equal(app.apiVersion, API_VERSION)
  assert.equal(setup.auditThreshold, null)
  assert.equal(app.getSteps(setup).length, 5)
  assert.ok(app.getSteps(setup, mood).some((row) => row.id === "phq-9"))
  const record = app.record(setup, mood)
  assert.equal(record.generatedAt, clock())
  assert.equal(record.symptoms[0].threshold, 2)
  assert.equal(record.configuration.policy.version, DEFAULT_POLICY.version)
  assert.ok(Object.isFrozen(record.configuration.policy.thresholds))
  assert.equal(record.total, undefined)
  assert.throws(() => app.record(app.createSetup()), /context/)
  const exposure = app.getSteps(setup).find((row) => row.id === "pcptsd-exposure")
  const originalExample = exposure.examples[0]
  exposure.examples[0] = "Changed by host"
  assert.equal(app.getSteps(setup).find((row) => row.id === "pcptsd-exposure").examples[0], originalExample)
})

test("per-instance thresholds, classifications, and charts change together without global mutation", () => {
  const policy = copyPolicy()
  policy.id = "custom-practice"
  policy.version = "test-2"
  policy.rationale = "Synthetic test policy; not a clinical recommendation."
  policy.thresholds.depression.gate = 3
  policy.thresholds.depression.screen = 15
  policy.thresholds.depression.bands = [[15, "Below custom cut"], [28, "At custom cut"]]
  policy.thresholds.trauma.gate = 4
  const original = createScreener()
  const custom = createScreener({ policy })
  const setup = custom.createSetup({ context: "clinical" })
  assert.equal(custom.getSteps(setup, mood).some((row) => row.id === "phq-9"), false)
  assert.equal(original.getSteps(original.createSetup({ context: "clinical" }), mood).some((row) => row.id === "phq-9"), true)
  const answers = { ...mood, "phq-1": 3 }
  for (let i = 3; i <= 9; i++) answers[`phq-${i}`] = 1
  const record = custom.record(setup, answers)
  const panel = resultPanels(record)[0]
  assert.equal(record.symptoms[0].positive, false)
  assert.equal(panel.band, "Below custom cut")
  assert.deepEqual(panel.bands, policy.thresholds.depression.bands)
  assert.match(record.symptoms[0].evidence, /custom configuration/)
  assert.match(buildReport(record), /PHQ-2 ≥3/)
  assert.match(clinicalSummary(record), /custom-practice/)
  policy.thresholds.depression.gate = 6
  assert.equal(custom.policy.thresholds.depression.gate, 3)
  assert.equal(DEFAULT_POLICY.thresholds.depression.gate, 2)
})

test("custom trauma gates and PCL item thresholds affect navigation and provisional patterns", () => {
  const policy = copyPolicy()
  policy.thresholds.trauma.gate = 4
  policy.thresholds.trauma.pclItem = 3
  const app = createScreener({ policy })
  const setup = app.createSetup({ context: "clinical", topics: only("trauma") })
  const answers = { "pcptsd-exposure": "yes" }
  for (let i = 1; i <= 5; i++) answers[`pcptsd-${i}`] = i <= 3 ? "yes" : "no"
  assert.equal(app.getSteps(setup, answers).some((row) => row.id === "pcl-1"), false)
  answers["pcptsd-4"] = "yes"
  assert.ok(app.getSteps(setup, answers).some((row) => row.id === "pcl-20"))
  for (let i = 1; i <= 20; i++) answers[`pcl-${i}`] = 2
  const record = app.record(setup, answers)
  assert.equal(record.trauma.threshold, 4)
  assert.equal(record.trauma.pcl.provisional, false)
  assert.equal(record.trauma.pcl.endorsementThreshold, 3)
  assert.match(buildReport(record), /item ≥3/)
})

test("invalid, misspelled, nonfinite or ambiguous policy settings fail at registration", () => {
  for (const change of [
    (p) => p.thresholds.depression.gate = "3",
    (p) => p.thresholds.depression.gate = 7,
    (p) => p.thresholds.depression.openAt = 3,
    (p) => p.thresholds.depression.bands = [[5, "Missing remainder"]],
    (p) => p.thresholds.alcohol.allowed = [3, 3],
    (p) => p.thresholds.alcohol.default = 12,
    (p) => p.responsePatterns.screenMean = NaN,
    (p) => p.defaults.topics = ["typo"],
    (p) => p.schemaVersion = 99,
  ]) {
    const policy = copyPolicy()
    change(policy)
    assert.throws(() => validatePolicy(policy), TypeError)
  }
})

test("a registered questionnaire needs no engine or report changes, preserves response codes, and carries shared items once", () => {
  const app = createScreener({ questionnaires: [example] })
  const setup = app.createSetup({ context: "clinical", topics: only(example.id), confirmations: { "example-checkin:demonstration": true } })
  assert.ok(app.catalog.some((row) => row.id === example.id))
  assert.deepEqual(app.getSteps(setup).map((row) => row.id), ["example-checkin-1"])
  const answers = { "example-checkin-1": 1, "example-checkin-2": 2, "example-checkin-3": 0 }
  const steps = app.getSteps(setup, answers)
  assert.equal(new Set(steps.map((row) => row.id)).size, 3)
  assert.deepEqual(steps.map((row) => row.stage), [1, 2, 2])
  const record = app.record(setup, answers)
  assert.equal(record.additional[0].total, 4) // code 0 on the reverse-keyed final item contributes 1
  assert.equal(record.responses["example-checkin-3"], 0)
  assert.equal(resultPanels(record)[0].value, 4)
  assert.match(buildReport(record), /Example check-in/)
  assert.match(clinicalSummary(record), /4\/4/)
  assert.ok(app.licences(setup, answers).some((row) => row.title === example.title))
})

test("requirements fail closed; unopened and stale questionnaire follow-ups never produce totals", () => {
  const app = createScreener({ questionnaires: [example] })
  const setup = app.createSetup({ context: "clinical", topics: only(example.id) })
  assert.equal(app.getSteps(setup).length, 0)
  assert.equal(app.progress(setup).finished, false)
  assert.match(app.setupErrors(setup).join(" "), /synthetic development/)
  assert.equal(app.record(setup).additional[0].status, "omitted")
  setup.confirmations["example-checkin:demonstration"] = true
  const answers = { "example-checkin-1": 0, "example-checkin-2": 2, "example-checkin-3": 0 }
  assert.equal(app.record(setup, answers).additional[0].status, "gate-closed")
  assert.equal(app.record(setup, answers).additional[0].total, null)
  setup.followUps[example.id] = true
  assert.equal(app.record(setup, answers).additional[0].total, 3)
})

test("a one-stage questionnaire completes without inventing a follow-up gate", () => {
  const definition = structuredClone(example)
  delete definition.gate
  const app = createScreener({ questionnaires: [definition] })
  const setup = app.createSetup({ context: "clinical", topics: only(definition.id), confirmations: { "example-checkin:demonstration": true } })
  assert.equal(app.getSteps(setup).length, 3)
  assert.ok(app.getSteps(setup).every((step) => step.stage === 1))
  const record = app.record(setup, { "example-checkin-1": 0, "example-checkin-2": 0, "example-checkin-3": 1 })
  assert.equal(record.additional[0].total, 0)
  assert.equal(record.additional[0].threshold, null)
})

test("registered questionnaires can be selected by policy defaults; unregistered defaults fail at composition", () => {
  const policy = copyPolicy()
  policy.defaults.topics = [example.id]
  policy.defaults.primaryTopics = [example.id]
  const app = createScreener({ policy, questionnaires: [example] })
  const setup = app.createSetup()
  assert.equal(setup.topics[example.id], true)
  assert.equal(setup.topics.depression, false)
  assert.throws(() => createScreener({ policy }), /Unknown topic/)
})

test("personality follow-up and response-pattern settings are applied per instance", () => {
  const policy = copyPolicy()
  policy.personality.followUpBands = []
  policy.responsePatterns.screenMean = 5
  const custom = createScreener({ policy })
  const setup = custom.createSetup({ context: "clinical", topics: only("personality") })
  const answers = { EXT7: 4, EST1: 5, AGR1: 1, CSN6: 2, OPN8: 3 }
  assert.equal(custom.getSteps(setup, answers).some((row) => row.id.startsWith("ipip-")), false)
  assert.equal(custom.record(setup, answers).ipip.length, 0)
  const standard = createScreener()
  assert.ok(standard.getSteps(standard.createSetup({ context: "clinical", topics: only("personality") }), answers).some((row) => row.id.startsWith("ipip-")))
  const pattern = Object.fromEntries(validityItems.map((row) => [row.id, row.reverse ? 2 : 4]))
  assert.equal(standard.record(standard.createSetup({ context: "clinical", topics: only("validity") }), pattern).validity.positiveImpression, true)
  assert.equal(custom.record(custom.createSetup({ context: "clinical", topics: only("validity") }), pattern).validity.positiveImpression, false)
})

test("definition text is escaped in every additional-result report path", () => {
  const definition = structuredClone(example)
  definition.label = '<img src=x onerror="alert(1)">'
  definition.source.limits = '</p><script>alert(1)</script>'
  const app = createScreener({ questionnaires: [definition] })
  const setup = app.createSetup({ context: "clinical", topics: only(definition.id), confirmations: { "example-checkin:demonstration": true } })
  const html = buildReport(app.record(setup, { "example-checkin-1": 1, "example-checkin-2": 0, "example-checkin-3": 0 }))
  assert.doesNotMatch(html, /<img|<script/)
  assert.match(html, /&lt;img/)
  assert.match(html, /&lt;script/)
})

test("registration rejects collisions, malformed scoring keys, unknown definition fields and unsafe source URLs", () => {
  assert.throws(() => createScreener({ questionnaires: [example, example] }), /Duplicate topic/)
  for (const change of [
    (q) => q.license.id = "proprietary",
    (q) => q.source.url = "javascript:alert(1)",
    (q) => q.items[0].options[0].score = Infinity,
    (q) => q.items[0].options[0].value = 1,
    (q) => q.calculate = "eval('x')",
    (q) => q.items[1].id = q.items[0].id,
  ]) {
    const definition = structuredClone(example)
    change(definition)
    assert.throws(() => createScreener({ questionnaires: [definition] }))
  }
  const collision = structuredClone(example)
  collision.id = "phq"
  collision.items.forEach((row, i) => row.id = `phq-${i + 1}`)
  assert.throws(() => createScreener({ questionnaires: [collision] }), /Duplicate response/)
})

test("versioned exports replay the same rules; raw responses and event descriptions are opt-in", () => {
  const app = createScreener({ clock, questionnaires: [example] })
  const setup = app.createSetup({ context: "forensic" })
  const record = app.record(setup, { ...mood, "pcl-event": "SYNTHETIC SENSITIVE EVENT" }, { reference: "DEMO", facts: "Synthetic notes" })
  const brief = exportJSON(record)
  assert.doesNotMatch(brief, /SYNTHETIC SENSITIVE EVENT|"responses"|"text": "Open Screen clinician record/)
  const full = JSON.parse(exportJSON(record, { includeResponses: true }))
  assert.equal(full.responses["phq-1"], 2)
  const replay = createScreener({ policy: full.configuration.policy, questionnaires: full.configuration.questionnaires, clock })
  assert.deepEqual(replay.record(replay.createSetup(full.setup), full.responses, full.clinician), record)
  assert.equal(record.responses["pcl-event"], "SYNTHETIC SENSITIVE EVENT")
})

test("invalid imported responses are explicit errors and never echoed in error messages", () => {
  const app = createScreener()
  const setup = app.createSetup({ context: "clinical" })
  assert.deepEqual(app.validateAnswers({ "phq-1": "SYNTHETIC SECRET" }), [{ id: "phq-1", code: "invalid-response" }])
  for (const value of [false, "2", 1.5, NaN, Infinity, undefined, null, 4]) {
    assert.throws(() => app.record(setup, { "phq-1": value }), /invalid-response/)
  }
  assert.throws(() => app.record(setup, { "phq-1": "SYNTHETIC SECRET" }), (error) => !error.message.includes("SYNTHETIC SECRET"))
  assert.throws(() => app.getSteps(setup, { typo: 0 }), /unknown-item/)
  assert.throws(() => app.createSetup({ contex: "clinical" }), /unknown field/)
  assert.throws(() => app.createSetup({ topics: false }), /plain object/)
  assert.throws(() => createScreener({ polciy: DEFAULT_POLICY }), /unknown field/)
  assert.throws(() => app.record(setup, {}, { facts: "x".repeat(20001) }), /clinician.facts/)
  assert.throws(() => app.createSetup(JSON.parse('{"topics":{"__proto__":true}}')), /unknown field/)
})

test("a retained safety response survives changed gates and deselection at the public boundary", () => {
  const app = createScreener()
  const setup = app.createSetup({ context: "forensic", topics: only("trauma") })
  const record = app.record(setup, { "phq-9": 1, "pcptsd-exposure": "no" })
  assert.equal(record.safetyFlag, true)
  assert.match(buildReport(record), /PHQ-9 item 9 was endorsed/)
  assert.match(clinicalSummary(record), /PHQ-9 item 9/)
})

test("an integration can import and run the API without browser globals", () => {
  const result = execFileSync(process.execPath, ["--input-type=module", "-e", `Object.defineProperty(globalThis, 'document', {get(){throw Error('DOM access')}}); const {createScreener}=await import('./api.js'); const app=createScreener(); console.log(app.getSteps(app.createSetup()).length)`], { cwd: import.meta.dirname, encoding: "utf8" })
  assert.equal(result.trim(), "5")
})
