import { externalMeasures } from './questionnaires/external.js'
import { exportJSON, isAnswered as responseValid } from "./api.js"
import { loadPracticeScreener, PRACTICE_KEY } from "./app-config.js"
import { copyText, focusMain, h, header as sharedHeader, icon, installStyles, markup, wireExportDisclosure, wireRadios } from "./ui.js"
import { profilesMarkup, buildReport, clinicalSummary, distributionChart, panelHtml, presentationStyles, reportMarkup, resultPanels } from "./presentation.js"

installStyles(presentationStyles)

let screener = loadPracticeScreener()
const scales = screener.catalog
const compileRecord = (...args) => screener.record(...args)
const patientPath = (...args) => screener.getSteps(...args)
const setupErrors = (...args) => screener.setupErrors(...args)
const licencesAdministered = (...args) => screener.licences(...args)
const primaryTopics = screener.policy.defaults.primaryTopics

const app = document.querySelector("#app")
const setup = screener.createSetup()
let clinicalScreens = screener.symptomDefinitions(setup)
const answers = {}
const clinician = { flags: {}, entered: {}, auditSex: "not-recorded", facts: "" }
let phase = "setup"
let cursor = null
let copied = false
let includeAppendix = false
let practiceError = ""

/** A sitting with any answers keeps its immutable configuration, including when
 * Back returns to setup. New/empty sittings pick up the latest saved preferences.
 */
function refreshPractice() {
  if (Object.keys(answers).length) return false
  try {
    const next = loadPracticeScreener()
    const changed = JSON.stringify(next.configuration) !== JSON.stringify(screener.configuration) || !!practiceError
    practiceError = ""
    screener = next
    if (setup.auditThreshold !== null && !screener.policy.thresholds.alcohol.allowed.includes(setup.auditThreshold)) setup.auditThreshold = null
    clinicalScreens = screener.symptomDefinitions(setup)
    return changed
  } catch {
    practiceError = "Practice settings need review. Open the screening logic page to review or reset them."
    return true
  }
}

function header(extra) {
  const workspace = phase === "setup" || phase === "record"
  return sharedHeader(extra, "interview", { navigation: workspace, homeLink: workspace })
}

let shown = ""

function render() {
  const y = window.scrollY
  const active = document.activeElement
  const activeId = active?.id
  const openSections = [...document.querySelectorAll('details[open][data-section]')].map((node) => node.dataset.section)
  const focusKey = active?.getAttribute("data-focus-key")
  const group = active?.closest('[role="radiogroup"]')
  const groupIndex = group ? [...document.querySelectorAll('[role="radiogroup"]')].indexOf(group) : -1
  const radioIndex = group ? [...group.querySelectorAll('[role="radio"]')].indexOf(active) : -1
  if (phase === "setup") drawSetup()
  else if (phase === "question") drawQuestion()
  else if (phase === "safety") drawSafety()
  else if (phase === "handoff") drawHandoff()
  else drawRecord()
  wireRadios()
  document.querySelectorAll('details[data-section]').forEach((node) => { if (openSections.includes(node.dataset.section)) node.open = true })
  document.title = phase === "record" ? "Clinician record · Open Screen" : "Clinical sitting · Open Screen"
  const marker = phase === "question" ? `question:${cursor || currentStep()?.id}` : phase
  if (marker !== shown) {
    shown = marker
    focusMain()
  } else {
    if (activeId) document.getElementById(activeId)?.focus({ preventScroll: true })
    else if (focusKey) document.querySelector(`[data-focus-key="${focusKey}"]`)?.focus({ preventScroll: true })
    else if (radioIndex >= 0) document.querySelectorAll('[role="radiogroup"]')[groupIndex]?.querySelectorAll('[role="radio"]')[radioIndex]?.focus({ preventScroll: true })
    window.scrollTo(0, y)
  }
}

