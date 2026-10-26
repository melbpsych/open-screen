import test from "node:test"
import assert from "node:assert/strict"
import { createScreener } from "../api.js"
import { clinicalScreens } from "./clinical.js"
import { answeredCount, compileRecord, emptySetup, nextStep, patientPath, scoreDass, scoreTrauma } from "./engine.js"
import { scoreValidity, validityItems } from "./validity.js"
import { buildReport, clinicalSummary, reportMarkup, panelHtml, resultPanels, scoreChart, scoreChartModel } from "../presentation.js"

const setupFor = () => ({ ...emptySetup(), context: "clinical", topics: { ...emptySetup().topics, depression: true, anxiety: true } })
const knownRecord = () => {
  const setup = setupFor()
  const answers = { "phq-1": 2, "phq-2": 1, "phq-3": 1, "phq-4": 2, "phq-5": 1, "phq-6": 1, "phq-7": 1, "phq-8": 1, "phq-9": 0, "phq-difficulty": 1, "gad-1": 0, "gad-2": 0 }
  return { setup, answers, record: compileRecord(setup, answers) }
}

test("PHQ-9 graph puts each score on the correct side of every severity boundary", () => {
  const expected = [[0, "Minimal"], [4, "Minimal"], [5, "Mild"], [9, "Mild"], [10, "Moderate"], [14, "Moderate"], [15, "Moderately severe"], [19, "Moderately severe"], [20, "Severe"], [27, "Severe"]]
  for (const [value, label] of expected) {
    const model = scoreChartModel({ value, max: 27, bands: clinicalScreens[0].bands })
    const selected = model.regions.find((region) => region.selected)
    assert.equal(selected.label, label)
    assert.ok(model.point > selected.left && model.point < selected.left + selected.width)
    assert.equal(model.regions[0].from, 0)
    assert.equal(model.regions.at(-1).to, 27)
    assert.ok(Math.abs(model.regions.reduce((sum, region) => sum + region.width, 0) - 100) < 1e-9)
  }
})

test("a gate marker and its cutoff cannot visually disagree about an inclusive threshold", () => {
  for (const [max, threshold] of [[6, 2], [12, 3], [12, 4], [5, 3]]) {
    const below = scoreChartModel({ value: threshold - 1, max, threshold })
    const at = scoreChartModel({ value: threshold, max, threshold })
    assert.ok(below.point < below.cut)
    assert.ok(at.point > at.cut)
  }
})

test("graphs refuse missing, fractional, nonfinite, and out-of-range scores", () => {
  for (const value of [undefined, null, NaN, Infinity, -1, 28, 1.5, "10"]) assert.equal(scoreChartModel({ value, max: 27 }), null)
  assert.throws(() => scoreChartModel({ value: 3, max: 27, bands: [[5, "Low"]] }), /cover/)
  const html = scoreChart({ label: "PHQ-9", value: null, max: 27 })
  assert.doesNotMatch(html, /<svg/)
  assert.match(html, /No complete score/)
})

test("report panels use engine totals and never substitute a brief score for an unadministered full scale", () => {
  const { record } = knownRecord()
  const [phq, gad] = resultPanels(record)
  assert.equal(phq.instrument, "PHQ-9")
  assert.equal(phq.value, 10)
  assert.equal(phq.band, "Moderate")
  assert.equal(gad.instrument, "GAD-2")
  assert.equal(gad.value, 0)
  assert.equal(gad.max, 6)
  assert.equal(gad.status, "gate-closed")
  assert.doesNotMatch(panelHtml(gad), /GAD-7 0/)
  assert.match(panelHtml(phq), /data-value="10" data-max="27"/)
})

test("the screen and report share identical graphs and do not label raw clinical scores as probabilities", () => {
  const { record } = knownRecord()
  const report = buildReport(record)
  const panel = resultPanels(record)[0]
  assert.ok(report.includes(panelHtml(panel)))
  assert.doesNotMatch(panelHtml(panel), /percentile|chance|probability|risk percentage/i)
  assert.match(report, /<svg/)
})

test("a negative exposure screen distinguishes its zero-by-stop-rule from five symptom responses", () => {
  const setup = setupFor()
  setup.topics.trauma = true
  const record = compileRecord(setup, { "pcptsd-exposure": "no" })
  const panel = resultPanels(record).find((row) => row.id === "trauma")
  assert.equal(panel.value, 0)
  assert.equal(panel.badge, "No exposure reported")
  assert.match(panel.brief, /0 by stop rule/)
  assert.match(panel.note, /Symptom questions skipped/)
  assert.match(clinicalSummary(record), /Symptom questions skipped/)
  assert.match(buildReport(record), /No exposure reported/)
})

test("HTML export escapes all user text and has no remote resources or scripts", () => {
  const { record } = knownRecord()
  const clinician = { reference: '<img src=x onerror="alert(1)">', facts: "</p><script>alert('x')</script>", flags: { suicide: "Yes" }, safetyReview: "Follow-up required" }
  const report = buildReport(record, clinician)
  assert.doesNotMatch(report, /<script|<img|<iframe|<link|<form/i)
  assert.match(report, /&lt;script&gt;/)
  assert.match(report, /Content-Security-Policy/)
  assert.match(report, /Follow-up required/)
  assert.match(report, /Any yes on the current healthcare form: Yes/)
})

