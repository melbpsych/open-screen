import { followUpAllowed, followUpTopic, FOLLOW_UP_NOT_SELECTED } from '../core/followups.js'
/** Branch rules for one clinical sitting. No DOM. No network.
 * Official scores are calculated only for instruments whose wording is in this
 * program. Named instruments that are not copied are never summed.
 */

import { externalMeasures } from '../questionnaires/external.js'
import { ENGINE_VERSION, RULES_VERSION } from '../core/version.js'
import { DEFAULT_POLICY, policyFor, policyNote } from "../policy.js"
import { questionnaireResult, questionnaireSteps } from "../core/questionnaire.js"
import personalitySource from "../measures/personality-5.json" with { type: "json" }
import { profile } from "../core/score.js"
import { referenceList } from "./references.js"
import { clinicalScreens, PHQ_CREDIT, PHQ_MANUAL, scoreSymptoms, symptomSteps } from "./clinical.js"
import {
  AUDIT_FOOTER,
  FORENSIC_WARNING,
  IPIP_SENTENCE,
  alwaysNamed,
  audit,
  dassStress,
  ipipTraits,
  optionalTopics,
  pcl,
  pcptsd,
  selectedCards,
} from "./instruments.js"
import {
  IPIP_ACCURACY,
  VALIDITY_INSTRUCTION,
  scoreValidity,
  validityItems,
  validityText,
} from "./validity.js"

export { FORENSIC_WARNING, personalitySource }

const traitByScreen = new Map(ipipTraits.map((trait) => [trait.screenId, trait]))

for (const trait of ipipTraits) {
  const screen = trait.items.find((item) => item.id === trait.screenId)
  const official = personalitySource.items.find((item) => item.id === trait.screenId)
  if (!official || official.text !== screen.text || official.reverse !== screen.reverse) {
    throw new Error(`IPIP marker ${trait.screenId} does not match the personality screen.`)
  }
}

export function emptySetup(policy = DEFAULT_POLICY, questionnaires = []) {
  return {
    policy,
    questionnaires,
    confirmations: {},
    forms: {},
    context: null,
    auditFee: null,
    auditThreshold: 3,
    followUps: {},
    definedPatientGroup: false,
    scoresToClinician: false,
    scaleNotSold: false,
    topics: { ...Object.fromEntries(optionalTopics.map((topic) => [topic.id, false])), depression: false, anxiety: false, ...Object.fromEntries(questionnaires.map((row) => [row.id, false])) },
  }
}

export function dassAllowed(setup) {
  return setup.definedPatientGroup === true
    && setup.scoresToClinician === true
    && setup.scaleNotSold === true
}

export function setupErrors(setup) {
  const errors = []
  if (setup.context !== "clinical" && setup.context !== "forensic") errors.push("Choose a setting.")
  const chosen = Object.values(setup.topics).some((value) => value === true)
  if (!chosen) errors.push("Choose a scale.")
  if (setup.topics.alcohol && setup.auditFee !== "no") errors.push("Alcohol stays out when a fee is charged.")
  if (setup.topics.alcohol && !policyFor(setup).thresholds.alcohol.allowed.includes(setup.auditThreshold)) errors.push(`Choose the AUDIT-C threshold (${policyFor(setup).thresholds.alcohol.allowed.join(" or ")}).`)
  if (setup.topics.irritability && !dassAllowed(setup)) errors.push("Tension needs its three conditions.")
  for (const definition of setup.questionnaires || []) if (setup.topics[definition.id]) {
    if (definition.formChoices.length && !definition.formChoices.some((form) => form.id === setup.forms?.[definition.id])) errors.push(`${definition.label}: choose the appropriate official form.`)
    for (const requirement of definition.requirements) if (setup.confirmations?.[`${definition.id}:${requirement.id}`] !== true) errors.push(`${definition.label}: ${requirement.label}`)
  }
  return errors
}

/** Human-readable plan uses the same generated path as the question UI. */
export function planSummary(setup) {
  const path = patientPath(setup)
  const patient = [...new Set(path.map((step) => step.kicker))]
  return { patient, clinician: [policyNote(policyFor(setup)), "Direct safety review and external instruments are independent of symptom gates."] }
}

function choiceStep(base, options) {
  return {
    ...base,
    kind: "choice",
    options: options.map(([label, score]) => ({ label, score })),
  }
}

function yesNoStep(base) {
  return {
    ...base,
    kind: "choice",
    options: [
      { label: "Yes", score: "yes" },
      { label: "No", score: "no" },
    ],
  }
}