function drawSetup() {
  const errors = [...setupErrors(setup), ...(practiceError ? [practiceError] : [])]
  app.replaceChildren(h("main", { class: "wrap sitting", id: "main", tabindex: "-1", "data-screen": "setup" },
    header(),
    h("a", { class: "back", href: "index.html" }, icon("back"), "All tools"),
    h("p", { class: "kicker" }, "Your practice workspace · Adults 18+"),
    h("h1", null, "New sitting"),
    h("p", { class: "lede" }, "Choose the setting and areas to screen."),
    h("a", { class: "logic-link", href: "logic.html", target: "_blank", rel: "noopener" }, "View screening logic", h("span", { class: "sr-only" }, " (opens in a new tab)"), " ↗"),
    screener.policy.id === "practice-custom" ? h("p", { class: "practice-notice" }, "Custom practice settings · ", screener.policy.version, ". Included in the clinical record.") : null,
    h("div", { class: "setup-layout" }, h("section", { class: "setup-controls", "aria-label": "Sitting options" },
    h("h2", null, "01", h("span", null, "Choose the setting")),
    h("div", { class: "segment context-options", role: "radiogroup", "aria-label": "Setting" },
      choice("Clinical", setup.context === "clinical", () => { setup.context = "clinical"; render() }),
      choice("Forensic", setup.context === "forensic", () => {
        setup.context = "forensic"
        render()
      }),
    ),
    setup.context === "forensic" ? h("p", { class: "setting-note" }, "Forensic context is recorded. These symptom thresholds are not calibrated for forensic decisions. Response-pattern checks do not establish malingering or credibility.") : null,
    h("h2", null, "02", h("span", null, "Choose the areas to explore")),
    h("div", { class: "scale-picks", "aria-label": "Screening areas" },
      ...scales.filter((scale) => primaryTopics.includes(scale.id)).map(scaleOption),
    ),
    h("details", { class: "additional-measures", "data-section": "additional-measures" },
      h("summary", null, "Additional measures", h("span", null, `${scales.filter((scale) => !primaryTopics.includes(scale.id) && setup.topics[scale.id]).length} selected`)),
      h("div", { class: "scale-picks" }, ...scales.filter((scale) => !primaryTopics.includes(scale.id)).map(scaleOption)),
    ),
    h('details', { class: 'external-measures', 'data-section': 'external-measures' }, h('summary', null, 'External measures'),
      h('p', { class: 'quiet' }, 'Permission needed before these questionnaires can be embedded. You can record results from authorised forms during clinician review.'),
      ...externalMeasures.map((row) => h('p', { class: 'quiet' }, h('a', { href: row.url, target: '_blank', rel: 'noopener noreferrer' }, row.title + ' ↗'), ' · ' + row.reason))),
    h("label", { class: "field reference-field" }, h("span", null, "Reference (optional)"), h("input", { type: "text", maxlength: 200, value: clinician.reference || "", placeholder: "Your practice reference", autocomplete: "off", onInput: (event) => { clinician.reference = event.target.value; markDirty() } })),
    setup.topics.alcohol ? h("section", { class: "setup-condition", "aria-label": "Alcohol settings" },
      h("h3", null, "Alcohol screen settings"),
      check("No fee is charged to complete this questionnaire.", setup.auditFee === "no", (value) => { setup.auditFee = value ? "no" : null }),
      h("p", { class: "quiet" }, `Allowed thresholds: ${screener.policy.thresholds.alcohol.allowed.map((cut) => `≥${cut}`).join(", ")}. Published reference: female ≥3; male ≥4. The clinician chooses; no threshold is inferred from identity.`),
      h("div", { class: "segment", role: "radiogroup", "aria-label": "AUDIT-C threshold" },
        ...screener.policy.thresholds.alcohol.allowed.map((cut) => choice(`≥${cut}`, setup.auditThreshold === cut, () => { setup.auditThreshold = cut; render() }))),
    ) : null,
    setup.topics.irritability ? h("div", { class: "setup-condition checks", "aria-label": "Tension conditions" },
      h("h3", null, "DASS administration conditions"),
      check("A defined patient or research group.", setup.definedPatientGroup, (value) => { setup.definedPatientGroup = value }),
      check("Scores go to the clinician, not the respondent.", setup.scoresToClinician, (value) => { setup.scoresToClinician = value }),
      check("The scale is not sold.", setup.scaleNotSold, (value) => { setup.scaleNotSold = value }),
    ) : null,
    ...scales.filter((scale) => setup.topics[scale.id] && (scale.requirements?.length || scale.formChoices?.length)).map((scale) => h("section", { class: "setup-condition" },
      h("h3", null, `${scale.name} · administration`),
      scale.formChoices?.length ? h('div', { class: 'segment', role: 'radiogroup', 'aria-label': `${scale.name} form` }, ...scale.formChoices.map((form) => choice(form.label, setup.forms[scale.id] === form.id, () => { setup.forms[scale.id] = form.id; render() }))) : null,
      scale.id === 'taps' ? h('p', { class: 'quiet' }, 'Original US form: its drink examples refer to about 14 g of alcohol, rather than Australian 10 g standard drinks. The clinician selects the form; identity is not inferred. TAPS alcohol and AUDIT remain separate.') : null,
      ...scale.requirements.map((requirement) => check(requirement.label, setup.confirmations[`${scale.id}:${requirement.id}`] === true, (value) => { setup.confirmations[`${scale.id}:${requirement.id}`] = value })),
    )),
    h("div", { class: "setup-launch" },
    errors.length ? h("p", { class: "setup-hint", id: "setup-errors", role: "status" }, errors.join(" ")) : null,
    h("button", {
      type: "button",
      class: "go",
      disabled: errors.length > 0,
      "aria-describedby": errors.length ? "setup-errors" : null,
      onClick: () => {
        if (refreshPractice()) { render(); return }
        if (practiceError) return
        if (setupErrors(setup).length) return
        cursor = null
        phase = "question"
        render()
      },
    }, "Begin sitting", icon("arrow")),
    ),
    ), h("aside", { class: "sitting-plan" },
      h("p", { class: "kicker" }, "The sitting"),
      h("h2", null, "Two stages, then review."),
      h("ol", { class: "stage-list" },
        h("li", null, h("strong", null, "Brief screens")),
        h("li", null, h("strong", null, "Follow-up when indicated")),
        h("li", null, h("strong", null, "Clinician review")),
      ),
      h("p", { class: "plan-note" }, icon("lock"), "Answers stay in this tab. Copy or print the record before closing."),
      h("p", { class: "quiet" }, "Direct safety assessment is separate from these screens."),
      h("a", { href: "https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/cssrs-for-communities-and-healthcare/", target: "_blank", rel: "noopener noreferrer", class: "source-link" }, "Open the official C-SSRS resources ↗"),
      h("details", { class: "threshold-details" }, h("summary", null, "Thresholds & sources"),
        ...clinicalScreens.map((screen) => h("p", null, `${screen.brief} ≥${screen.openAt} → ${screen.full}. `, h("a", { href: screen.source, target: "_blank", rel: "noopener noreferrer" }, "Official form"))),
        h("p", null, `PC-PTSD-5 ≥${screener.policy.thresholds.trauma.gate} → PCL-5. The configured rule is recorded in exports.`),
        h("p", null, `Policy ${screener.policy.id} · ${screener.policy.version}. ${screener.policy.rationale}`),
      ),
    )),
  ))
}