test("the response appendix is an explicit export choice", () => {
  const { record } = knownRecord()
  assert.doesNotMatch(buildReport(record), /report-appendix"><h2>/)
  assert.match(buildReport(record, {}, { appendix: true }), /Full record & response appendix/)
  assert.match(buildReport(record, {}, { appendix: true }), /phq-1\./)
})

test("optional trait extensions appear in summaries and reports without requiring the response appendix", () => {
  const setup = setupFor()
  setup.topics.personality = true
  const answers = { EXT7: 4, EST1: 5, AGR1: 1, CSN6: 2, OPN8: 3 }
  for (const step of patientPath(setup, answers)) if (step.id.startsWith("ipip-")) answers[step.id] = 3
  const record = compileRecord(setup, answers)
  assert.ok(record.ipip.some((row) => row.status === "scored"))
  for (const row of record.ipip) {
    assert.ok(clinicalSummary(record).includes(`${row.sum}/50`))
    assert.ok(buildReport(record).includes(`${row.sum}/50`))
  }
  assert.match(buildReport(record), /No clinical severity bands/)
})

test("copy summary retains scores, safety status, notes, overrides and context", () => {
  const { setup, answers } = knownRecord()
  setup.context = "forensic"
  setup.followUps.depression = true
  answers["phq-9"] = 1
  const clinician = { reference: "CASE-001", safetyReview: "Follow-up required", facts: "Compare with the interview." }
  const text = clinicalSummary(compileRecord(setup, answers, clinician), clinician)
  assert.match(text, /PHQ-9 11\/27/)
  assert.match(text, /GAD-2 0\/6/)
  assert.match(text, /PRIORITY/)
  assert.match(text, /CASE-001/)
  assert.match(text, /Clinician requested/)
  assert.match(text, /Compare with the interview/)
  assert.match(text, /not calibrated/)
})

test("public presentation helpers retain recorded clinician fields unless explicitly overridden", () => {
  const { answers } = knownRecord()
  const app = createScreener()
  const record = app.record(app.createSetup({ context: "clinical" }), answers, { reference: "SYNTHETIC-RECORDED", facts: "Recorded clinical follow-up", safetyReview: "Follow-up required", flags: { suicide: "Yes" } })
  for (const render of [clinicalSummary, reportMarkup, buildReport]) {
    const output = render(record)
    for (const value of ["SYNTHETIC-RECORDED", "Recorded clinical follow-up", "Follow-up required", "Any yes on the current healthcare form: Yes"]) assert.ok(output.includes(value), value)
    const overridden = render(record, { reference: "SYNTHETIC-OVERRIDE", facts: "Current edits" })
    assert.match(overridden, /SYNTHETIC-OVERRIDE/)
    assert.match(overridden, /Current edits/)
    assert.doesNotMatch(overridden, /SYNTHETIC-RECORDED|Recorded clinical follow-up/)
  }
})

test("malformed PC-PTSD-5 and PCL-5 responses are never scored as negative or complete", () => {
  const answers = { "pcptsd-exposure": "yes" }
  for (let i = 1; i <= 5; i++) answers[`pcptsd-${i}`] = "yes"
  answers["pcptsd-3"] = "maybe"
  assert.equal(scoreTrauma(answers).status, "incomplete")
  answers["pcptsd-3"] = "yes"
  for (let i = 1; i <= 20; i++) answers[`pcl-${i}`] = 0
  for (const bad of [undefined, null, -1, 5, "2", NaN]) {
    answers["pcl-1"] = bad
    assert.equal(scoreTrauma(answers).pcl.status, "incomplete")
  }
})

test("DASS and IPIP response-pattern scores fail closed on invalid answers", () => {
  const setup = { ...emptySetup(), definedPatientGroup: true, scoresToClinician: true, scaleNotSold: true, topics: { ...emptySetup().topics, irritability: true } }
  const dass = Object.fromEntries(patientPath(setup).map((step) => [step.id, 0]))
  const first = Object.keys(dass)[0]
  dass[first] = 4
  assert.equal(scoreDass(setup, dass).status, "incomplete")
  const validity = Object.fromEntries(validityItems.map((item) => [item.id, 3]))
  validity[validityItems[0].id] = undefined
  assert.equal(scoreValidity(validity).status, "incomplete")
})

test("navigation completion requires a valid response, not just an answer key", () => {
  const setup = setupFor()
  const answers = { "phq-1": undefined, "phq-2": 0, "gad-1": 0, "gad-2": 0 }
  assert.equal(answeredCount(setup, answers).finished, false)
  assert.equal(nextStep(setup, answers).id, "phq-1")
})

test("closing an edited gate does not claim the earlier follow-up was never administered", () => {
  const { setup, answers } = knownRecord()
  answers["phq-1"] = 0
  answers["phq-2"] = 0
  const row = compileRecord(setup, answers).symptoms[0]
  assert.equal(row.priorFollowUp, true)
  assert.equal(row.difficulty, null)
  assert.doesNotMatch(row.sentence, /not administered/)
  assert.match(row.sentence, /earlier follow-up answers/)
})

test("selected clinical domains cannot produce empty external-form cards", () => {
  const setup = setupFor()
  Object.assign(setup.topics, { alcohol: true, trauma: true })
  const record = compileRecord(setup)
  assert.ok(record.cards.every((card) => card.title && card.kind && card.sentence))
})


test('history presentation rejects nonnumeric ranges and safely escapes labels', async () => {
  const {historyMarkup}=await import('../presentation.js')
  const series=[{label:'<img src=x onerror=alert(1)>',min:0,max:6,settingsChanged:false,points:[{date:'2026-10-01T00:00:00Z',value:1,policy:'<script>'},{date:'2026-10-02T00:00:00Z',value:2,policy:'default'}]}]
  const html=historyMarkup(series)
  assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;script&gt;'))
  assert.throws(()=>historyMarkup([{...series[0],min:'<script>'}]),/Invalid history/)
  assert.throws(()=>historyMarkup([{...series[0],points:[{date:'invalid',value:3,policy:'default'}]}]),/Invalid history/)
})
