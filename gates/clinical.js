import { policyFor } from "../policy.js"

/** Two-stage symptom screens. Official Australian-English forms, unchanged.
 * Source PDFs are bundled in docs/sources. Threshold decisions: docs/CLINICAL_SCOPE.md.
 * The publisher's instruction manual (p. 8) places these measures in the public domain.
 */
export const PHQ_MANUAL = "https://www.phqscreeners.com/images/sites/g/files/g10016261/f/201412/instructions.pdf"
export const PHQ_CREDIT = "Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. No permission required to reproduce, translate, display or distribute."
const phqOptions = ["Not at all", "Several days", "More than half of the two week period", "Nearly every day"]
const gadOptions = ["Not at all", "Several days", "More than half the days", "Nearly every day"]

export const clinicalScreens = [
  {
    id: "depression", prefix: "phq", label: "Depression", brief: "PHQ-2", full: "PHQ-9", max: 27,
    openAt: 2, screenAt: 10, refs: ["kroenke2001", "levis2020", "phqManual"],
    source: "docs/sources/phq9-en-au.pdf",
    stem: "Over the previous 2 weeks, how often have you been bothered by any of the following problems?",
    options: phqOptions,
    items: [
      "Little pleasure or little interest in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Having little energy or feeling tired",
      "Poor appetite or overeating",
      "Feeling negative about yourself or that you are a failure or have let your self or your family down",
      "Trouble concentrating on things, such as reading the newspaper or watching television",
      "Moving or talking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead or of hurting yourself in some way",
    ],
    bands: [[5, "Minimal"], [10, "Mild"], [15, "Moderate"], [20, "Moderately severe"], [28, "Severe"]],
    evidence: "PHQ-2 ≥2 is the sensitivity-first gate from Levis et al. (2020), rather than the manual’s ≥3. Across studies using semistructured interviews, sensitivity was 0.91 and specificity 0.67 for PHQ-2 alone. These are not Australian forensic operating characteristics; the complete two-stage pathway has different accuracy.",
  },
  {
    id: "anxiety", prefix: "gad", label: "Generalised anxiety", brief: "GAD-2", full: "GAD-7", max: 21,
    openAt: 2, screenAt: 10, refs: ["spitzer2006", "uspstfAnxiety", "phqManual"],
    source: "docs/sources/gad7-en-au.pdf",
    stem: "Over the last two weeks, how often have you been bothered by the following problems?",
    options: gadOptions,
    items: [
      "Feeling nervous, anxious or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Having trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid as if something awful might happen",
    ],
    bands: [[5, "Minimal"], [10, "Mild"], [15, "Moderate"], [22, "Severe"]],
    evidence: "GAD-2 ≥2 is the sensitivity-first gate in the USPSTF adult evidence review (2023), rather than the manual’s ≥3. Pooled sensitivity was 0.94 and specificity 0.68 for generalised anxiety in the general-adult studies. Not a locally calibrated forensic threshold, and not a screen for every anxiety disorder.",
  },
]

/** Effective interpretation policy is separate from published item wording. */
export function configuredScreens(setup) {
  const policy = policyFor(setup)
  return clinicalScreens.map((screen) => {
    const rule = policy.thresholds[screen.id]
    const changed = rule.gate !== screen.openAt || rule.screen !== screen.screenAt || JSON.stringify(rule.bands) !== JSON.stringify(screen.bands)
    return { ...screen, openAt: rule.gate, screenAt: rule.screen, bands: rule.bands,
      evidence: changed ? `Configured policy ${policy.id} (${policy.version}) changes this instrument's interpretation rules. ${policy.rationale} Published evidence below refers to the original stated thresholds, not this custom configuration. ${screen.evidence}` : screen.evidence }
  })
}