function scaleOption(scale) {
  return h("button", { type: "button", pressed: !!setup.topics[scale.id], "data-focus-key": scale.id, onClick: () => toggleScale(scale.id) },
    h("span", { class: "scale-check", "aria-hidden": "true" }, setup.topics[scale.id] ? icon("check") : null),
    h("strong", null, scale.name), h("span", { class: "scale-detail" }, scale.detail), h("span", { class: "scale-tag" }, scale.tag))
}

function toggleScale(id) {
  setup.topics[id] = !setup.topics[id]
  if (id === "alcohol" && !setup.topics.alcohol) setup.auditFee = null
  render()
}

function choice(label, on, click) {
  return h("button", { type: "button", role: "radio", checked: on, onClick: () => { copied = false; click() } }, label)
}

function check(label, on, set) {
  const input = h("input", {
    type: "checkbox",
    onChange: (event) => { set(event.target.checked); render() },
    "data-focus-key": label.replace(/[^a-z]/gi, ""),
  })
  input.checked = on
  return h("label", null, input, h("span", null, label))
}

function currentStep() {
  const path = patientPath(setup, answers)
  if (cursor) {
    const step = path.find((entry) => entry.id === cursor)
    if (step) return step
  }
  return path.find((entry) => !responseValid(entry, answers)) || null
}