export function patientPath(setup, answers = {}) {
  const steps = symptomSteps(setup, answers)
  if (setup.topics.validity) {
    validityItems.forEach((item, index) => {
      steps.push({
        id: item.id,
        instrument: "validity",
        kind: "choice",
        kicker: "About you",
        index: index + 1,
        count: validityItems.length,
        title: item.text,
        lead: index === 0,
        stem: index === 0 ? VALIDITY_INSTRUCTION : null,
        options: IPIP_ACCURACY.map(([label, score]) => ({ label, score })),
        footer: "IPIP sentence. Public domain. The name of the scale is on the clinician record.",
      })
    })
  }
  if (setup.topics.personality) {
    personalitySource.items.forEach((item, index) => {
      steps.push({
        id: item.id,
        instrument: "personality",
        kind: "choice",
        kicker: "Personality",
        index: index + 1,
        count: personalitySource.items.length,
        title: item.text,
        quiet: item.direction,
        options: personalitySource.responseOptions.map((option) => ({
          label: option.label,
          score: option.value,
          wide: false,
        })),
        anchors: ["Disagree", "", "Neutral", "", "Agree"],
        footer: "IPIP sentence. Public domain. Not a symptom gate.",
      })
    })
    if (setup.mode === "monitoring" || personalitySource.items.every((item) => Number.isInteger(answers[item.id]) && answers[item.id] >= 1 && answers[item.id] <= 5)) {
      const view = setup.mode === "monitoring" ? { groups: ipipTraits.map(trait => ({ id: trait.screenId })) } : profile(personalitySource, pickPersonality(answers))
      for (const group of view.groups) {
        if (!extreme(group, setup)) continue
        const trait = traitByScreen.get(group.id)
        const rest = trait.items.filter((item) => item.id !== trait.screenId)
        rest.forEach((item, index) => {
          steps.push({
            id: `ipip-${item.id}`,
            instrument: "ipip",
            traitId: trait.id,
            sourceId: item.id,
            kind: "choice",
            kicker: trait.label,
            index: index + 1,
            count: rest.length,
            title: item.text,
            quiet: "The sentence already answered is kept in the 10-item score and is not asked again.",
            options: personalitySource.responseOptions.map((option) => ({
              label: option.label,
              score: option.value,
            })),
            anchors: ["Disagree", "", "Neutral", "", "Agree"],
            footer: "IPIP 10-item markers. Public domain. Not a diagnosis.",
          })
        })
      }
    }
  }

  if (setup.topics.alcohol && setup.auditFee === "no") {
    const gate = audit.items.slice(0, 3)
    const ready = gate.every((item) => Number.isInteger(answers[item.id]) && answers[item.id] >= 0 && answers[item.id] <= 4)
    const sum = ready ? gate.reduce((total, item) => total + answers[item.id], 0) : null
    const opened = followUpAllowed(setup, "alcohol") && (ready || setup.mode === "monitoring") && policyFor(setup).thresholds.alcohol.allowed.includes(setup.auditThreshold) && (sum >= setup.auditThreshold || setup.followUps?.alcohol)
    audit.items.slice(0, opened ? 10 : 3).forEach((item, index) => {
      steps.push(choiceStep({
        id: item.id,
        instrument: "audit",
        stage: index < 3 ? 1 : 2,
        kicker: "Alcohol",
        index: index + 1,
        count: opened ? 10 : 3,
        title: item.text,
        stem: index === 0 ? "Please choose the answer that is correct for you." : null,
        footer: AUDIT_FOOTER,
      }, item.options))
    })
  }

  if (setup.topics.trauma) steps.push(yesNoStep({
    id: pcptsd.exposureId,
    instrument: "pcptsd",
    kicker: "Trauma",
    index: 1,
    count: 1,
    title: pcptsd.exposureText,
    stem: pcptsd.lead,
    examples: pcptsd.examples,
    lead: true,
    footer: "PC-PTSD-5. Public domain.",
  }))

  if (setup.topics.trauma && answers[pcptsd.exposureId] === "yes") {
    pcptsd.items.forEach((text, index) => {
      steps.push(yesNoStep({
        id: `pcptsd-${index + 1}`,
        instrument: "pcptsd",
        kicker: "Trauma",
        index: index + 1,
        count: pcptsd.items.length,
        title: text,
        lead: index === 0,
        stem: pcptsd.symptomStem,
        footer: "PC-PTSD-5. Public domain. A “no” earlier would have stopped this branch.",
      }))
    })
    const symptomIds = pcptsd.items.map((_, index) => `pcptsd-${index + 1}`)
    if (symptomIds.every((id) => ["yes", "no"].includes(answers[id]))) {
      const count = symptomIds.filter((id) => answers[id] === "yes").length
      if (count >= policyFor(setup).thresholds.trauma.gate || setup.followUps?.trauma) {
        steps.push({
          id: pcl.eventId,
          instrument: "pcl",
          kind: "text",
          kicker: "PTSD checklist",
          index: 0,
          count: pcl.items.length,
          title: pcl.eventLabel,
          stem: pcl.instructions,
          lead: true,
          optional: true,
          footer: "PCL-5.",
        })
        pcl.items.forEach((text, index) => {
          steps.push(choiceStep({
            id: `pcl-${index + 1}`,
            instrument: "pcl",
            kicker: "PTSD checklist",
            index: index + 1,
            count: pcl.items.length,
            title: text,
            lead: index === 0,
            stem: pcl.stem,
            footer: "PCL-5, past month. Public domain. Not a diagnosis.",
          }, pcl.options))
        })
      }
    }
  }

  if (setup.topics.irritability && dassAllowed(setup)) {
    dassStress.items.forEach((item, index) => {
      steps.push(choiceStep({
        id: item.id,
        instrument: "dass",
        kicker: "Tension and irritability",
        index: index + 1,
        count: dassStress.items.length,
        title: item.text,
        lead: index === 0,
        stem: dassStress.instructions,
        footer: "DASS-21 Stress. Public domain. The score is shown to the clinician, not here.",
      }, dassStress.options))
    })
  }

  // Ask every selected brief screen before any follow-up or optional long scale.
  for (const definition of setup.questionnaires || []) steps.push(...questionnaireSteps(definition, setup, answers))
  return steps.map((step) => ({
    ...step,
    stage: step.stage || (["pcptsd", "personality"].includes(step.instrument) ? 1 : 2),
  })).filter(step => step.stage === 1 || followUpAllowed(setup, followUpTopic(step))).sort((a, b) => a.stage - b.stage)
}

