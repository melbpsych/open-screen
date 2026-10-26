import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { bandFor, compile, ordinal, prepare, profile, reportReady, score, scoreSubscale, summaryText, validateMeasure } from "./core/score.js"
import { findMeasure, measures } from "./measures/registry.js"

const source = JSON.parse(readFileSync(new URL("./measures/personality-5.json", import.meta.url)))
const prepared = prepare(source)

test("prepared rows are categories indexed by the raw tap", () => {
  const names = { low: "Low", middle: "Middle", high: "High" }
  for (const item of prepared.items) {
    item.byRaw.forEach((row, index) => {
      const raw = index + 1
      assert.equal(row.raw, raw)
      assert.equal(row.keyed, item.reverse ? 6 - raw : raw)
      assert.equal(row.band, bandFor(row.percentile), `${item.id} raw ${raw}`)
      assert.equal(row.headline, names[row.band])
      assert.equal(row.category.id, row.band)
      assert.equal(row.comparison.kind, "distribution")
      assert.equal(row.comparison.bins[row.keyed - 1].selected, true)
      assert.equal(row.comparison.bins.filter((bin) => bin.selected).length, 1)
      for (const key of ["headline", "standing", "detail", "glance"]) {
        assert.equal(row[key].toLowerCase().includes("percentile"), false, `${item.id} ${key}`)
      }
    })
  }
})

test("a rounded rank is not the category, and a reverse agree stays low", () => {
  const ext = prepared.itemsById.EXT7.byRaw[1]
  assert.equal(ordinal(ext.percentile), "35th")
  assert.ok(ext.percentile < 35)
  assert.equal(ext.category.id, "low")
  const stress = prepared.itemsById.EST1.byRaw[4]
  assert.equal(stress.keyed, 1)
  assert.equal(stress.headline, "Low")
  assert.match(stress.detail, /Scored 1 of 5/)
  const concern = prepared.itemsById.AGR1.byRaw[0]
  assert.equal(concern.keyed, 5)
  assert.equal(concern.common, true)
  assert.equal(concern.headline, "High")
  assert.match(concern.detail, /This answer is common/)
  assert.equal(Math.round(prepared.itemsById.EXT7.byRaw[3].pct * 100), 20)
})

test("scoring five answers does not invent a total and stays fast", () => {
  const answers = { EXT7: 5, EST1: 1, AGR1: 3, CSN6: 2, OPN8: 4 }
  const started = performance.now()
  let scored
  for (let i = 0; i < 20000; i++) scored = score(prepared, answers)
  const elapsed = performance.now() - started
  assert.equal(scored.kind, "markers")
  assert.equal(scored.total, undefined)
  assert.equal(scored.results.find((row) => row.id === "EST1").keyed, 5)
  assert.equal(scored.results.find((row) => row.id === "EST1").headline, "High")
  assert.equal(reportReady(scored), true)
  assert.equal(reportReady(score(prepared, { EXT7: 4 })), false)
  assert.ok(elapsed < 250, `20,000 scores took ${elapsed.toFixed(1)} ms`)
})

test("a finished screen is one profile, not five repeated readings and not a total", () => {
  const answers = { EXT7: 4, EST1: 5, AGR1: 1, CSN6: 2, OPN8: 3 }
  const view = profile(prepared, answers)
  assert.equal(view.ready, true)
  assert.equal(view.ceiling, 0.4)
  assert.deepEqual(view.groups.map((group) => group.headline), ["High", "Low", "High", "High", "Middle"])
  assert.equal(view.groups[0].comparison.bins.filter((bin) => bin.selected).length, 1)
  assert.equal(view.groups[2].comparison.bins[4].selected, true)
  assert.match(view.analysis, /extraversion is high/)
  assert.match(view.analysis, /emotional stability is low/)
  assert.match(view.analysis, /common in this sample/)
  assert.match(view.analysis, /not added into one score/)
  assert.equal(view.analysis.toLowerCase().includes("percentile"), false)
  assert.equal(view.analysis.includes("I talk to a lot of different people at parties"), false)
  assert.equal(view.analysis.includes("depressive"), false)
  assert.equal(view.total, undefined)
  const text = summaryText(prepared, answers)
  assert.match(text, /not added into one score/)
  assert.equal(text.includes("Ask how they are"), false)
  assert.equal(profile(prepared, { EXT7: 4 }).ready, false)
})