function drawQuestion() {
  const step = currentStep()
  if (!step) {
    phase = "handoff"
    cursor = null
    drawHandoff()
    return
  }
  cursor = step.id
  const path = patientPath(setup, answers)
  const position = path.findIndex((entry) => entry.id === step.id) + 1
  const selected = Object.prototype.hasOwnProperty.call(answers, step.id) ? answers[step.id] : null
  const context = [step.stem && "question-stem", step.examples && "question-examples"].filter(Boolean).join(" ") || null
  app.replaceChildren(h("main", { class: "wrap sitting", id: "main", tabindex: "-1", "data-screen": "question", "data-step": step.id },
    header(h("p", { class: "progress" }, `Question ${position}`)),
    h("div", { class: "question-topline" }, h("p", { class: "kicker" }, step.stage === 1 ? "Stage 1 · Brief screening" : "Stage 2 · Additional screening"), h("span", { class: "quiet" }, step.kicker)),
    h("div", { class: "stage-track", "aria-hidden": "true" }, h("span", { class: "on" }), h("span", { class: step.stage === 2 ? "on" : "" })),
    step.stem ? h("p", { class: "stem", id: "question-stem" }, step.stem) : null,
    step.examples ? h("ul", { class: "pills", id: "question-examples" }, ...step.examples.map((line) => h("li", null, line))) : null,
    h("h1", { class: "question", id: "question-title", "aria-describedby": context }, step.title),
    step.kind === "text"
      ? h("textarea", {
        class: "event",
        id: "event-text", maxlength: 4000,
        "aria-label": step.title,
        "aria-describedby": context,
      }, selected || "")
      : h("div", null,
        h("p", { class: "keyboard-hint", id: "answer-help" }, `Selecting an answer moves to the next question. Keys 1–${step.options.length} also answer.`),
        answerControl(step, selected, [context, "answer-help"].filter(Boolean).join(" "))),
    h("div", { class: "question-actions" },
      h("button", { type: "button", class: "back-link", onClick: () => back(step) }, icon("back"), "Back"),
      step.kind === "text" ? h("button", { type: "button", class: "go", id: "continue", onClick: () => advance(step) }, "Continue", icon("arrow")) : null,
    ),
    step.kind === "text" ? h("p", { class: "keyboard-hint" }, "Ctrl / ⌘ + Enter to continue. This description is optional.") : null,
    step.footer ? h("details", { class: "item-source" }, h("summary", null, "About this questionnaire"), h("p", null, step.footer)) : null,
  ))
  const box = document.querySelector("#event-text")
  if (box) {
    box.addEventListener("input", () => { answers[step.id] = box.value; copied = false })
    box.addEventListener("keydown", (event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); advance(step) } })
  }
}

let keyBound = false
function onKey(event) {
  if (phase !== "question" || event.repeat) return
  if (event.target?.closest?.('[role="radio"]') || event.altKey || event.metaKey || event.ctrlKey) return
  const step = currentStep()
  if (!step || step.kind === "text") {
    return
  }
  if (event.target?.closest?.("input, textarea, button, a, summary")) return
  const index = Number(event.key) - 1
  if (index >= 0 && index < step.options.length) {
    event.preventDefault()
    selectAnswer(step, step.options[index].value)
  }
}

function selectAnswer(step, value, event) {
  // A double-click can land on the next screen in the same position. Keep its
  // second click from recording another answer or taking the heading's focus.
  if (event?.detail > 1) {
    event.preventDefault()
    document.querySelector("#question-title")?.focus({ preventScroll: true })
    return
  }
  // Detached controls must not answer a question after its screen has changed.
  if (phase !== "question" || currentStep()?.id !== step.id) return
  if (step.id === "phq-9" && value > 0 && answers[step.id] !== value) clinician.safetyAcknowledged = false
  answers[step.id] = value
  copied = false
  advance(step)
}

function answerControl(step, selected, context) {
  if (step.anchors) {
    return h("div", null,
      h("div", { class: "grid-5", role: "radiogroup", "aria-labelledby": "question-title", "aria-describedby": context },
        ...step.options.map((option) => h("button", {
          type: "button",
          role: "radio",
          checked: selected === option.value,
          "aria-label": `${option.value}, ${step.anchors[step.options.indexOf(option)] || "between the labeled points"}`,
          onClick: (event) => selectAnswer(step, option.value, event),
        }, String(option.value))),
      ),
      h("div", { class: "anchors", "aria-hidden": "true" }, ...step.anchors.map((label) => h("span", null, label))),
    )
  }
  const pair = step.options.length === 2 ? "choices pair" : "choices"
  return h("div", { class: pair, role: "radiogroup", "aria-labelledby": "question-title", "aria-describedby": context },
    ...step.options.map((option) => h("button", {
      type: "button",
      role: "radio",
      checked: selected === option.value,
      onClick: (event) => selectAnswer(step, option.value, event),
    }, option.label)),
  )
}

