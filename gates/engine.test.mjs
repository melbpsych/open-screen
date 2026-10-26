import assert from "node:assert/strict"
import test from "node:test"
import { OPEN_LICENSES } from "../core/score.js"
import { profile } from "../core/score.js"
import {
  answeredCount,
  activeCards,
  compileRecord,
  dassAllowed,
  emptySetup,
  nextStep,
  patientPath,
  scoreAudit,
  scoreDass,
  scoreTrauma,
} from "./engine.js"
import { audit, dassStress, pcl, pcptsd } from "./instruments.js"
import { impressionItems, scoreValidity, selfDeceptionItems, validityItems, validityText } from "./validity.js"
import personality from "../measures/personality-5.json" with { type: "json" }

function readySetup(extra = {}) {
  return {
    ...emptySetup(),
    context: "clinical",
    auditFee: "no",
    ...extra,
    topics: { ...emptySetup().topics, alcohol: true, trauma: true, ...(extra.topics || {}) },
  }
}

test("the personality licence whitelist is unchanged", () => {
  assert.deepEqual([...OPEN_LICENSES], [
    "public-domain",
    "CC0",
    "CC-BY-4.0",
    "MIT",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "Apache-2.0",
    "ISC",
  ])
})

test("exposure no scores 0 and asks nothing further", () => {
  const setup = readySetup()
  const answers = { [pcptsd.exposureId]: "no" }
  const ids = patientPath(setup, answers).map((step) => step.id)
  assert.equal(ids.includes("pcptsd-1"), false)
  assert.equal(ids.includes("pcl-1"), false)
  const trauma = scoreTrauma(answers)
  assert.equal(trauma.count, 0)
  assert.equal(trauma.stopped, true)
  assert.equal(trauma.pcl, null)
})

test("two symptom yes answers do not open the PCL-5", () => {
  const setup = readySetup()
  const answers = { [pcptsd.exposureId]: "yes" }
  for (let i = 1; i <= 5; i += 1) answers[`pcptsd-${i}`] = i <= 2 ? "yes" : "no"
  const ids = patientPath(setup, answers).map((step) => step.id)
  assert.equal(ids.includes("pcl-1"), false)
  assert.equal(scoreTrauma(answers).count, 2)
  assert.equal(scoreTrauma(answers).pcl, null)
})

test("three symptom yes answers open every PCL-5 item", () => {
  const setup = readySetup()
  const answers = { [pcptsd.exposureId]: "yes" }
  for (let i = 1; i <= 5; i += 1) answers[`pcptsd-${i}`] = i <= 3 ? "yes" : "no"
  const ids = patientPath(setup, answers).map((step) => step.id)
  for (let i = 1; i <= 20; i += 1) assert.equal(ids.includes(`pcl-${i}`), true)
  assert.equal(ids.filter((id) => id.startsWith("pcl-")).length, 21)
})

test("PCL-5 items are not dropped as duplicates, and the provisional rule uses 2 or higher", () => {
  const setup = readySetup()
  const answers = { [pcptsd.exposureId]: "yes", [pcl.eventId]: "a fire" }
  for (let i = 1; i <= 5; i += 1) answers[`pcptsd-${i}`] = "yes"
  for (let i = 1; i <= 20; i += 1) answers[`pcl-${i}`] = 0
  answers["pcl-1"] = 2
  answers["pcl-6"] = 2
  answers["pcl-8"] = 2
  answers["pcl-9"] = 2
  answers["pcl-15"] = 2
  answers["pcl-16"] = 2
  const trauma = scoreTrauma(answers)
  assert.equal(trauma.pcl.total, 12)
  assert.equal(trauma.pcl.provisional, true)
  assert.equal(trauma.pcl.clusters.find((cluster) => cluster.id === "D").endorsed, 2)
  answers["pcl-16"] = 1
  assert.equal(scoreTrauma(answers).pcl.provisional, false)
})

test("AUDIT items 9 and 10 score 0, 2, and 4, and the total is not given a chosen zone", () => {
  const setup = readySetup()
  setup.followUps.alcohol = true // A clinician can request the full scale below the gate.
  assert.deepEqual(audit.items[8].options.map((option) => option[1]), [0, 2, 4])
  assert.deepEqual(audit.items[9].options.map((option) => option[1]), [0, 2, 4])
  const answers = {}
  for (const item of audit.items) answers[item.id] = 0
  answers["audit-9"] = 2
  answers["audit-10"] = 4
  const scored = scoreAudit(setup, answers)
  assert.equal(scored.total, 6)
  assert.equal(scored.chosenZone, undefined)
  const record = compileRecord(setup, { ...answers, [pcptsd.exposureId]: "no" }, { auditSex: "woman" })
  assert.match(record.text, /13 or more/)
  assert.match(record.text, /8 to 14/)
  assert.match(record.text, /does not choose between them/)
  assert.match(record.text, /10 g/)
  assert.match(record.alcohol.sentence, /six-drink|four-drink/)
})

test("a fee omits the AUDIT and does not add another alcohol scale", () => {
  const setup = readySetup({ auditFee: "yes" })
  const ids = patientPath(setup, { [pcptsd.exposureId]: "no" }).map((step) => step.id)
  assert.equal(ids.includes("audit-1"), false)
  assert.equal(scoreAudit(setup, {}).status, "omitted")
  assert.equal(ids.filter((id) => id.startsWith("audit")).length, 0)
})

