/** Pure scoring. No DOM, no network, no I/O. Safe to import from a web app, React Native, or Electron.
 *
 * A result is a category plus a comparison graph. The category comes from the
 * cutoffs declared on the measure. A five-point answer is not reported as a
 * percentile: many people share one answer, so a rank would look too exact.
 */

export const API_VERSION = 2

export const OPEN_LICENSES = new Set([
  "public-domain",
  "CC0",
  "CC-BY-4.0",
  "MIT",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "ISC",
])

export function categoryStats(counts, score) {
  if (!Array.isArray(counts) || counts.length !== 5) {
    throw new Error("Norms need five category counts, for scores 1 through 5.")
  }
  if (counts.some((count) => !Number.isSafeInteger(count) || count < 0)) throw new Error("Norm counts must be non-negative safe integers.")
  if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error("Score must be an integer from 1 to 5.")
  const n = counts.reduce((sum, count) => sum + count, 0)
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error("Norm sample must have a positive safe integer size.")
  const below = counts.slice(0, score - 1).reduce((sum, count) => sum + count, 0)
  const at = counts[score - 1]
  const above = n - below - at
  return {
    n,
    at,
    below,
    above,
    pct: at / n,
    pctBelow: below / n,
    pctAbove: above / n,
    percentile: ((below + at / 2) / n) * 100,
  }
}

/** The personality screen's historical bands. New measures declare `categories` instead. */
export function bandFor(percentile) {
  if (percentile < 35) return "low"
  if (percentile > 65) return "high"
  return "middle"
}