function advance(step) {
  if (!step) return
  if (step.kind === "text" && !Object.prototype.hasOwnProperty.call(answers, step.id)) answers[step.id] = ""
  if (!responseValid(step, answers)) return
  if (step.id === "phq-9" && answers[step.id] > 0 && !clinician.safetyAcknowledged) {
    phase = "safety"
    render()
    return
  }
  const path = patientPath(setup, answers)
  const index = path.findIndex((entry) => entry.id === step.id)
  const following = path[index + 1]
  if (following) {
    cursor = following.id
    phase = "question"
  } else {
    cursor = null
    phase = "handoff"
  }
  render()
}

function back(step) {
  const path = patientPath(setup, answers)
  const index = path.findIndex((entry) => entry.id === step.id)
  if (index <= 0) {
    phase = "setup"
    cursor = null
  } else {
    cursor = path[index - 1].id
    phase = "question"
  }
  render()
}

function drawHandoff() {
  app.replaceChildren(h("main", { class: "wrap sitting handoff", id: "main", tabindex: "-1", "data-screen": "handoff" },
    header(),
    h("div", { class: "completion-mark" }, icon("check")),
    h("p", { class: "kicker" }, "Questions complete"),
    h("h1", null, "Thank you. You’re all done."),
    h("p", { class: "lede" }, "Please return this device to your psychologist. They’ll review your responses with you."),
    h("p", { class: "quiet" }, "For the clinician"),
    h("button", { type: "button", class: "go", id: "open-record", onClick: () => { phase = "record"; render() } }, "Review clinician record", icon("arrow")),
    h("button", { type: "button", class: "back-link", onClick: reviewAnswers }, "Review answers"),
  ))
}

function drawSafety() {
  app.replaceChildren(h("main", { class: "wrap sitting handoff", id: "main", tabindex: "-1", "data-screen": "safety" },
    header(),
    h("p", { class: "kicker" }, "Pause for support"),
    h("h1", null, "Let’s check in with your psychologist."),
    h("p", { class: "lede" }, "Thank you for sharing this. Please let your psychologist know before continuing, so they can talk with you about how you’re feeling."),
    h("div", { class: "banner" }, "For the clinician: PHQ-9 item 9 was endorsed. Assess safety directly now, independently of the total score. Use your practice’s safety procedure and the official C-SSRS where appropriate."),
    h("div", { class: "safety-actions" },
      h("a", { class: "source-link", href: "https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/cssrs-for-communities-and-healthcare/", target: "_blank", rel: "noopener noreferrer" }, "Official C-SSRS resources ↗"),
      h("button", { class: "go", type: "button", onClick: () => { clinician.safetyAcknowledged = true; phase = "question"; advance(currentStep()) } }, "Clinician: reviewed; continue under supervision"),
    ),
  ))
}

