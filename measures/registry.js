import raw from "./personality-5.json" with { type: "json" }
import { prepare } from "../core/score.js"

/** Add a measure by importing its JSON and preparing it. prepare() checks the license. */
const incoming = [raw]

export const measures = incoming.map((measure) => prepare(measure))

export function findMeasure(id) {
  return measures.find((measure) => measure.id === id) || null
}
