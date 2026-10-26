import test from "node:test"
import assert from "node:assert/strict"
import { clinicalScreens, scoreSymptoms } from "./clinical.js"
import { answeredCount, compileRecord, emptySetup, patientPath, scoreAudit, scoreTrauma, setupErrors } from "./engine.js"

const setupFor = (topics = {}) => ({ ...emptySetup(), context: "clinical", auditFee: "no", topics: { ...emptySetup().topics, depression: true, anxiety: true, ...topics } })
const ids = (setup, answers) => patientPath(setup, answers).map((step) => step.id)

for (const screen of clinicalScreens) {
  test(`${screen.brief}: below, at, and above the ≥2 gate; no repeated items`, () => {
    const setup = setupFor()
    for (const value of [0, 1, 2, 3]) {
      const answers = { [`${screen.prefix}-1`]: value, [`${screen.prefix}-2`]: 0 }
      const path = ids(setup, answers)
      assert.equal(path.includes(`${screen.prefix}-3`), value >= 2)
      assert.equal(new Set(path).size, path.length)
      const row = scoreSymptoms(setup, answers).find((row) => row.id === screen.id)
      assert.equal(row.gateScore, value)
      assert.equal(row.opened, value >= 2)
      assert.equal(row.total, null)
    }
  })

  test(`${screen.full}: invalid or missing responses never yield a total`, () => {
    const setup = setupFor()
    for (const bad of [undefined, null, NaN, -1, 4, "2"]) {
      const answers = Object.fromEntries(screen.items.map((_, i) => [`${screen.prefix}-${i + 1}`, 2]))
      answers[`${screen.prefix}-3`] = bad
      const row = scoreSymptoms(setup, answers).find((row) => row.id === screen.id)
      assert.equal(row.status, "incomplete")
      assert.equal(row.total, null)
    }
  })

  test(`${screen.full}: published severity boundaries and screen cutoff`, () => {
    const setup = setupFor()
    setup.followUps[screen.id] = true
    for (let total = 0; total <= screen.max; total += 1) {
      let remaining = total
      const answers = Object.fromEntries(screen.items.map((_, i) => {
        const value = Math.min(3, remaining)
        remaining -= value
        return [`${screen.prefix}-${i + 1}`, value]
      }))
      const row = scoreSymptoms(setup, answers).find((row) => row.id === screen.id)
      assert.equal(row.total, total)
      assert.equal(row.positive, total >= 10)
      const expected = screen.id === "depression"
        ? total < 5 ? "Minimal" : total < 10 ? "Mild" : total < 15 ? "Moderate" : total < 20 ? "Moderately severe" : "Severe"
        : total < 5 ? "Minimal" : total < 10 ? "Mild" : total < 15 ? "Moderate" : "Severe"
      assert.equal(row.band, expected)
    }
  })

  test(`${screen.full}: reducing the gate deactivates stale follow-up scores`, () => {
    const setup = setupFor()
    const answers = Object.fromEntries(screen.items.map((_, i) => [`${screen.prefix}-${i + 1}`, 3]))
    assert.equal(scoreSymptoms(setup, answers).find((r) => r.id === screen.id).status, "scored")
    answers[`${screen.prefix}-1`] = 0
    answers[`${screen.prefix}-2`] = 0
    const row = scoreSymptoms(setup, answers).find((r) => r.id === screen.id)
    assert.equal(row.status, "gate-closed")
    assert.equal(row.total, null)
    assert.equal(row.safetyFlag, screen.id === "depression")
    assert.equal(ids(setup, answers).includes(`${screen.prefix}-3`), false)
    setup.followUps[screen.id] = true
    assert.equal(scoreSymptoms(setup, answers).find((r) => r.id === screen.id).status, "scored")
  })
}

test("all brief screens precede follow-ups, including when a gate opens early", () => {
  const setup = setupFor({ alcohol: true, trauma: true, personality: true, validity: true })
  const answers = { "phq-1": 2, "phq-2": 0, "gad-1": 2, "gad-2": 0, "audit-1": 1, "audit-2": 1, "audit-3": 1, "pcptsd-exposure": "yes" }
  const path = patientPath(setup, answers)
  const firstFollowup = path.findIndex((step) => step.stage === 2)
  assert.ok(firstFollowup > 0)
  assert.equal(path.slice(firstFollowup).some((step) => step.stage === 1), false)
  assert.equal(new Set(path.map((step) => step.id)).size, path.length)
  assert.equal(path.find((step) => step.id === "phq-3").stage, 2)
})

test("a negative core sitting is five questions when no trauma is endorsed", () => {
  const setup = setupFor({ trauma: true })
  const answers = { "phq-1": 0, "phq-2": 0, "gad-1": 0, "gad-2": 0, "pcptsd-exposure": "no" }
  assert.equal(patientPath(setup, answers).length, 5)
  assert.equal(answeredCount(setup, answers).finished, true)
  const record = compileRecord(setup, answers)
  assert.equal(record.symptoms.every((row) => row.status === "gate-closed"), true)
  assert.equal(record.symptoms.every((row) => row.total === null), true)
  assert.match(record.text, /Safety review: not recorded/)
  assert.match(record.text, /negative gates do not exclude/i)
  assert.equal(record.total, undefined)
})

