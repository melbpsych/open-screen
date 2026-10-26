import test from "node:test"
import assert from "node:assert/strict"
import source from "../measures/personality-5.json" with { type: "json" }
import { categoryStats, prepare, score, validateMeasure } from "./score.js"

test("personality and subscale readers reject coerced, fractional and nonfinite response codes", () => {
  const measure = prepare(source)
  for (const raw of [true, "2", 1.5, NaN, Infinity, 0, 6]) assert.throws(() => score(measure, { EXT7: raw }), /integer/)
})

test("invalid reference counts cannot create plausible graphs or categories", () => {
  for (const counts of [[1, -1, 1, 1, 1], [1, NaN, 1, 1, 1], [1, Infinity, 1, 1, 1], [1, "2", 1, 1, 1], [0, 0, 0, 0, 0], [1, .5, 1, 1, 1]]) {
    assert.throws(() => categoryStats(counts, 3))
    const changed = structuredClone(source)
    changed.items[0].norms.counts = counts
    assert.throws(() => validateMeasure(changed))
  }
})