export function nextStep(setup, answers = {}) {
  return patientPath(setup, answers).find((step) => !responseValid(step, answers)) ?? null
}

export function responseValid(step, answers) {
  if (step.kind === "text") return typeof answers[step.id] === "string"
  return !!step.options?.some((option) => option.score === answers[step.id])
}

export function answeredCount(setup, answers = {}) {
  const path = patientPath(setup, answers)
  return {
    done: path.filter((step) => responseValid(step, answers)).length,
    total: path.length,
    finished: path.every((step) => responseValid(step, answers)),
  }
}

function extreme(group, setup) {
  const id = group.category?.id || group.category
  return setup.mode === "monitoring" || policyFor(setup).personality.followUpBands.includes(id)
}

function has(answers, id) {
  return Object.prototype.hasOwnProperty.call(answers, id)
}

function pickPersonality(answers) {
  const picked = {}
  for (const item of personalitySource.items) picked[item.id] = answers[item.id]
  return picked
}

function keyed(item, raw) {
  return item.reverse ? 6 - raw : raw
}

export function scoreIpip(answers, setup) {
  if (!followUpAllowed(setup, "personality")) return []
  if (setup.mode !== "monitoring" && !personalitySource.items.every((item) => Number.isInteger(answers[item.id]) && answers[item.id] >= 1 && answers[item.id] <= 5)) return []
  const view = setup.mode === "monitoring" ? { groups: ipipTraits.map(trait => ({ id: trait.screenId, headline: null })) } : profile(personalitySource, pickPersonality(answers))
  const rows = []
  for (const group of view.groups) {
    if (!extreme(group, setup)) continue
    const trait = traitByScreen.get(group.id)
    const screen = trait.items.find((item) => item.id === trait.screenId)
    const parts = [{ item: screen, raw: answers[trait.screenId] }]
    let complete = Number.isInteger(answers[trait.screenId]) && answers[trait.screenId] >= 1 && answers[trait.screenId] <= 5
    for (const item of trait.items) {
      if (item.id === trait.screenId) continue
      const raw = answers[`ipip-${item.id}`]
      if (!Number.isInteger(raw) || raw < 1 || raw > 5) complete = false
      else parts.push({ item, raw })
    }
    if (!complete) {
      rows.push({ id: trait.id, label: trait.label, status: "incomplete", category: group.headline })
      continue
    }
    const sum = parts.reduce((total, part) => total + keyed(part.item, part.raw), 0)
    rows.push({
      id: trait.id,
      label: trait.label,
      status: "scored",
      category: group.headline,
      sum,
      low: 10,
      high: 50,
      sentence: `${trait.label}. ${IPIP_SENTENCE} ${setup.mode === "monitoring" ? "Full trait selected for monitoring." : `The five-item category was ${group.headline}.`} Sum ${sum}, on a scale from 10 to 50.`,
    })
  }
  return rows
}