test("compiled JSON matches prepare(), so other languages see the same rows", () => {
  const compiled = compile(source)
  assert.equal(compiled.prepared, true)
  assert.equal(compiled.apiVersion, 2)
  assert.equal(compiled.itemsById, undefined)
  for (const item of compiled.items) {
    const live = prepared.itemsById[item.id]
    assert.deepEqual(item.byRaw, live.byRaw)
    assert.equal(item.bars, undefined)
  }
})

test("registry serves the prepared personality screen", () => {
  assert.equal(measures.length, 1)
  assert.equal(findMeasure("personality-5").prepared, true)
  assert.equal(findMeasure("missing"), null)
  assert.equal(findMeasure("personality-5").itemsById.EXT7.byRaw[3].headline, "High")
})

test("proprietary items are refused", () => {
  assert.throws(() => validateMeasure({ ...source, id: "closed", license: "proprietary" }), /open licenses/)
})

test("a subscale screen reports a mean and does not invent a percentile", () => {
  const items = { A: { id: "A", reverse: false }, B: { id: "B", reverse: true } }
  const done = scoreSubscale({ id: "s", itemIds: ["A", "B"], minAnswered: 2 }, items, { A: 4, B: 2 })
  assert.equal(done.status, "scored")
  assert.equal(done.mean, 4)
  assert.equal(done.standing, null)
  const partial = scoreSubscale({ id: "s", itemIds: ["A", "B"], minAnswered: 2 }, items, { A: 4 })
  assert.equal(partial.status, "incomplete")
  assert.equal(done.comparison, null)
  assert.equal(done.headline, null)
})

test("a later screen can classify a sum by its own cutoffs", () => {
  const items = { A: { id: "A", reverse: false }, B: { id: "B", reverse: true } }
  const done = scoreSubscale({
    id: "mood",
    label: "Low mood",
    itemIds: ["A", "B"],
    score: "sum",
    range: [2, 10],
    categories: [
      { id: "mild", label: "Mild", scoreBelow: 6 },
      { id: "high", label: "High" },
    ],
  }, items, { A: 4, B: 2 })
  assert.equal(done.score, 8)
  assert.equal(done.category.id, "high")
  assert.equal(done.comparison.kind, "scale")
  assert.equal(done.comparison.regions.find((region) => region.selected).id, "high")
  assert.equal(done.percentile, undefined)
})

test("a later screen can compare a score with frequency bins", () => {
  const items = { A: { id: "A", reverse: false } }
  const done = scoreSubscale({
    id: "mood",
    label: "Low mood",
    itemIds: ["A"],
    score: "sum",
    categories: [
      { id: "low", label: "Low", scoreBelow: 3 },
      { id: "high", label: "High" },
    ],
    norms: {
      bins: [
        { label: "1–2", from: 1, to: 2, count: 30 },
        { label: "3–5", from: 3, to: 5, count: 70 },
      ],
    },
  }, items, { A: 4 })
  assert.equal(done.comparison.kind, "distribution")
  assert.equal(done.comparison.bins[1].selected, true)
  assert.equal(done.comparison.bins[1].share, 0.7)
  assert.equal(done.category.id, "high")
})

test("marker cutoffs can be a raw score instead of the personality bands", () => {
  const custom = prepare({
    id: "cut",
    title: "Cutoff",
    summary: "A cutoff.",
    license: "MIT",
    scoring: "markers",
    responseOptions: [
      { value: 1, label: "Disagree" },
      { value: 2, label: "2" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "4" },
      { value: 5, label: "Agree" },
    ],
    categories: [
      { id: "below", label: "Below cutoff", scoreBelow: 3 },
      { id: "above", label: "Above cutoff" },
    ],
    items: [{
      id: "Q",
      text: "Question",
      construct: "Thing",
      reverse: false,
      norms: { counts: [10, 10, 10, 10, 10] },
      read: { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e" },
    }],
  })
  assert.equal(custom.itemsById.Q.byRaw[1].headline, "Below cutoff")
  assert.equal(custom.itemsById.Q.byRaw[2].headline, "Above cutoff")
  assert.equal(custom.itemsById.Q.byRaw[1].band, "below")
})
