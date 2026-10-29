import { DEFAULT_POLICY } from "../policy.js"

/** IPIP proxies for the two BIDR constructs, plus response-pattern screens.
 * Item wording is the IPIP scoring key. The PDS, MMPI-3, MCMI-IV, PAI, and
 * Personality Assessment Screener are not copied.
 */

export const IPIP_ACCURACY = [
  ["Very Inaccurate", 1],
  ["Moderately Inaccurate", 2],
  ["Neither Inaccurate nor Accurate", 3],
  ["Moderately Accurate", 4],
  ["Very Accurate", 5],
]

export const VALIDITY_INSTRUCTION = "Describe yourself as you generally are now, not as you wish to be in the future. Describe yourself as you honestly see yourself, in relation to other people you know of the same sex as you are, and roughly your same age."

export const impressionItems = items("im", [
  ["Would never take things that aren't mine.", false],
  ["Would never cheat on my taxes.", false],
  ["Believe there is never an excuse for lying.", false],
  ["Always admit it when I make a mistake.", false],
  ["Rarely talk about sex.", false],
  ["Return extra change when a cashier makes a mistake.", false],
  ["Try to follow the rules.", false],
  ["Easily resist temptations.", false],
  ["Tell the truth.", false],
  ["Rarely overindulge.", false],
  ["Have sometimes had to tell a lie.", true],
  ["Use swear words.", true],
  ["Use flattery to get ahead.", true],
  ["Am not always what I appear to be.", true],
  ["Break rules.", true],
  ["Cheat to get ahead.", true],
  ["Don't always practice what I preach.", true],
  ["Misuse power.", true],
  ["Get back at others.", true],
  ["Am likely to show off if I get the chance.", true],
])

export const selfDeceptionItems = items("sd", [
  ["Always know why I do things.", false],
  ["Just know that I will be a success.", false],
  ["Know that my decisions are correct.", false],
  ["Feel comfortable with myself.", false],
  ["Like to take responsibility for making decisions.", false],
  ["Am not always honest with myself.", true],
  ["Sometimes have trouble making up my mind.", true],
  ["Dislike myself.", true],
  ["Worry about what people think of me.", true],
  ["Have a low opinion of myself.", true],
])

function items(prefix, rows) {
  return rows.map(([text, reverse], index) => ({
    id: `${prefix}-${String(index + 1).padStart(2, "0")}`,
    text,
    reverse,
  }))
}

/** Plus and minus items alternate, so a coherent impression pattern does not look like a long string. */
export const validityItems = [...interleave(impressionItems), ...interleave(selfDeceptionItems)]

function interleave(scaleItems) {
  const plus = scaleItems.filter((item) => !item.reverse)
  const minus = scaleItems.filter((item) => item.reverse)
  const rows = []
  const count = Math.max(plus.length, minus.length)
  for (let index = 0; index < count; index += 1) {
    if (plus[index]) rows.push(plus[index])
    if (minus[index]) rows.push(minus[index])
  }
  return rows
}