function drawRecord() {
  const record = compileRecord(setup, answers, clinician)
  const licences = licencesAdministered(setup, answers)
  const panels = resultPanels(record)
  const closed = [
    ...(record.additional || []).filter((row) => row.status === "gate-closed").map((row) => [row.id, row.full]),
    ...record.symptoms.filter((row) => row.status === "gate-closed").map((row) => [row.id, row.full]),
    ...(record.alcohol.status === "gate-closed" ? [["alcohol", "AUDIT"]] : []),
    ...(record.trauma.status === "scored" && record.trauma.stopped && !record.trauma.pcl && answers["pcptsd-exposure"] === "yes" ? [["trauma", "PCL-5"]] : []),
  ]
  app.replaceChildren(h("main", { class: "wrap record-wrap", id: "main", tabindex: "-1", "data-screen": "record" },
    header(h("p", { class: "quiet" }, record.forensic ? "Forensic" : "Clinical")),
    h("div", { class: "review-heading" },
      h("div", null, h("p", { class: "kicker" }, "For the clinician"), h("h1", null, "Screening review")),
      h("p", { class: "review-reference" }, clinician.reference || "This sitting", h("span", null, `${Object.keys(answers).length} responses · ${panels.length + record.additional.filter((row) => row.scales).length} selected areas`)),
    ),
    screener.policy.id === "practice-custom" ? h("details", { class: "practice-notice" }, h("summary", null, "Custom practice settings used"), h("p", null, screener.policy.rationale)) : null,
    h("div", { class: "review-toolbar actions" },
      h("button", { type: "button", class: "primary", id: "copy-record", onClick: () => copyRecord() }, "Copy summary"),
      h("button", { type: "button", id: "print-report", onClick: () => { syncPrintRecord(); window.print() } }, "Print report"),
      h("button", { type: "button", id: "download-report", onClick: downloadReport }, "Save report"),
      h("details", { class: "export-menu", "data-section": "export-menu" },
        h("summary", null, "More"),
        h("div", { class: "export-options" },
          h("button", { type: "button", id: "save-json", onClick: downloadJSON }, "Save structured JSON"),
          h("button", { type: "button", id: "copy-full-record", onClick: () => copyRecord(true) }, "Copy full record"),
          h("button", { type: "button", onClick: reviewAnswers }, "Review responses"),
          h("label", null, h("input", { type: "checkbox", checked: includeAppendix, onChange: (event) => { includeAppendix = event.target.checked } }), "Include response appendix"),
          h("button", { type: "button", onClick: clearSitting }, "New sitting"),
        ),
      ),
    ),
    h("p", { class: "export-status", id: "export-status", role: "status", "aria-live": "polite" }),
    record.safetyFlag ? h("div", { class: "safety-banner", role: "alert" }, h("strong", null, "Priority · direct safety review"), h("p", null, "PHQ-9 item 9 was endorsed. Review directly, regardless of the total or current gate.")) : null,
    record.forensic ? h("p", { class: "context-limit" }, "Forensic context: published thresholds are not calibrated for this population.") : null,
    h("section", { class: "clinical-results", "aria-label": "Two-stage screening results" }, ...panels.map((panel) => markup(panelHtml(panel)))),
    markup(profilesMarkup(record)),
    h("div", { class: "board" }, validityTile(record), stressTile(record)),
    personalityBlock(record),
    h("section", { class: "review-safety" },
      h("div", { class: "review-section-heading" }, h("h2", null, "Safety review"), h("span", { class: "quiet" }, "Independent of symptom scores")),
      h("div", { class: "segment", role: "radiogroup", "aria-label": "Direct safety review" }, ...["Not recorded", "Reviewed in interview", "Follow-up required"].map((label) => choice(label, (clinician.safetyReview || "Not recorded") === label, () => { clinician.safetyReview = label; markDirty(); render() }))),
      h("a", { class: "source-link", href: "https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/cssrs-for-communities-and-healthcare/", target: "_blank", rel: "noopener noreferrer" }, "Official C-SSRS resources ↗"),
    ),
    h("details", { class: "review-checks", "data-section": "review-checks", open: Object.values(clinician.flags).some((value) => value === "Yes") },
      h("summary", null, "Interview & external measures", h("span", null, `${record.cards.length} areas`)),
      ...record.cards.map(cardBlock),
    ),
    h("label", { class: "field formulation-field" }, h("span", null, "Formulation & follow-up"), h("textarea", { id: "clinical-notes", maxlength: 20000, placeholder: "Relevant interview findings, collateral information, and agreed next steps.", onInput: (event) => { clinician.facts = event.target.value; markDirty() } }, clinician.facts)),
    closed.length ? h("details", { class: "follow-up-options", "data-section": "follow-up-options" },
      h("summary", null, "Open an additional follow-up"),
      h("p", { class: "quiet" }, "A negative brief screen does not exclude a condition. You can request the full screen."),
      h("div", { class: "override-actions" }, ...closed.map(([id, label]) => h("button", { type: "button", class: "text-button", onClick: () => { setup.followUps[id] = true; phase = "question"; cursor = null; markDirty(); render() } }, `Open ${label}`))),
    ) : null,
    h("details", { class: "sources", "data-section": "sources" }, h("summary", null, "Sources & scoring notes"),
      ...licences.map((row) => h("p", null, `${row.title}. ${row.limit}`)),
      h("ol", { class: "refs" }, ...record.references.map((entry) => h("li", null, entry.apa))),
    ),
    h("p", { class: "review-footnote" }, "Screening is not a diagnosis. Negative gates do not exclude conditions. Export before closing this tab."),
    h("section", { class: "print-only", id: "print-record" }, markup(reportMarkup(record, clinician, { appendix: includeAppendix }))),
  ))
  const appendix = document.querySelector('.export-options input')
  if (appendix) appendix.checked = includeAppendix
}