export function scoreAudit(setup, answers) {
  if (!setup.topics.alcohol) return { status: "not-selected" }
  if (setup.auditFee !== "no") {
    return {
      status: "omitted",
      reason: "AUDIT was not administered. A fee is charged for completing the questionnaire.",
    }
  }
  if (!policyFor(setup).thresholds.alcohol.allowed.includes(setup.auditThreshold)) return { status: "incomplete", reason: "AUDIT-C threshold not selected." }
  const gate = audit.items.slice(0, 3)
  if (!gate.every((item) => item.options.some(([, value]) => value === answers[item.id]))) return { status: "incomplete" }
  const gateScore = gate.reduce((sum, item) => sum + answers[item.id], 0)
  const thresholdMet = gateScore >= setup.auditThreshold
  const opened = followUpAllowed(setup, "alcohol") && (thresholdMet || !!setup.followUps?.alcohol)
  const gateResult = { gateScore, threshold: setup.auditThreshold, thresholdMet, opened, override: !!setup.followUps?.alcohol }
  if (!followUpAllowed(setup, "alcohol")) return { ...gateResult, status: "omitted", reason: FOLLOW_UP_NOT_SELECTED, sentence: `AUDIT-C: ${gateScore}/12; follow-up threshold ≥${setup.auditThreshold}. ${FOLLOW_UP_NOT_SELECTED}`, drinkNote: audit.drinkNote }
  if (!opened) return { ...gateResult, status: "gate-closed", sentence: `AUDIT-C: ${gateScore}/12, below the selected threshold ≥${setup.auditThreshold}. Full AUDIT not administered. A negative gate does not exclude alcohol-related problems. Not a diagnosis.`, drinkNote: audit.drinkNote }
  if (!audit.items.every((item) => item.options.some(([, value]) => value === answers[item.id]))) return { ...gateResult, status: "incomplete" }
  const total = audit.items.reduce((sum, item) => sum + answers[item.id], 0)
  return {
    status: "scored",
    ...gateResult,
    total,
    low: 0,
    high: 40,
    formZone: audit.formZone,
    pageZone: audit.pageZone,
    zoneLimit: audit.zoneLimit,
    drinkNote: audit.drinkNote,
    sentence: `AUDIT-C: ${gateScore}/12; follow-up threshold ≥${setup.auditThreshold}. ${gateResult.override ? "Clinician requested follow-up." : "Threshold met."} ${audit.sentence} Total ${total}.`,
  }
}