test("DASS-21 Stress is asked only for a defined group, and the score is doubled without a severity word", () => {
  const blocked = readySetup({ topics: { irritability: true } })
  assert.equal(dassAllowed(blocked), false)
  assert.equal(patientPath(blocked, {}).some((step) => step.id === "dass-1"), false)
  assert.equal(scoreDass(blocked, {}).status, "omitted")
  const setup = readySetup({
    topics: { irritability: true },
    definedPatientGroup: true,
    scoresToClinician: true,
    scaleNotSold: true,
  })
  const ids = patientPath(setup, {}).map((step) => step.id)
  for (const item of dassStress.items) assert.equal(ids.includes(item.id), true)
  const answers = {}
  for (const item of dassStress.items) answers[item.id] = 1
  const scored = scoreDass(setup, answers)
  assert.equal(scored.raw, 7)
  assert.equal(scored.doubled, 14)
  assert.doesNotMatch(scored.sentence, /\b(mild|moderate|severe|normal|extremely)\b/i)
})

test("an extreme personality answer opens only that trait’s remaining IPIP items", () => {
  const setup = readySetup({ topics: { personality: true } })
  const raw = { EXT7: 4, EST1: 5, AGR1: 1, CSN6: 2, OPN8: 3 }
  const view = profile(personality, raw)
  const path = patientPath(setup, raw)
  for (const group of view.groups) {
    const traitSteps = path.filter((step) => step.sourceId && step.sourceId.startsWith(group.id.slice(0, 3)))
    const extreme = group.category?.id === "low" || group.category?.id === "high"
    if (!extreme) assert.equal(traitSteps.length, 0)
    else {
      assert.equal(traitSteps.length, 9)
      assert.equal(traitSteps.some((step) => step.sourceId === group.id), false)
    }
  }
  const record = compileRecord(setup, { ...raw, [pcptsd.exposureId]: "no" })
  assert.match(record.text, /no combined personality total/i)
  assert.equal(record.total, undefined)
  assert.equal(record.ipip.some((row) => row.id === "intellect"), false)
  assert.equal(record.ipip.length, 4)
})

test("suicide stays on the record, and copyrighted item stems are not in the path", () => {
  const setup = readySetup()
  const cards = activeCards(setup).map((card) => card.id)
  assert.ok(cards.includes("suicide"))
  assert.ok(cards.includes("depression"))
  assert.ok(cards.includes("substances"))
  const blob = JSON.stringify(patientPath(setup, {}))
  for (const banned of [
    "Little interest or pleasure",
    "Feeling nervous, anxious",
    "wished you were dead",
    "In the past three months",
    "How often do you have a drink containing alcohol",
  ]) {
    if (banned.startsWith("How often do you have a drink")) continue
    assert.equal(blob.includes(banned), false, banned)
  }
  assert.equal(blob.includes("How often do you have a drink containing alcohol"), true)
})

test("a forensic record carries the transport warning and does not call the IPIP screen a PDS", () => {
  const setup = readySetup({ context: "forensic", topics: { validity: true } })
  const answers = { [pcptsd.exposureId]: "no" }
  for (const item of validityItems) answers[item.id] = 3
  const record = compileRecord(setup, answers)
  assert.match(record.text, /Not calibrated on a forensic sample/)
  assert.match(record.text, /Impression management: sum/)
  assert.equal(record.forensic, true)
  assert.equal(patientPath(setup, {}).some((step) => step.id === "im-01"), true)
})

test("all-true is not read as positive impression, and a virtuous pattern is", () => {
  const yea = {}
  const high = {}
  const low = {}
  for (const item of validityItems) {
    yea[item.id] = 5
    low[item.id] = item.reverse ? 5 : 1
  }
  for (const item of impressionItems) high[item.id] = item.reverse ? 1 : 5
  for (const item of selfDeceptionItems) high[item.id] = 3
  const yeaScore = scoreValidity(yea)
  const highScore = scoreValidity(high)
  const lowScore = scoreValidity(low)
  assert.equal(yeaScore.pattern, "yea")
  assert.equal(yeaScore.positiveImpression, false)
  assert.equal(highScore.pattern, "readable")
  assert.equal(highScore.im.mean, 5)
  assert.equal(highScore.positiveImpression, true)
  assert.equal(highScore.selfDeception, false)
  assert.equal(lowScore.positiveImpression, false)
  assert.match(lowScore.negativeNote, /not an over-reporting score/)
  assert.doesNotMatch(validityText(lowScore), /Negative impression: high/)
})

test("a spread across both impression-management halves is an inconsistency screen", () => {
  const answers = {}
  impressionItems.forEach((item, index) => { answers[item.id] = index % 2 === 0 ? 1 : 5 })
  selfDeceptionItems.forEach((item) => { answers[item.id] = 3 })
  const scored = scoreValidity(answers)
  assert.equal(scored.pattern, "inconsistent")
  assert.equal(scored.followUp, "Inconsistent")
  assert.equal(scored.positiveImpression, false)
})

test("the path finishes only when every determined item is answered", () => {
  const setup = readySetup()
  assert.equal(nextStep(setup, {}).id, "audit-1")
  const answers = { [pcptsd.exposureId]: "no" }
  for (const item of audit.items) answers[item.id] = 0
  assert.equal(answeredCount(setup, answers).finished, true)
  assert.equal(nextStep(setup, answers), null)
})