function tile(kicker, number, note, fill) {
  return h("article", { class: "tile" },
    h("p", { class: "construct" }, kicker),
    h("p", { class: "num" }, number),
    note ? h("p", { class: "mark" }, note) : null,
    fill,
  )
}

function meter(value, max) {
  const portion = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return h("div", { class: "meter", "aria-hidden": "true" }, h("span", { style: `width:${portion * 100}%` }))
}

function validityTile(record) {
  const validity = record.validity
  if (!validity || validity.status !== "scored") return null
  return h("article", { class: "tile wide" },
    h("p", { class: "construct" }, "Response patterns · IPIP"),
    h("p", { class: "mark" }, validity.label),
    h("p", { class: "quiet" }, "Descriptive response patterns. Not a validated malingering, credibility, or performance-validity test."),
    h("div", { class: "pair-meters" },
      h("div", null,
        h("p", { class: "quiet" }, "Impression"),
        h("p", { class: "num" }, String(validity.im.mean)),
        meter(validity.im.mean - 1, 4),
      ),
      h("div", null,
        h("p", { class: "quiet" }, "Self-deception"),
        h("p", { class: "num" }, String(validity.deception.mean)),
        meter(validity.deception.mean - 1, 4),
      ),
    ),
  )
}

function personalityBlock(record) {
  if (!record.personality?.ready) return null
  return h("section", { class: "tile wide" },
    histogram(record.personality),
    record.ipip.length ? h("div", { class: "pair-meters" },
      ...record.ipip.map((row) => h("div", null,
        h("p", { class: "quiet" }, row.label),
        h("p", { class: "num" }, row.status === "scored" ? String(row.sum) : "—"),
        row.status === "scored" ? meter(row.sum - 10, 40) : null,
      )),
    ) : null,
  )
}

function histogram(view) {
  return markup(distributionChart(view))
}

function stressTile(record) {
  const stress = record.stress
  if (!stress || stress.status !== "scored") return null
  return tile("Tension", String(stress.doubled), "doubled", meter(stress.doubled, 42))
}

function cardBlock(card) {
  return h("section", { class: "block", "data-card": card.id },
    h("p", { class: "construct" }, card.kind === "flag" ? "Interview flag" : "Official form, not in this program"),
    h("h2", null, card.title),
    h("p", null, card.body),
    h("p", null, card.sentence),
    h("p", { class: "licence-line" }, card.licence),
    card.url ? h("a", { class: "source-link", href: card.url, target: "_blank", rel: "noopener noreferrer" }, "Official resource ↗") : null,
    card.entry ? entryField(card.entry) : null,
    ...(card.fields || []).map((field) => fieldControl(card, field)),
  )
}

function entryField(entry) {
  if (entry.options) {
    return h("div", { class: "field" },
      h("span", null, entry.label),
      h("div", { class: "segment", role: "radiogroup", "aria-label": entry.label },
        ...entry.options.map((option) => choice(option, clinician.flags[entry.id] === option, () => {
          clinician.flags[entry.id] = option
          render()
        })),
      ),
    )
  }
  const common = {
    "aria-label": entry.label,
    onInput: (event) => { clinician.entered[entry.id] = event.target.value; markDirty() },
  }
  return h("label", { class: "field" },
    h("span", null, entry.label),
    entry.kind === "number"
      ? h("input", { type: "number", inputmode: "numeric", maxlength: 4000, value: clinician.entered[entry.id] || "", ...common })
      : h("input", { type: "text", maxlength: 4000, value: clinician.entered[entry.id] || "", ...common }),
  )
}