export function scoreTrauma(answers, setup) {
  if (setup && !setup.topics.trauma) return { status: "not-selected" }
  const exposure = answers[pcptsd.exposureId]
  if (exposure !== "yes" && exposure !== "no") return { status: "incomplete" }
  if (exposure === "no") {
    return {
      status: "scored",
      exposure: "no",
      count: 0,
      stopped: true,
      pcl: null,
      sentence: `Exposure was no. ${pcptsd.sentence} Count 0.`,
    }
  }
  const symptomIds = pcptsd.items.map((_, index) => `pcptsd-${index + 1}`)
  if (!symptomIds.every((id) => ["yes", "no"].includes(answers[id]))) return { status: "incomplete", exposure: "yes" }
  const count = symptomIds.filter((id) => answers[id] === "yes").length
  const base = {
    status: "scored",
    exposure: "yes",
    count,
    stopped: count < policyFor(setup).thresholds.trauma.gate && !setup?.followUps?.trauma,
    threshold: policyFor(setup).thresholds.trauma.gate,
    thresholdMet: count >= policyFor(setup).thresholds.trauma.gate,
    override: !!setup?.followUps?.trauma,
    formCutNote: pcptsd.formCutNote,
    branchNote: `Configured PC-PTSD-5 gate ≥${policyFor(setup).thresholds.trauma.gate}. ${pcptsd.branchNote}` ,
    sentence: `${pcptsd.sentence} Count ${count}.`,
  }
  if (!followUpAllowed(setup, "trauma")) return { ...base, stopped: true, pcl: null, followUpDeferred: true, sentence: `${base.sentence} ${FOLLOW_UP_NOT_SELECTED}` }
  if (count < policyFor(setup).thresholds.trauma.gate && !setup?.followUps?.trauma) return { ...base, pcl: null }
  const itemIds = pcl.items.map((_, index) => `pcl-${index + 1}`)
  if (!itemIds.every((id) => Number.isInteger(answers[id]) && answers[id] >= 0 && answers[id] <= 4)) return { ...base, status: "incomplete", pcl: { status: "incomplete" } }
  const scores = itemIds.map((id) => answers[id])
  const total = scores.reduce((sum, score) => sum + score, 0)
  const clusters = pcl.clusters.map((cluster) => {
    const slice = scores.slice(cluster.from, cluster.to)
    const endorsed = slice.filter((score) => score >= policyFor(setup).thresholds.trauma.pclItem).length
    return {
      id: cluster.id,
      label: cluster.label,
      sum: slice.reduce((sum, score) => sum + score, 0),
      endorsed,
      need: cluster.need,
      met: endorsed >= cluster.need,
    }
  })
  return {
    ...base,
    stopped: false,
    pcl: {
      status: "scored",
      total,
      low: 0,
      high: 80,
      event: answers[pcl.eventId] || "",
      clusters,
      endorsementThreshold: policyFor(setup).thresholds.trauma.pclItem,
      provisional: clusters.every((cluster) => cluster.met),
      probableNote: `Configured symptom endorsement threshold ≥${policyFor(setup).thresholds.trauma.pclItem}. ${pcl.probableNote}`,
      sentence: policyFor(setup).thresholds.trauma.pclItem === 2 ? `${pcl.sentence} Total ${total}.` : `PCL-5 total ${total}/80. The configured item threshold ≥${policyFor(setup).thresholds.trauma.pclItem} differs from the published DSM-5 pattern rule; this is a custom cluster check, not a diagnosis.`,
    },
  }
}

export function scoreDass(setup, answers) {
  if (!setup.topics.irritability) return { status: "not-selected" }
  if (!followUpAllowed(setup, "irritability")) return { status: "omitted", reason: FOLLOW_UP_NOT_SELECTED }
  if (!dassAllowed(setup)) {
    return {
      status: "omitted",
      reason: "DASS-21 Stress was not administered. It is limited to a defined patient or research group, the doubled score is for the clinician, and the scale is not sold.",
    }
  }
  if (!dassStress.items.every((item) => Number.isInteger(answers[item.id]) && answers[item.id] >= 0 && answers[item.id] <= 3)) return { status: "incomplete" }
  const raw = dassStress.items.reduce((sum, item) => sum + answers[item.id], 0)
  return {
    status: "scored",
    raw,
    doubled: raw * 2,
    sentence: `${dassStress.sentence} Doubled score ${raw * 2}.`,
  }
}

export function activeCards(setup) {
  const cards = alwaysNamed.filter((card) => !((card.id === "depression" || card.id === "anxiety") && setup.topics[card.id])).map((card) => ({ ...card }))
  for (const topic of optionalTopics) {
    if (!setup.topics[topic.id]) continue
    if (topic.id === "personality" || topic.id === "irritability" || topic.id === "validity") continue
    if (selectedCards[topic.id]) cards.push({ id: topic.id, ...selectedCards[topic.id] })
  }
  // Retain the established ASSIST slot/id for existing integrations; do not add
  // a second result field for the same external instrument.
  cards.push(...externalMeasures.filter((row) => row.id !== 'external-assist').map((row) => ({ id: row.id, title: row.title, kind: 'external', url: row.url, body: row.note, sentence: 'External clinician-entered result; not calculated by Open Screen.', licence: row.reason, entry: { id: row.id, label: row.label, kind: 'text' } })))
  return cards
}