export function scoreValidity(answers, rules = DEFAULT_POLICY.responsePatterns) {
  if (!validityItems.every((item) => Number.isInteger(answers[item.id]) && answers[item.id] >= 1 && answers[item.id] <= 5)) {
    return { status: "incomplete" }
  }
  const raws = validityItems.map((item) => answers[item.id])
  const run = longestRun(raws)
  const sameRate = Math.max(...[1, 2, 3, 4, 5].map((value) => raws.filter((raw) => raw === value).length)) / raws.length
  const plus = validityItems.filter((item) => !item.reverse)
  const minus = validityItems.filter((item) => item.reverse)
  const yea = poleRate(plus, answers, (raw) => raw >= 4) >= rules.poleRate
    && poleRate(minus, answers, (raw) => raw >= 4) >= rules.poleRate
  const nay = poleRate(plus, answers, (raw) => raw <= 2) >= rules.poleRate
    && poleRate(minus, answers, (raw) => raw <= 2) >= rules.poleRate
  const fixed = run >= rules.runLength || sameRate >= rules.sameRate
  const im = scaleSummary(impressionItems, answers)
  const deception = scaleSummary(selfDeceptionItems, answers)
  const inconsistent = deviation(impressionItems.filter((item) => !item.reverse), answers) >= rules.withinSD
    && deviation(impressionItems.filter((item) => item.reverse), answers) >= rules.withinSD
  const pattern = yea ? "yea" : nay ? "nay" : fixed ? "fixed" : inconsistent ? "variable" : "readable"
  const positiveImpression = pattern === "readable" && im.mean >= rules.screenMean
  const selfDeception = pattern === "readable" && deception.mean >= rules.screenMean
  return {
    status: "scored",
    im,
    deception,
    run,
    responseCounts: [1, 2, 3, 4, 5].map(value => raws.filter(raw => raw === value).length),
    pattern,
    positiveImpression,
    selfDeception,
    flagged: pattern !== "readable" || positiveImpression || selfDeception,
    label: patternLabel(pattern, positiveImpression, selfDeception),
    patternSentence: patternSentence(pattern, run),
    followUp: patternLabel(pattern, positiveImpression, selfDeception),
    negativeNote: "A low impression-management average is not an over-reporting score.",
    sampleNote: `IPIP. Eugene-Springfield community sample. Keyed average of ${rules.screenMean} is this policy’s mark, not a published cut.`,
  }
}

function scaleSummary(scaleItems, answers) {
  const keyed = scaleItems.map((item) => (item.reverse ? 6 - answers[item.id] : answers[item.id]))
  const sum = keyed.reduce((total, value) => total + value, 0)
  const mean = sum / keyed.length
  return {
    sum,
    mean: Math.round(mean * 100) / 100,
    low: scaleItems.length,
    high: scaleItems.length * 5,
  }
}

function poleRate(scaleItems, answers, test) {
  return scaleItems.filter((item) => test(answers[item.id])).length / scaleItems.length
}

function deviation(scaleItems, answers) {
  const values = scaleItems.map((item) => answers[item.id])
  const mean = values.reduce((total, value) => total + value, 0) / values.length
  const square = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(square)
}

function longestRun(values) {
  let best = 1
  let run = 1
  for (let index = 1; index < values.length; index += 1) {
    run = values[index] === values[index - 1] ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

function patternLabel(pattern, positiveImpression, selfDeceptionFlag) {
  if (pattern === "yea") return "Frequent agreement"
  if (pattern === "nay") return "Frequent disagreement"
  if (pattern === "fixed") return "Repeated response selections"
  if (pattern === "variable") return "Variable responses"
  if (positiveImpression && selfDeceptionFlag) return "Both IPIP means meet the local review mark"
  if (positiveImpression) return "IPIP impression-management mean meets the local review mark"
  if (selfDeceptionFlag) return "IPIP self-deceptive-enhancement mean meets the local review mark"
  return "No pattern flag"
}

function patternSentence(pattern, run) {
  if (pattern === "fixed") return `Repeated answers. Longest run ${run}.`
  if (pattern === "yea") return "Frequent agreement across differently keyed items. Explore understanding and context."
  if (pattern === "nay") return "Frequent disagreement across differently keyed items. Explore understanding and context."
  if (pattern === "variable") return "Responses vary within item groups; this does not establish inconsistent responding."
  return "No pattern flag."
}

export function validityText(result) {
  if (result.status !== "scored") return "Response patterns: incomplete."
  return [
    `Exploratory response patterns. ${result.label}.`,
    `Impression management: sum ${result.im.sum} of ${result.im.low}–${result.im.high}, keyed average ${result.im.mean}.`,
    `Self-deception: sum ${result.deception.sum} of ${result.deception.low}–${result.deception.high}, keyed average ${result.deception.mean}.`,
    result.patternSentence,
    `Response counts for options 1–5: ${result.responseCounts.join(", ")}. Longest repeated run: ${result.run}.`,
    "Local descriptive flags are not validated validity, credibility or malingering classifications.",
    result.negativeNote,
    result.sampleNote,
  ].join("\n")
}