test("AUDIT-C thresholds 3 and 4 are inclusive and the first 3 answers carry forward", () => {
  const setup = setupFor({ depression: false, anxiety: false, alcohol: true })
  for (const threshold of [3, 4]) {
    setup.auditThreshold = threshold
    for (const value of [threshold - 1, threshold]) {
      const answers = { "audit-1": value, "audit-2": 0, "audit-3": 0 }
      const path = ids(setup, answers)
      assert.equal(path.includes("audit-4"), value >= threshold)
      assert.equal(path.filter((id) => id === "audit-1").length, 1)
      for (let i = 4; i <= 10; i++) answers[`audit-${i}`] = 0
      const row = scoreAudit(setup, answers)
      assert.equal(row.gateScore, value)
      assert.equal(row.status, value >= threshold ? "scored" : "gate-closed")
      assert.equal(row.total, value >= threshold ? value : undefined)
    }
  }
})

test("an incomplete AUDIT-C never opens follow-up and invalid scores are refused", () => {
  const setup = setupFor({ alcohol: true })
  for (const answers of [{ "audit-1": 4 }, { "audit-1": 4, "audit-2": 4, "audit-3": 9 }]) {
    assert.equal(ids(setup, answers).includes("audit-4"), false)
    assert.equal(scoreAudit(setup, answers).status, "incomplete")
  }
  setup.auditThreshold = null
  assert.match(setupErrors(setup).join(" "), /threshold/)
  assert.equal(ids(setup, { "audit-1": 4, "audit-2": 4, "audit-3": 4 }).includes("audit-4"), false)
  assert.equal(scoreAudit(setup, { "audit-1": 4, "audit-2": 4, "audit-3": 4 }).status, "incomplete")
})

test("a clinician can request a full screen independently of a negative gate", () => {
  const setup = setupFor({ trauma: true, alcohol: true })
  Object.assign(setup.followUps, { depression: true, anxiety: true, alcohol: true, trauma: true })
  const answers = { "phq-1": 0, "phq-2": 0, "gad-1": 0, "gad-2": 0, "audit-1": 0, "audit-2": 0, "audit-3": 0, "pcptsd-exposure": "yes" }
  for (let i = 1; i <= 5; i++) answers[`pcptsd-${i}`] = "no"
  const path = ids(setup, answers)
  for (const id of ["phq-3", "gad-3", "audit-4", "pcl-1"]) assert.ok(path.includes(id))
  assert.equal(scoreTrauma(answers, setup).override, true)
  assert.equal(scoreSymptoms(setup, answers)[0].override, true)
})

test("PHQ-9 item 9 flags review even when the PHQ-9 total is below 10", () => {
  const setup = setupFor({ anxiety: false })
  const answers = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`phq-${i + 1}`, 0]))
  answers["phq-1"] = 2
  answers["phq-9"] = 1
  const record = compileRecord(setup, answers)
  assert.equal(record.symptoms[0].total, 3)
  assert.equal(record.symptoms[0].positive, false)
  assert.equal(record.safetyFlag, true)
  assert.match(record.text, /PRIORITY: PHQ-9 item 9/)
  assert.equal(ids(setup, answers).includes("phq-difficulty"), true)
  answers["phq-difficulty"] = 3
  assert.equal(compileRecord(setup, answers).symptoms[0].total, 3)
  answers["phq-1"] = 0
  const edited = compileRecord(setup, answers)
  assert.equal(edited.symptoms[0].status, "gate-closed")
  assert.equal(edited.symptoms[0].total, null)
  assert.equal(edited.safetyFlag, true, "editing a gate cannot erase a known self-harm response")
  setup.topics.depression = false
  const deselected = compileRecord(setup, answers)
  assert.equal(deselected.safetyFlag, true, "deselecting a domain cannot erase a known safety response")
  assert.match(deselected.text, /Retained safety observation/)
})

test("forensic records retain sources, local notes, and response-validity limits", () => {
  const setup = setupFor()
  setup.context = "forensic"
  const answers = { "phq-1": 0, "phq-2": 0, "gad-1": 0, "gad-2": 0 }
  const record = compileRecord(setup, answers, { safetyReview: "Follow-up required", facts: "Compare with the referral material.", flags: { suicide: "Yes" } })
  assert.match(record.text, /Not calibrated on a forensic sample/)
  assert.match(record.text, /Follow-up required/)
  assert.match(record.text, /Compare with the referral material/)
  assert.match(record.text, /Any yes on the current healthcare form: Yes/)
  assert.ok(record.references.some((ref) => ref.id === "levis2020"))
  assert.ok(record.references.some((ref) => ref.id === "cssrs"))
  assert.match(record.text, /Response record/)
  assert.match(record.text, /phq-1\./)
})