export function compileRecord(setup, answers = {}, clinician = {}, { generatedAt = new Date().toISOString() } = {}) {
  const flags = clinician.flags || {}
  const entered = clinician.entered || {}
  const personalityReady = setup.topics.personality
    && personalitySource.items.every((item) => Number.isInteger(answers[item.id]) && answers[item.id] >= 1 && answers[item.id] <= 5)
  const personality = personalityReady ? profile(personalitySource, pickPersonality(answers)) : null
  const ipip = setup.topics.personality ? scoreIpip(answers, setup) : []
  const alcohol = scoreAudit(setup, answers)
  const trauma = scoreTrauma(answers, setup)
  const stress = scoreDass(setup, answers)
  const symptoms = scoreSymptoms(setup, answers)
  const additional = (setup.questionnaires || []).map((definition) => questionnaireResult(definition, setup, answers)).filter((row) => row.status !== "not-selected")
  const currentSafetyEndorsement = Number.isInteger(answers["phq-9"]) && answers["phq-9"] > 0 && answers["phq-9"] <= 3
  const safetyFlag = currentSafetyEndorsement || clinician.safetyEndorsed === true || !!clinician.safetyEvents?.some(event => [event.from,event.to].some(value => Number.isInteger(value) && value > 0 && value <= 3))
  const validity = setup.topics.validity ? followUpAllowed(setup, "validity") ? scoreValidity(answers, policyFor(setup).responsePatterns) : { status: "omitted", reason: FOLLOW_UP_NOT_SELECTED } : null
  const cards = activeCards(setup)
  const refIds = []
  for (const screen of clinicalScreens) if (setup.topics[screen.id]) refIds.push(...screen.refs)
  const recordedCards = cards.filter(card => [card.entry, ...(card.fields || [])].filter(Boolean).some(field => (flags[field.id] ?? entered[field.id]) != null && (flags[field.id] ?? entered[field.id]) !== ''))
  for (const card of recordedCards) if (card.refs) refIds.push(...card.refs)
  if (setup.topics.personality) refIds.push("goldberg1992", "ipipKey")
  if (setup.topics.validity) refIds.push("ipipBidr", "ipipScales", "ipipScoring", "paulhus1991")
  if (setup.topics.alcohol && setup.auditFee === "no") refIds.push(...audit.refs, "auditCThreshold")
  if (setup.topics.trauma) refIds.push(...pcptsd.refs)
  if (trauma.pcl) refIds.push(...pcl.refs)
  if (setup.topics.irritability && dassAllowed(setup)) refIds.push(...dassStress.refs)
  const references = [...referenceList(refIds), ...additional.map((row) => ({ id: row.id, apa: `${row.source.citation} ${row.license.attribution}` }))]
  const sexNote = auditSexNote(alcohol, clinician.auditSex)

  const lines = []
  lines.push("Open Screen clinician record")
  lines.push(`Generated: ${generatedAt}. Engine: ${ENGINE_VERSION}. Application rules: ${RULES_VERSION}.`)
  lines.push(policyNote(policyFor(setup)))
  if (clinician.reference) lines.push(`Reference: ${clinician.reference}`)
  lines.push("Prepared locally. The app does not retain a copy after this tab closes.")
  lines.push(setup.context === "forensic" ? `Context: forensic. ${FORENSIC_WARNING}` : "Context: clinical.")
  for (const [id, selected] of Object.entries(setup.followUpChoices || {})) if (!selected && setup.mode !== "monitoring") lines.push(`${id}: ${FOLLOW_UP_NOT_SELECTED}`)
  lines.push("Adult screening support. No diagnosis, risk probability, or combined clinical score. Negative gates do not exclude a condition.")
  if (["Reviewed in interview","Follow-up required","Deferred","Declined"].includes(clinician.safetyReview)) lines.push(`Risk documentation: ${clinician.safetyReview}.`)
  if (safetyFlag) lines.push(currentSafetyEndorsement ? 'PHQ-9 item 9 was endorsed.' : 'Retained safety observation: earlier PHQ-9 item 9 endorsement; the current answer is corrected, declined or unavailable.')
  for (const event of clinician.safetyEvents || []) lines.push(`PHQ-9 item 9 observation/correction at ${event.at}: ${JSON.stringify(event.from)} → ${JSON.stringify(event.to)}. ${event.reason ? `Reason: ${event.reason}.` : ''}`)
  lines.push("")
  for (const row of symptoms) {
    lines.push(row.label, row.sentence, row.evidence)
    if (row.difficulty) lines.push(`Functional difficulty (not scored): ${row.difficulty}.`)
    lines.push("")
  }
  for (const row of additional) {
    lines.push(`${row.label} (${row.version}): ${row.status === "scored" ? row.scales ? "Profile complete; no combined total" : `${row.total}/${row.max}${row.band ? `, ${row.band}` : ""}` : row.status}. ${row.reason || row.source.limits}`)
    if (row.screenAt != null && row.status === 'scored') lines.push(`Screen threshold ≥${row.screenAt}: ${row.positive ? 'met; further assessment indicated' : 'not met; concerns still warrant assessment'}.`)
    if (row.continuousTotal != null) lines.push(`Alternative research total: ${row.continuousTotal}/24; research threshold ≥14 ${row.continuousTotal >= 14 ? 'met' : 'not met'}. Separate from the original endorsement count.`)
    for (const scale of row.scales || []) lines.push(`${scale.label}: ${scale.status !== 'scored' ? 'incomplete' : scale.sum === null ? 'No numerical score' : `${scale.sum} (range ${scale.min}–${scale.max})${scale.mean != null ? `; keyed mean ${scale.mean.toFixed(2)}` : ''}`}.${scale.stopRule ? ' ' + scale.stopRule : ''}${scale.note ? ' ' + scale.note : ''}`)
    if (row.threshold !== null) lines.push(`Brief score ${row.gateScore ?? "incomplete"}/${row.gateMax}; threshold ≥${row.threshold}.${row.override ? " Clinician requested follow-up." : ""}`)
  }
  if (validity) {
    lines.push(validityText(validity))
    lines.push("")
  }
  if (personality?.ready) {
    lines.push("Personality")
    lines.push(personality.analysis)
    lines.push("There is no combined personality total.")
  } else if (setup.topics.personality) {
    lines.push("Personality: incomplete.")
  }
  for (const row of ipip) {
    lines.push(row.status === "scored" ? row.sentence : `${row.label}: incomplete.`)
  }
  lines.push("")
  if (alcohol.status === "not-selected") {
    /* Alcohol was not in this sitting. */
  } else if (alcohol.status === "gate-closed") {
    lines.push("Alcohol", alcohol.sentence, alcohol.drinkNote)
  } else if (alcohol.status === "scored") {
    lines.push("Alcohol")
    lines.push(alcohol.sentence)
    lines.push(alcohol.drinkNote)
    lines.push(alcohol.formZone)
    lines.push(alcohol.pageZone)
    lines.push(alcohol.zoneLimit)
    if (sexNote) lines.push(sexNote)
  } else {
    lines.push(alcohol.sentence || alcohol.reason || (alcohol.gateScore != null ? `AUDIT-C ${alcohol.gateScore}/12; threshold ≥${alcohol.threshold}; full AUDIT opened but incomplete.` : "AUDIT-C incomplete."))
  }
  lines.push("")
  if (recordedCards.length) lines.push("Recorded clinical notes and external measures")
  for (const card of recordedCards) {
    lines.push(card.title, card.sentence)
    const fields = [card.entry, ...(card.fields || [])].filter((field) => field && (!field.when || flags[field.when] === "Yes"))
    for (const field of fields) {
      const value = flags[field.id] ?? entered[field.id]
      if (value != null && value !== "") lines.push(`${field.label}: ${value}`)
    }
  }
  if (clinician.facts) lines.push(`Clinician notes: ${clinician.facts}`)
  lines.push("")
  if (trauma.status === "not-selected") {
    /* The sitting did not include trauma. */
  } else if (trauma.status === "scored" || trauma.pcl) {
    if (trauma.sentence) lines.push(trauma.sentence)
    if (trauma.formCutNote) lines.push(trauma.formCutNote)
    if (trauma.branchNote) lines.push(trauma.branchNote)
    if (trauma.override) lines.push("PCL-5 follow-up opened at clinician request, independently of the brief-screen threshold.")
    if (trauma.pcl?.status === "scored") {
      lines.push(trauma.pcl.sentence)
      lines.push(trauma.pcl.probableNote)
      const pattern = trauma.pcl.provisional ? "met" : "not met"
      lines.push(`Configured symptom-cluster pattern, item score ${policyFor(setup).thresholds.trauma.pclItem} or higher: ${pattern}.`)
      for (const cluster of trauma.pcl.clusters) {
        lines.push(`${cluster.label}: sum ${cluster.sum}, endorsed ${cluster.endorsed} of ${cluster.need} required.`)
      }
      if (trauma.pcl.event) lines.push(`Worst event, as written: ${trauma.pcl.event}`)
    } else if (trauma.pcl?.status === "incomplete") {
      lines.push("PCL-5 opened and not finished.")
    }
  } else {
    lines.push("Trauma")
    lines.push("Trauma incomplete.")
  }
  lines.push("")
  if (stress.status === "scored") {
    lines.push("Tension and irritability")
    lines.push(stress.sentence)
  } else if (stress.status === "omitted") {
    lines.push("Tension and irritability")
    lines.push(stress.reason)
  } else if (stress.status === "incomplete") {
    lines.push("Tension and irritability")
    lines.push("DASS-21 Stress incomplete.")
  }
  lines.push("")
  lines.push("Response record — current questionnaire path, original response codes")
  const currentPath = patientPath(setup, answers)
  const currentIds = new Set(currentPath.map((step) => step.id))
  for (const step of currentPath) {
    if (!has(answers, step.id)) continue
    const raw = answers[step.id]
    const label = step.options?.find((option) => option.score === raw)?.label
    lines.push(`${step.id}. ${step.title}`)
    lines.push(label != null ? `Answer: ${label} (code ${raw}).` : `Answer: ${raw || "not provided"}.`)
  }
  const inactive = Object.entries(answers).filter(([id]) => !currentIds.has(id))
  if (inactive.length) {
    lines.push("Earlier responses outside the current scoring path (not used in current totals)")
    for (const [id, value] of inactive) lines.push(`${id}: ${String(value) || "not provided"}`)
  }
  if (currentSafetyEndorsement && !currentIds.has("phq-9")) lines.push(`Retained safety observation: PHQ-9 item 9 response code ${answers["phq-9"]} from earlier in this sitting; not erased by a changed gate or domain selection.`)
  lines.push("")
  lines.push("References")
  references.forEach((entry, index) => lines.push(`${index + 1}. ${entry.apa}`))

  return {
    generatedAt,
    policy: policyFor(setup),
    additional,
    personality,
    ipip,
    alcohol,
    trauma,
    stress,
    symptoms,
    safetyFlag,
    cards,
    sexNote,
    references,
    forensic: setup.context === "forensic",
    validity,
    text: lines.join("\n"),
  }
}