export function ordinal(value) {
  const n = Math.round(value)
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`
}

export function percent(fraction) {
  return `${Math.round(fraction * 100)}%`
}

function readText(item, keyed) {
  return item.read?.[keyed] ?? item.read?.[String(keyed)]
}

/** First matching cutoff wins. A rule with no threshold is the remainder. */
export function classify(categories, ctx) {
  if (!Array.isArray(categories) || categories.length === 0) return null
  for (const rule of categories) {
    if (ruleMatches(rule, ctx)) return { id: rule.id, label: rule.label }
  }
  return null
}

function ruleMatches(rule, ctx) {
  const checks = [
    ["percentileBelow", (limit) => ctx.percentile < limit],
    ["percentileAtMost", (limit) => ctx.percentile <= limit],
    ["scoreBelow", (limit) => ctx.score < limit],
    ["scoreAtMost", (limit) => ctx.score <= limit],
  ]
  const present = checks.filter(([key]) => rule[key] != null)
  if (present.length === 0) return true
  return present.every(([key, test]) => test(rule[key]))
}

function distribution(bins, category, caption) {
  if (bins.some((bin) => !Number.isSafeInteger(bin.count) || bin.count < 0)) throw new Error("Norm counts must be non-negative safe integers.")
  const total = bins.reduce((sum, bin) => sum + bin.count, 0)
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error("Norm sample must have a positive safe integer size.")
  return {
    kind: "distribution",
    caption,
    bins: bins.map((bin) => ({
      label: bin.label,
      count: bin.count,
      share: bin.count / total,
      selected: bin.selected === true,
    })),
    category,
  }
}

function scaleComparison(scale, value, category) {
  const [min, max] = scale.range
  const span = max - min
  if (!(span > 0)) throw new Error(`${scale.id} needs a range from low to high.`)
  let cursor = min
  const regions = []
  for (const rule of scale.categories) {
    let end = max
    if (rule.scoreBelow != null) end = rule.scoreBelow
    else if (rule.scoreAtMost != null) end = rule.scoreAtMost
    end = Math.max(cursor, Math.min(max, end))
    regions.push({
      id: rule.id,
      label: rule.label,
      from: cursor,
      to: end,
      selected: category?.id === rule.id,
    })
    cursor = end
    if (cursor >= max) break
  }
  return {
    kind: "scale",
    caption: "Cutoffs along the score. The marker is this result.",
    min,
    max,
    value,
    regions,
    category,
  }
}

const DISTRIBUTION_CAPTION = "Share of the reference sample. Scored answers run from low to high."

function rowFor(item, raw, categories, commonAt) {
  const keyed = item.reverse ? 6 - raw : raw
  const stats = categoryStats(item.norms.counts, keyed)
  const category = classify(categories, { percentile: stats.percentile, score: keyed })
  if (!category) throw new Error(`${item.id} answer ${raw} matched no category.`)
  const label = item.responseOptions?.find((option) => option.value === raw)?.label
    ?? ["Very Inaccurate", "Moderately Inaccurate", "Neither Inaccurate nor Accurate", "Moderately Accurate", "Very Accurate"][raw - 1]
  const same = percent(stats.pct)
  const common = stats.pct >= commonAt
  const commonNote = common ? " This answer is common." : ""
  const construct = item.construct.toLowerCase()
  const comparison = distribution(
    item.norms.counts.map((count, index) => ({
      label: String(index + 1),
      count,
      selected: index + 1 === keyed,
    })),
    category,
    DISTRIBUTION_CAPTION,
  )
  return {
    raw,
    keyed,
    percentile: stats.percentile,
    band: category.id,
    category,
    common,
    pct: stats.pct,
    answerLabel: label,
    headline: category.label,
    standing: `${category.label} on this sentence, compared with the public sample.`,
    detail: `Answer: ${label}. Scored ${keyed} of 5 toward ${construct}. ${same} of the reference sample gave this answer.${commonNote}`,
    glance: `${category.label} · ${same} of the sample`,
    text: readText(item, keyed),
    comparison,
  }
}

/** Build the per-answer lookup once. Later taps are an array index. */
export function prepare(measure) {
  validateMeasure(measure)
  const commonAt = measure.commonAt ?? 0.25
  const items = measure.items.map((item) => {
    const categories = item.categories || measure.categories
    const byRaw = item.norms?.counts
      ? [1, 2, 3, 4, 5].map((raw) => rowFor(
        { ...item, responseOptions: measure.responseOptions },
        raw,
        categories,
        commonAt,
      ))
      : null
    return byRaw ? { ...item, byRaw } : { ...item }
  })
  return {
    ...measure,
    apiVersion: API_VERSION,
    prepared: true,
    items,
    itemsById: Object.fromEntries(items.map((item) => [item.id, item])),
  }
}

export function scoreItem(item, raw) {
  if (raw == null) return { id: item.id, status: "unanswered" }
  if (!Number.isInteger(raw) || raw < 1 || raw > 5) throw new Error("Answer must be an integer from 1 to 5.")
  const row = item.byRaw?.[raw - 1]
  if (!row) throw new Error(`${item.id} has no prepared answer for ${raw}. Call prepare() first.`)
  return { id: item.id, status: "scored", construct: item.construct, followUp: item.followUp, ...row }
}

function withIndex(measure) {
  if (measure.itemsById) return measure
  return { ...measure, itemsById: Object.fromEntries(measure.items.map((item) => [item.id, item])) }
}

export function score(measure, answers = {}) {
  const ready = withIndex(measure.prepared ? measure : prepare(measure))
  if (ready.scoring === "markers") {
    return {
      apiVersion: API_VERSION,
      kind: "markers",
      id: ready.id,
      results: ready.items.map((item) => scoreItem(item, answers[item.id])),
    }
  }
  if (ready.scoring === "subscales") {
    return {
      apiVersion: API_VERSION,
      kind: "subscales",
      id: ready.id,
      results: ready.subscales.map((scale) => scoreSubscale(scale, ready.itemsById, answers)),
    }
  }
  throw new Error(`Unknown scoring "${ready.scoring}".`)
}

/** True when every reported row has a category. The page waits for this before drawing. */
export function reportReady(scored) {
  return scored.results.length > 0 && scored.results.every((row) => row.status === "scored")
}

function joinList(parts) {
  if (parts.length <= 1) return parts[0] || ""
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
}

function niceCeiling(maxShare) {
  const steps = [0.1, 0.2, 0.25, 0.4, 0.5, 0.75, 1]
  return steps.find((step) => step + 1e-9 >= maxShare) ?? 1
}

function sketchFor(item, row) {
  const keyed = row.keyed
  return item?.sketch?.[keyed] ?? item?.sketch?.[String(keyed)] ?? null
}

function analysisText(measure, groups) {
  const shape = joinList(groups.map((group) => {
    const name = (group.construct || group.label).toLowerCase()
    return `${name} is ${group.headline.toLowerCase()}`
  }))
  const clauses = groups.map((group) => {
    if (!group.sketch) return null
    return group.common ? `${group.sketch} (common in this sample)` : group.sketch
  }).filter(Boolean)
  const reading = clauses.length ? ` As sentences, this person ${joinList(clauses)}.` : ""
  const close = measure.analysisClose
    || "These standings are the result. They are not added into one score."
  return `Across these answers, ${shape}.${reading} ${close}`
}

/** One chart and one reading for a finished screen. No total score. */
export function profile(measure, answers = {}) {
  const ready = measure.prepared ? withIndex(measure) : prepare(measure)
  const scored = score(ready, answers)
  if (!reportReady(scored)) return { ready: false, scored }
  const groups = scored.results.map((row) => {
    const item = ready.itemsById?.[row.id]
    return {
      id: row.id,
      label: item?.chartLabel || row.construct || row.label,
      construct: row.construct || row.label,
      headline: row.headline,
      category: row.category,
      common: row.common === true,
      comparison: row.comparison,
      sketch: sketchFor(item, row),
    }
  })
  const shares = groups.flatMap((group) => (
    group.comparison?.kind === "distribution" ? group.comparison.bins.map((bin) => bin.share) : []
  ))
  const ceiling = shares.length ? niceCeiling(Math.max(...shares)) : 1
  return {
    ready: true,
    ceiling,
    groups,
    analysis: analysisText(ready, groups),
  }
}

export function summaryText(measure, answers) {
  const ready = measure.prepared ? measure : prepare(measure)
  const view = profile(ready, answers)
  if (!view.ready) return `${ready.title}\n${ready.notFor || ""}`.trim()
  return [ready.title, ready.notFor || "", "", view.analysis].filter((line) => line != null).join("\n").trim()
}

function keyedScore(item, raw) {
  if (!Number.isInteger(raw) || raw < 1 || raw > 5) throw new Error("Answer must be an integer from 1 to 5.")
  return item.reverse ? 6 - raw : raw
}

export function scoreSubscale(scale, itemsById, answers) {
  const minAnswered = scale.minAnswered ?? scale.itemIds.length
  let sum = 0
  let n = 0
  for (const id of scale.itemIds) {
    const raw = answers[id]
    if (raw == null) continue
    sum += keyedScore(itemsById[id], raw)
    n += 1
  }
  if (n < minAnswered) return { id: scale.id, label: scale.label || scale.id, status: "incomplete", answered: n, required: minAnswered }
  const mean = sum / n
  const value = scale.score === "sum" ? sum : mean
  const category = classify(scale.categories, { score: value })
  let comparison = null
  if (scale.norms?.bins?.length) {
    comparison = distribution(
      scale.norms.bins.map((bin) => ({
        label: bin.label,
        count: bin.count,
        selected: value >= bin.from && value <= bin.to,
      })),
      category,
      scale.norms.caption || "Share of the reference sample.",
    )
  } else if (category && Array.isArray(scale.range)) {
    comparison = scaleComparison(scale, value, category)
  }
  return {
    id: scale.id,
    label: scale.label || scale.id,
    status: "scored",
    answered: n,
    mean,
    sum,
    score: value,
    category,
    comparison,
    headline: category?.label ?? null,
    detail: category
      ? `${category.label}. Score ${formatScore(value)}.`
      : `Score ${formatScore(value)}.`,
    standing: null,
  }
}

function formatScore(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function checkCategories(owner, categories) {
  if (categories == null) return
  if (!Array.isArray(categories) || categories.length < 1) {
    throw new Error(`${owner} categories must be a list of cutoffs.`)
  }
  const ids = new Set()
  for (const rule of categories) {
    if (!rule.id || !rule.label) throw new Error(`${owner} has a category without an id or a label.`)
    if (ids.has(rule.id)) throw new Error(`${owner} repeats category ${rule.id}.`)
    ids.add(rule.id)
    for (const key of ["percentileBelow", "percentileAtMost", "scoreBelow", "scoreAtMost"]) {
      if (rule[key] != null && !Number.isFinite(rule[key])) {
        throw new Error(`${owner} category ${rule.id} has a non-numeric ${key}.`)
      }
    }
  }
}

export function validateMeasure(measure) {
  if (!measure || typeof measure !== "object" || Array.isArray(measure)) throw new TypeError("Measure must be an object.")
  const missing = ["id", "title", "summary", "license", "scoring", "items", "responseOptions"].filter(
    (key) => measure[key] == null || measure[key] === "",
  )
  if (missing.length) throw new Error(`${measure.id || "measure"} is missing ${missing.join(", ")}.`)
  if (!OPEN_LICENSES.has(measure.license)) {
    throw new Error(`${measure.id} uses "${measure.license}". Open Screen accepts public-domain and other open licenses only.`)
  }
  if (!Array.isArray(measure.items) || measure.items.length < 1) throw new Error(`${measure.id} has no items.`)
  if (!Array.isArray(measure.responseOptions) || measure.responseOptions.length !== 5 || new Set(measure.responseOptions.map((row) => row.value)).size !== 5 || measure.responseOptions.some((row) => !Number.isInteger(row.value) || row.value < 1 || row.value > 5 || typeof row.label !== "string")) throw new Error(`${measure.id} needs five unique response options, coded 1 through 5.`)
  if (!["markers", "subscales"].includes(measure.scoring)) throw new Error(`Unsupported scoring mode ${measure.scoring}.`)
  checkCategories(measure.id, measure.categories)
  const ids = new Set()
  for (const item of measure.items) {
    if (!item.id || !item.text || !item.construct) throw new Error(`${measure.id} has an item without id, text, or construct.`)
    if (item.reverse != null && typeof item.reverse !== "boolean") throw new Error(`${item.id} reverse must be boolean.`)
    if (ids.has(item.id)) throw new Error(`${measure.id} repeats item ${item.id}.`)
    ids.add(item.id)
    checkCategories(item.id, item.categories)
    if (measure.scoring === "markers") {
      if (!item.norms || !Array.isArray(item.norms.counts) || item.norms.counts.length !== 5) {
        throw new Error(`${item.id} needs five norm counts.`)
      }
      categoryStats(item.norms.counts, 1)
      if (!(item.categories || measure.categories)) {
        throw new Error(`${item.id} needs categories. Report a category, not a percentile.`)
      }
      for (const score of [1, 2, 3, 4, 5]) {
        if (!readText(item, score)) throw new Error(`${item.id} needs an interpretation for scored answer ${score}.`)
      }
    }
  }
  if (measure.scoring === "subscales") {
    if (!Array.isArray(measure.subscales) || measure.subscales.length < 1) {
      throw new Error(`${measure.id} is missing subscales.`)
    }
    for (const scale of measure.subscales) {
      if (!scale.itemIds?.length) throw new Error(`${measure.id} has an empty subscale.`)
      if (new Set(scale.itemIds).size !== scale.itemIds.length) throw new Error("Subscale repeats an item.")
      if (scale.minAnswered != null && (!Number.isInteger(scale.minAnswered) || scale.minAnswered < 1 || scale.minAnswered > scale.itemIds.length)) throw new Error("Invalid minimum answered count.")
      if (scale.score != null && !["sum", "mean"].includes(scale.score)) throw new Error("Unsupported subscale score.")
      if (scale.range && (!Array.isArray(scale.range) || scale.range.length !== 2 || !scale.range.every(Number.isFinite) || scale.range[1] <= scale.range[0])) throw new Error("Invalid subscale range.")
      checkCategories(scale.id || measure.id, scale.categories)
      for (const id of scale.itemIds) {
        if (!ids.has(id)) throw new Error(`${measure.id} subscale points at unknown item ${id}.`)
      }
    }
  }
  return true
}

/** Plain JSON for other languages. Drops the id index, which is not serializable as a convenience only. */
export function compile(measure) {
  const ready = prepare(measure)
  const { itemsById, ...rest } = ready
  return { ...rest, items: ready.items.map(({ byRaw, ...item }) => ({ ...item, byRaw })) }
}