const valid = (value) => Number.isInteger(value) && value >= 0 && value <= 3
export function symptomSteps(setup, answers) {
  const steps = []
  for (const screen of configuredScreens(setup)) {
    if (!setup.topics[screen.id]) continue
    const gateIds = [1, 2].map((n) => `${screen.prefix}-${n}`)
    const gateReady = gateIds.every((id) => valid(answers[id]))
    const gate = gateReady ? gateIds.reduce((sum, id) => sum + answers[id], 0) : null
    const opened = gateReady && (gate >= screen.openAt || setup.followUps?.[screen.id])
    screen.items.slice(0, opened ? screen.items.length : 2).forEach((text, index) => {
      steps.push({
        id: `${screen.prefix}-${index + 1}`, instrument: screen.prefix,
        stage: index < 2 ? 1 : 2, kind: "choice", kicker: screen.label,
        index: index + 1, count: opened ? screen.items.length : 2,
        title: text, stem: screen.stem, lead: true,
        options: screen.options.map((label, score) => ({ label, score })),
        footer: PHQ_CREDIT,
      })
    })
    if (opened && screen.id === "depression" && screen.items.every((_, i) => valid(answers[`phq-${i + 1}`])) && screen.items.some((_, i) => answers[`phq-${i + 1}`] > 0)) {
      steps.push({
        id: "phq-difficulty", instrument: "phq", stage: 2, kind: "choice", kicker: screen.label,
        title: "If you ticked off any of the problems above, how difficult has it been for you to do your work, take care of things at home or get along with other people because of these problems?",
        index: 10, count: 10,
        options: ["Not difficult at all", "Somewhat difficult", "Very difficult", "Extremely difficult"].map((label, score) => ({ label, score })),
        footer: "Functional difficulty is recorded separately. It is not added to the PHQ-9 score.",
      })
    }
  }
  return steps
}

export function scoreSymptoms(setup, answers) {
  return configuredScreens(setup).filter((screen) => setup.topics[screen.id]).map((screen) => {
    const values = screen.items.map((_, i) => answers[`${screen.prefix}-${i + 1}`])
    const gateReady = values.slice(0, 2).every(valid)
    const gateScore = gateReady ? values[0] + values[1] : null
    const thresholdMet = gateReady && gateScore >= screen.openAt
    const override = !!setup.followUps?.[screen.id]
    const opened = gateReady && (thresholdMet || override)
    const complete = opened && values.every(valid)
    const total = complete ? values.reduce((sum, score) => sum + score, 0) : null
    const band = complete ? screen.bands.find(([upper]) => total < upper)[1] : null
    const priorFollowUp = !opened && values.slice(2).some(valid)
    const difficulty = opened && screen.id === "depression" && valid(answers["phq-difficulty"]) ? ["Not difficult at all", "Somewhat difficult", "Very difficult", "Extremely difficult"][answers["phq-difficulty"]] : null
    return {
      id: screen.id, label: screen.label, brief: screen.brief, full: screen.full, max: screen.max,
      status: !gateReady ? "incomplete" : !opened ? "gate-closed" : complete ? "scored" : "incomplete",
      bands: screen.bands, screenThreshold: screen.screenAt, gateScore, threshold: screen.openAt, thresholdMet, override, opened, total, band, difficulty, priorFollowUp,
      positive: complete ? total >= screen.screenAt : null,
      // Editing a gate must not erase an already known self-harm response.
      safetyFlag: screen.id === "depression" && valid(values[8]) && values[8] > 0,
      evidence: screen.evidence,
      sentence: `${screen.brief}: ${gateReady ? `${gateScore}/6` : "incomplete"}; follow-up threshold ≥${screen.openAt}. ${!gateReady ? "Brief screen unfinished." : !opened ? `${priorFollowUp ? `${screen.full} earlier follow-up answers are outside the current scoring path; no full score reported` : `${screen.full} not administered: gate below threshold`}. This does not exclude a disorder.` : `${override ? "Clinician requested follow-up. " : "Threshold met. "}${complete ? `${screen.full}: ${total}/${screen.max}, ${band.toLowerCase()} symptom severity. Screen threshold ≥${screen.screenAt}: ${total >= screen.screenAt ? "met" : "not met"}.` : `${screen.full} opened but incomplete.`}`} Not a diagnosis.`,
    }
  })
}