function auditSexNote(alcohol, sex) {
  if (alcohol.status !== "scored") return ""
  if (sex === "woman") {
    return "Sex was recorded as woman. The form’s dependence clause that names women is 13 or more. The scoring page’s clause is 15 or more and does not split by sex. Neither clause is selected as a local cut."
  }
  if (sex === "man") {
    return "Sex was recorded as man. The form’s dependence clause that names men is 15 or more. The scoring page’s clause is also 15 or more, and its hazardous band is not the same as the form’s “8 or more.” Neither wording is selected as a local cut."
  }
  return "Sex was not recorded, so the form’s separate clauses for women (13 or more) and men (15 or more) are both left standing. No clause is selected as a local cut."
}

export function licencesAdministered(setup, answers = {}) {
  const rows = []
  for (const screen of clinicalScreens) if (setup.topics[screen.id] && [1, 2].some((i) => has(answers, `${screen.prefix}-${i}`))) rows.push({ title: `${screen.brief} / ${screen.full}`, url: PHQ_MANUAL, limit: PHQ_CREDIT })
  if (setup.topics.validity && validityItems.some((item) => has(answers, item.id))) {
    rows.push({
      title: "IPIP impression management and self-deception",
      quote: "The items and scales are in the public domain, which means that one can copy, edit, translate, or use them for any purpose without asking permission and without paying a fee.",
      url: "https://ipip.ori.org/newSingleConstructsKey.htm",
      limit: "Public-domain IPIP key. Very Inaccurate is 1. Very Accurate is 5. Negatively keyed items are reversed.",
    })
  }
  if (setup.topics.personality && personalitySource.items.some((item) => has(answers, item.id))) {
    rows.push({
      title: "IPIP personality sentences",
      quote: "IPIP items and scales are in the public domain and can be copied, edited, or used without permission or a fee.",
      url: "https://ipip.ori.org/newBigFive5broadKey.htm",
      limit: "The 10-item extension has no clinical cut and is not a personality-disorder screen.",
    })
  }
  if (setup.topics.alcohol && setup.auditFee === "no") rows.push({ title: "AUDIT", ...audit.licence })
  if (setup.topics.trauma) rows.push({ title: "PC-PTSD-5", ...pcptsd.licence })
  if (scoreTrauma(answers, setup).pcl) rows.push({ title: "PCL-5", ...pcl.licence })
  if (setup.topics.irritability && dassAllowed(setup)) rows.push({ title: "DASS-21 Stress", ...dassStress.licence })
  for (const definition of setup.questionnaires || []) if (setup.topics[definition.id] && definition.items.some((item) => has(answers, item.id))) rows.push({ title: definition.title, url: definition.license.url, limit: definition.license.attribution })
  return rows
}