function fieldControl(card, field) {
  if (field.when && clinician.flags[field.when] !== "Yes") return null
  if (field.options) {
    return h("div", { class: "field" },
      h("span", null, field.label),
      h("div", { class: "segment", role: "radiogroup", "aria-label": field.label },
        ...field.options.map((option) => choice(option, clinician.flags[field.id] === option, () => {
          clinician.flags[field.id] = option
          render()
        })),
      ),
    )
  }
  return h("label", { class: "field" },
    h("span", null, field.label),
    h("input", {
      type: "text",
      maxlength: 4000,
      value: clinician.flags[field.id] || "",
      "aria-label": field.label,
      onInput: (event) => { clinician.flags[field.id] = event.target.value; markDirty() },
    }),
  )
}

function markDirty() {
  copied = false
  const button = document.querySelector("#copy-record")
  if (button) button.textContent = "Copy summary"
  const status = document.querySelector("#export-status")
  if (status) status.textContent = ""
}

async function copyRecord(full = false) {
  const snapshot = JSON.stringify({ setup, answers, clinician })
  const record = compileRecord(setup, answers, clinician)
  const success = await copyText(full ? record.text : clinicalSummary(record, clinician))
  const unchanged = snapshot === JSON.stringify({ setup, answers, clinician })
  copied = success && unchanged
  const button = document.getElementById(full ? "copy-full-record" : "copy-record")
  if (button) button.textContent = copied ? "Copied" : full ? "Copy full record" : "Copy summary"
  const status = document.getElementById("export-status")
  if (status) status.textContent = !success ? "Copy unavailable. Use Save report or Print report." : !unchanged ? "Copied the earlier version. Copy again to include your latest edits." : full ? "Full record copied." : "Clinical summary copied."
}

function syncPrintRecord() {
  const output = document.getElementById("print-record")
  if (output) output.replaceChildren(markup(reportMarkup(compileRecord(setup, answers, clinician), clinician, { appendix: includeAppendix })))
}

function downloadReport() {
  const record = compileRecord(setup, answers, clinician)
  const html = buildReport(record, clinician, { appendix: includeAppendix })
  downloadFile(html, "text/html;charset=utf-8", `open-screen-${record.generatedAt.slice(0, 10)}.html`)
  document.getElementById("export-status").textContent = "Report download requested. The HTML report opens offline and can be printed to PDF."
}

function downloadJSON() {
  const record = compileRecord(setup, answers, clinician)
  downloadFile(exportJSON(record, { includeResponses: includeAppendix }), "application/json", `open-screen-${record.generatedAt.slice(0, 10)}.json`)
  document.getElementById("export-status").textContent = "JSON download requested. Keep this clinical record in your practice’s approved system."
}

function downloadFile(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = h("a", { href: url, download: filename, hidden: true })
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function reviewAnswers() {
  cursor = patientPath(setup, answers)[0]?.id || null
  phase = "question"
  copied = false
  render()
}

window.addEventListener("beforeprint", syncPrintRecord)

function clearSitting() {
  if (!window.confirm("Start a new sitting? Export first. Current answers and clinical notes will be cleared.")) return
  setup.followUps = {}
  setup.confirmations = {}
  setup.forms = {}
  for (const key of Object.keys(answers)) delete answers[key]
  refreshPractice()
  setup.auditThreshold = screener.policy.thresholds.alcohol.default
  clinician.flags = {}
  clinician.entered = {}
  clinician.auditSex = "not-recorded"
  clinician.facts = ""
  clinician.reference = ""
  includeAppendix = false
  clinician.safetyReview = null
  clinician.safetyAcknowledged = false
  cursor = null
  copied = false
  phase = "setup"
  render()
}

window.addEventListener("beforeunload", (event) => {
  if (copied) return
  if (!Object.keys(answers).length) return
  event.preventDefault()
  event.returnValue = ""
})

if (!keyBound) {
  document.addEventListener("keydown", onKey)
  keyBound = true
}

document.querySelector(".skip").addEventListener("click", (event) => { event.preventDefault(); document.querySelector("#main").focus() })
wireExportDisclosure()
window.addEventListener("storage", (event) => {
  if ((event.key === PRACTICE_KEY || event.key === null) && phase === "setup" && refreshPractice()) render()
})
window.addEventListener("focus", () => { if (phase === "setup" && refreshPractice()) render() })
render()
