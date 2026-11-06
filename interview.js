import { followUpTopic } from './core/followups.js'
import { PRACTICE_FIELDS, omissionReason, riskReviewNotice, safetyFindings, safetyReviewCurrent, safetyResponseChange, preserveSafetyReview } from "./core/workflow.js"
import { externalTotals, externalTotalError } from './core/external-fields.js'
import { rebaseSetup, freshSetup, mergeHistory } from './core/transitions.js'
import { plaintextBytes, VAULT_PLAINTEXT_LIMIT, assertVaultCapacity } from './core/vault.js'
import { evidenceLines } from "./core/evidence.js"
import { newAssessment, assessmentContent, assessmentRecord, assessmentFactory, finaliseAssessment } from './core/assessment.js'
import { historySeries } from './core/history.js'
import { measureInfo, personalityOverlap, assessmentBurden } from './core/templates.js'
import { leaveAssessmentDialog, vaultDialog, templateControls, presetPicker, historySection } from './workspace-ui.js'
import { exportTools, reviewChecklist, revealReviewTarget, resultIndex, profileIndex } from "./review-ui.js"
import { externalMeasures } from './questionnaires/external.js'
import { exportJSON, isAnswered as responseValid } from "./api.js"
import { loadPracticeScreener, readPractice, PRACTICE_KEY } from "./app-config.js"
import { informationAction, informationButton, copyText, focusMain, h, header as sharedHeader, icon, installStyles, markup, setFieldError, wireExportDisclosure, wireFormValidation, wireRadios, wireWorkspaceMenu } from "./ui.js"
import { historyMarkup, buildReport, clinicalSummary, distributionChart, presentationStyles, reportMarkup, resultPanels } from "./presentation.js"

installStyles(presentationStyles)

const initialPractice = readPractice()
let screener = initialPractice.screener
let scales = screener.catalog
const patientPath = (...args) => screener.getSteps(...args)
const setupErrors = (...args) => screener.setupErrors(...args)
const licencesAdministered = (...args) => screener.licences(...args)
let primaryTopics = screener.policy.defaults.primaryTopics

const app = document.querySelector("#app")
const setup = screener.createSetup()
let clinicalScreens = screener.symptomDefinitions(setup)
const answers = {}
const clinician = { flags: {}, entered: {}, auditSex: "not-recorded", facts: "" }
let phase = "setup"
let cursor = null
let copied = false
let includeAppendix = false
let practiceError = initialPractice.error || ""
let identity = { id: crypto.randomUUID(), startedAt: new Date().toISOString() }
let finalAssessment = null
let history = []
let capturedConfiguration = false
let measureSearch = ""
let setupPage = "setting"
let selectedPreset = null
let workspaceMessage = ""
let reviewerName = ""
let savedSignature = null
let questionError = ''
let archivedSignature = null
let homeNavigationApproved = false
const invalidExternal = new Map()

// Only an encrypted snapshot counts as recoverable. Clipboard/HTML exports do not.
function bundleSignature(bundle) {
  return JSON.stringify([assessmentContent(bundle.current), bundle.current.review, bundle.history.map(a => [a.id, a.review.digest])])
}
function hasWork() { return Object.keys(answers).length > 0 || !!clinician.reference || !!clinician.facts || !!clinician.safetyReview || Object.keys(clinician.flags || {}).length > 0 || Object.keys(clinician.entered || {}).length > 0 || Object.values(clinician.practice || {}).some(Boolean) || history.length > 0 }
function saveState() {
  if (!hasWork()) return ''
  if (plaintextBytes(sittingBundle()) > VAULT_PLAINTEXT_LIMIT) return 'Encrypted file capacity exceeded. Archive encrypted history before closing; no history has been removed.'
  return savedSignature === bundleSignature(sittingBundle()) ? 'Encrypted snapshot current · verify your saved file' : 'Changes not saved in an encrypted assessment'
}
function updateSaveStatus() {
  const node = document.getElementById('save-state')
  if (node) node.textContent = saveState()
}
function practiceField(key) {
  const p = clinician.practice || (clinician.practice = {})
  return h('label', { class: 'field', for: 'practice-' + key }, PRACTICE_FIELDS[key], h(key === 'followUpDue' ? 'input' : 'textarea', {
    id: 'practice-' + key, ...(key === 'followUpDue' ? { type: 'date', value: p[key] || '' } : {}), maxlength: 4000, rows: 2,
    onInput: event => {
      p[key] = event.target.value
      if ((key === 'riskNotes' && p.riskNotes.trim()) || (['safetyMethod','safetyOutcome'].includes(key) && p.safetyMethod?.trim() && p.safetyOutcome?.trim())) clinician.safetyReviewedFindings = safetyFindings(answers, clinician)
      markDirty()
    }
  }, key === 'followUpDue' ? null : p[key] || ''))
}
function contextFields() {
  return h('details', { class: 'practice-context', open: phase === 'setup' && setupPage === 'context', 'data-section': 'practice-context' }, h('summary', null, setup.context === 'forensic' ? 'Forensic referral & context' : 'Referral & treatment context'),
    ...['referral','purpose','recipient','conditions','collateral','goals','functioning','notification'].map(practiceField),
    h('p', { class: 'quiet' }, 'Record voluntary consent, mandated-examination notification or assent as applicable, what was explained about purpose/recipients/confidentiality, comprehension and adjustments, and where external documentation is kept. This field does not establish legal consent.'),
    h('a', { class: 'context-help', href: 'help.html#review', target: '_blank', rel: 'noopener noreferrer' }, 'Context & review guidance ↗'))
}
function draftAssessment() {
  return newAssessment(screener.configuration, setup, answers, clinician, { phase, cursor }, identity)
}
function preserveFinal() {
  if (!finalAssessment) return
  if (!history.some((a) => a.id === finalAssessment.id && a.review.digest === finalAssessment.review.digest)) history.push(finalAssessment)
  finalAssessment = null
}
function currentAssessment() {
  const draft = draftAssessment()
  if (finalAssessment && assessmentContent(draft) !== assessmentContent(finalAssessment)) preserveFinal()
  return finalAssessment ? { ...finalAssessment, workflow: { phase, cursor } } : draft
}
function currentRecord() { const current = currentAssessment(); return assessmentRecord(finalAssessment || current) }
function sittingBundle() { return { schemaVersion: 1, current: currentAssessment(), history } }
function returnHome() {
  homeNavigationApproved = true
  location.assign(new URL('index.html#/', location.href).href)
}
function saveSitting({ returnHomeAfterSave = false } = {}) {
  vaultDialog({ mode: 'save', snapshot: sittingBundle, onSaved: (saved) => {
    const signature = bundleSignature(saved)
    savedSignature = signature
    updateSaveStatus()
    workspaceMessage = assessmentContent(saved.current) === assessmentContent(currentAssessment()) ? 'Encrypted download requested. Check that the file was saved before closing.' : 'Earlier version downloaded. Save again to include your latest edits.'
    const status = document.getElementById('workspace-status') || document.getElementById('export-status')
    if (status) status.textContent = workspaceMessage
    if (returnHomeAfterSave) {
      // Let the download start and the password dialog close before navigation.
      // A snapshot that missed a later edit must never discard that edit.
      setTimeout(() => {
        if (signature === bundleSignature(sittingBundle())) returnHome()
      }, 0)
    }
  } })
}
function archiveSitting() {
  vaultDialog({ mode: 'save', archive: true, snapshot: sittingBundle, onSaved: (saved, count) => {
    archivedSignature = bundleSignature(saved)
    workspaceMessage = `${count} encrypted archive ${count === 1 ? 'part' : 'parts'} requested. Verify every numbered file in approved storage before removing history.`
    // Let the native dialog close before focusing the replacement history view.
    setTimeout(() => { render(); revealReviewTarget('assessment-history') }, 0)
  } })
}
function clearArchivedHistory() {
  if (archivedSignature !== bundleSignature(sittingBundle())) return
  if (!window.confirm('Have you verified every numbered encrypted archive file? Remove previous final records from this tab only? Keep all archive parts in approved storage.')) return
  history = []; archivedSignature = null; savedSignature = null; workspaceMessage = 'Archived history removed from this tab. Save the current assessment again.'; render(); revealReviewTarget('assessment-history')
}
function restoreSitting(bundle) {
  const a = bundle.current
  // Notes and reference-only drafts also need protection before replacement.
  if (hasWork() && !window.confirm('Replace the current assessment? Save its encrypted file first.')) return
  reviewerName = ""
  selectedPreset = null; measureSearch = ""; setupPage = "measures"
  screener = assessmentFactory(a)
  scales = screener.catalog
  primaryTopics = screener.policy.defaults.primaryTopics
  for (const key of Object.keys(setup)) delete setup[key]
  Object.assign(setup, structuredClone(a.setup))
  for (const key of Object.keys(answers)) delete answers[key]
  Object.assign(answers, a.answers)
  for (const key of Object.keys(clinician)) delete clinician[key]
  Object.assign(clinician, structuredClone(a.clinician))
  invalidExternal.clear()
  identity = { id: a.id, startedAt: a.startedAt }
  history = [...bundle.history]; finalAssessment = a.review.status === 'final' ? a : null; archivedSignature = null
  capturedConfiguration = true; practiceError = ''; copied = false; includeAppendix = false
  clinicalScreens = screener.symptomDefinitions(setup)
  phase = a.workflow.phase; cursor = a.workflow.cursor
  if (phase === 'safety') { cursor = screener.nextStep(setup, answers)?.id || null; phase = cursor ? 'question' : 'handoff' }
  workspaceMessage = 'Assessment restored with its captured settings.'
  savedSignature = bundleSignature(bundle)
  shown = ''; render()
}
function addHistory(bundle) {
  const proposed = mergeHistory(currentAssessment(), history, bundle)
  history = proposed
  copied = false; render()
}
function workspaceControls() {
  return h('div', { class: 'workspace-tools' },
    h('button', { type: 'button', 'aria-label': 'Save encrypted assessment', title: 'Save encrypted assessment', onClick: saveSitting }, icon('save'), 'Save'),
    h('button', { type: 'button', 'aria-label': 'Resume assessment', title: 'Resume assessment', onClick: () => vaultDialog({ mode: 'resume', onRestore: restoreSitting }) }, icon('resume'), 'Resume'),
    history.length ? h('button', { type: 'button', onClick: archiveSitting }, icon('lock'), 'Archive') : null,
    h('p', { id: 'workspace-status', class: 'quiet', role: 'status' }, workspaceMessage))
}
function showSetupPage(name) {
  const menu = document.querySelector('.workspace-menu')
  if (menu) menu.open = false
  setupPage = name === 'ready' && (setupErrors(setup).length || practiceError) ? 'measures' : name
  render()
  focusMain()
}
function setupPanel(name, ...children) {
  return h('section', { class: 'setup-page', 'data-setup-page': name, hidden: setupPage !== name }, ...children,
    !['measures','setting'].includes(name) ? h('button', { type: 'button', class: 'setup-return action action-secondary', onClick: () => showSetupPage('measures') }, icon('back'), 'Back to measures') : null)
}
function setupNavigation() {
  return h('nav', { class: 'setup-navigation', 'aria-label': 'Assessment setup' },
    ...[['setting','Setting'],['measures','Measures'],['ready','Ready'],['options','Options'],['context','Context'],['guide','Guide']].map(([id,label]) =>
      h('button', { type: 'button', 'aria-current': setupPage === id ? 'page' : null, onClick: () => showSetupPage(id) }, label)))
}
function workspaceMenu() {
  const close = event => { event.currentTarget.closest('details').open = false }
  return h('details', { class: 'workspace-menu', 'data-section': 'workspace-menu' },
    h('summary', null, 'Menu'),
    h('div', { class: 'workspace-menu-panel' },
      h('nav', { class: 'top-nav', 'aria-label': 'Main navigation' },
        h('a', { href: 'index.html#/', onClick: close }, 'Home'),
        h('a', { href: 'interview.html', 'aria-current': 'page', onClick: close }, 'Assessment'),
        h('a', { href: 'logic.html', target: '_blank', rel: 'noopener noreferrer', title: 'View screening logic', onClick: close }, 'Logic'),
        h('a', { href: 'help.html', target: '_blank', rel: 'noopener noreferrer', onClick: close }, 'Help ↗')),
      phase === 'setup' ? setupNavigation() : null,
      workspaceControls()))
}




/** An assessment with any answers keeps its immutable configuration, including when
 * Back returns to setup. New/empty assessments pick up the latest saved preferences.
 */
function refreshPractice() {
  if (Object.keys(answers).length || capturedConfiguration) return false
  try {
    const next = loadPracticeScreener()
    const changed = JSON.stringify(next.configuration) !== JSON.stringify(screener.configuration) || !!practiceError
    const proposed = changed ? rebaseSetup(next, setup) : next.createSetup(setup)
    const proposedScreens = next.symptomDefinitions(proposed)
    practiceError = ""
    screener = next
    scales = screener.catalog
    primaryTopics = screener.policy.defaults.primaryTopics
    for (const key of Object.keys(setup)) delete setup[key]
    Object.assign(setup, proposed)
    clinicalScreens = proposedScreens
    return changed
  } catch {
    practiceError = "Practice settings need review. Open the screening logic page to review or reset them."
    return true
  }
}

function header(extra) {
  const workspace = phase === "setup" || phase === "record"
  return h("div", { class: "sitting-header" }, sharedHeader(workspace ? workspaceMenu() : extra, "interview", { navigation: false }), h("p", { class: "save-state quiet", id: "save-state", role: "status" }, saveState()))
}

let actionDockObserver
function keepFocusedControlVisible() {
  const dock = document.querySelector('.action-dock')
  const active = document.activeElement
  if (!dock || !active || dock.contains(active) || active.closest('dialog')) return
  const bottom = Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight) - dock.getBoundingClientRect().height - 20
  const rect = active.getBoundingClientRect()
  if (rect.bottom > bottom && active !== document.body && active.id !== 'main') window.scrollBy(0, rect.bottom - bottom)
}
function installActionDock() {
  actionDockObserver?.disconnect()
  document.documentElement.style.setProperty('--action-dock-height', '0px')
  const main = document.getElementById('main')
  const selectors = phase === 'setup'
    ? setupPage === 'setting' ? []
      : setupPage === 'measures' ? ['.guided-advance']
      : setupPage === 'ready' ? ['[data-setup-page="ready"] > .setup-return', '.setup-launch > .go']
      : [`[data-setup-page="${setupPage}"] > .setup-return`]
    : phase === 'question' ? ['.question-actions', '.question-save-state']
    : phase === 'record' ? ['.review-toolbar', '#export-status']
    : phase === 'followups' ? ['.initial-results .actions']
    : phase === 'safety' ? ['.save-progress', '.safety-actions > .go']
    : ['#open-record', '.handoff > .back-link']
  const controls = selectors.map(selector => main.querySelector(selector)).filter(Boolean)
  if (!controls.length) return
  const dock = h('div', { class: 'action-dock', role: 'region', 'aria-label': 'Page actions' })
  // Keep primary actions before secondary question/review tools in keyboard order.
  // Their visual position is fixed independently of this position in the page.
  if (['question','record'].includes(phase)) main.insertBefore(dock, controls[0])
  else main.append(dock)
  dock.append(h('div', { class: 'action-dock-inner' }, ...controls))
  const size = () => {
    document.documentElement.style.setProperty('--action-dock-height', `${Math.ceil(dock.getBoundingClientRect().height)}px`)
    requestAnimationFrame(keepFocusedControlVisible)
  }
  size()
  actionDockObserver = new ResizeObserver(size)
  actionDockObserver.observe(dock)
}

let shown = ""

function render() {
  if (finalAssessment && assessmentContent(draftAssessment()) !== assessmentContent(finalAssessment)) preserveFinal()
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
  else if (phase === "handoff") drawHandoff()
  else if (phase === "followups") drawFollowUps()
  else drawRecord()
  installActionDock()
  wireRadios()
  document.querySelectorAll('details[data-section]').forEach((node) => { if (openSections.includes(node.dataset.section)) node.open = true })
  document.title = phase === "record" ? "Clinician record · Open Screen" : "Clinical assessment · Open Screen"
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
  const burden = assessmentBurden(screener, setup)
  app.replaceChildren(h("main", { class: "wrap sitting", id: "main", tabindex: "-1", "data-screen": "setup", "data-setup-view": setupPage },
    header(),
    h('nav', { class: 'guided-steps', 'aria-label': 'Setup progress' }, ...[['setting','Setting'],['measures','Measures'],['ready','Ready']].map(([id,label], index) => h('button', { type: 'button', 'aria-current': setupPage === id ? 'step' : null, disabled: id === 'ready' && errors.length > 0, onClick: () => showSetupPage(id) }, h('span', { 'aria-hidden': 'true' }, String(index + 1)), label))),
    practiceError ? h('section', { class: 'practice-error', role: 'alert' }, h('p', null, practiceError), h('a', { href: 'logic.html' }, 'Review practice settings'), h('p', null, 'New assessments are blocked. Resume a compatible encrypted assessment using its captured configuration.')) : null,
    h('div', { class: 'setup-heading' },
      h('div', null, h('h1', null, ({setting:'New assessment',measures:'Choose measures',ready:'Ready to begin',options:'Administration',context:'Clinical context',guide:'Assessment guide'})[setupPage]), h('p', { class: 'quiet setup-age', hidden: ['measures','ready'].includes(setupPage) }, 'Adults 18+')),
      ['setting','measures'].includes(setupPage) && !Object.keys(answers).length ? presetPicker(screener, { selected: selectedPreset, onCustom: () => { selectedPreset = null; render() }, onApply: (next, name) => { Object.assign(setup, next); selectedPreset = name; measureSearch = ""; render() }, onManage: () => showSetupPage('options') }) : null,
      setupPage === 'setting' ? h('p', { class: 'lede', id: 'setting-navigation-hint' }, 'Choose the setting for this assessment.') : null),
    setup.context === "forensic" ? h("p", { class: "setting-note" }, "Thresholds are not calibrated for forensic decisions. Response patterns do not establish malingering or credibility.") : null,

    screener.policy.id === "practice-custom" ? h("p", { class: "practice-notice" }, "Custom practice settings · ", screener.policy.version, ". Included in the clinical record.") : null,
    h("div", { class: "setup-layout" }, h("section", { class: "setup-controls", "aria-label": "Assessment options" },
    setupPanel('setting',
      h('div', { class: 'setup-context context-options', role: 'radiogroup', 'aria-label': 'Setting', 'aria-describedby': 'setting-navigation-hint' },
        ...[['clinical', 'Clinical', 'Screening and clinical care', 'book'], ['forensic', 'Forensic', 'Assessment in a legal context', 'shield']].map(([id, label, description, symbol]) =>
          h('button', { type: 'button', class: 'setting-card', role: 'radio', checked: setup.context === id, 'aria-label': label, 'aria-describedby': `setting-${id}-description`, onClick: () => { markDirty(); selectedPreset = null; setup.context = id; setupPage = 'measures'; render(); focusMain() } },
            h('span', { class: 'setting-symbol', 'aria-hidden': 'true' }, icon(symbol)),
            h('strong', { class: 'setting-label' }, label),
            h('span', { class: 'setting-description', id: `setting-${id}-description` }, description),
            icon('arrow'))))),
    setupPanel('measures',
    h('div', { class: 'guided-setting' }, h('p', { class: 'quiet' }, setup.context ? `${setup.context === 'forensic' ? 'Forensic' : 'Clinical'} · Adults 18+` : 'Setting not selected'), h('button', { type: 'button', class: 'text-button', onClick: () => showSetupPage('setting') }, 'Change setting')),
    h('div', { class: 'measure-heading' }, h('div', null,
    h("h2", { class: "sr-only" }, "Measures"),
    h('p', { class: 'selection-count quiet', role: 'status' }, `${scales.filter(scale => setup.topics[scale.id]).length} selected${setup.mode === 'monitoring' ? ' · Repeat monitoring' : ''} · About ${burden.min === burden.max ? burden.min : burden.min + '–' + burden.max} response tasks`)),
    h('label', { class: 'field measure-search' }, h('span', { class: 'sr-only' }, 'Find a measure'), h('input', { placeholder: 'Search measures…', type: 'search', id: 'measure-search', value: measureSearch, autocomplete: 'off', onInput: (event) => {
      measureSearch = event.target.value
      filterMeasures()
    } }))),
    personalityOverlap(setup.topics) ? h('p', { class: 'setting-note', role: 'status' }, 'Overlapping personality measures: check the added burden. Scores stay separate.') : null,
    h("div", { class: "scale-picks", "aria-label": "Screening areas" },
      ...scales.filter((scale) => primaryTopics.includes(scale.id)).map(scaleOption),
    ),
    h("details", { class: "additional-measures", "data-section": "additional-measures" },
      h("summary", null, "Additional measures", h("span", null, `${scales.filter((scale) => !primaryTopics.includes(scale.id) && setup.topics[scale.id]).length} selected`)),
      ...[['Screening','list', scale => !/ipip|catpd|personality/.test(scale.id) && scale.id !== 'validity'], ['Traits','layers', scale => /ipip|catpd|personality/.test(scale.id)], ['Response patterns','shield', scale => scale.id === 'validity']].map(([label, symbol, includes]) => {
        const items = scales.filter(scale => !primaryTopics.includes(scale.id) && includes(scale))
        return items.length ? h('section', { class: 'measure-group', 'data-measure-group': label }, h('h3', null, icon(symbol), label), h('div', { class: 'scale-picks' }, ...items.map(scaleOption))) : null
      }),
      h('p', { class: 'quiet', id: 'measure-empty', role: 'status', hidden: true }, 'No matching measures.'),
    ),
    ),
    setupPanel('options', !Object.keys(answers).length ? templateControls(screener, setup, { apply: (next, name) => { if (next) Object.assign(setup, next); selectedPreset = name || null; measureSearch = ''; render() }, status: value => { workspaceMessage = value } }) : null, h('details', { class: 'administration-disclosure', open: true, 'data-section': 'administration' }, h('summary', null, h('span', null, 'Administration'), h('span', { class: 'quiet' }, `${setup.mode === 'monitoring' ? 'Monitoring' : 'Screening'} · ${setup.advanceMode === 'manual' ? 'Manual' : 'Automatic'}`)),
    h('fieldset', { class: 'administration-options' }, h('legend', null, 'Administration options'),
      h('label', { class: 'field' }, 'Purpose', h('select', { id: 'administration-mode', value: setup.mode || 'screening', disabled: Object.keys(answers).length > 0, onChange: event => { setup.mode = event.target.value; selectedPreset = null; render() } },
        h('option', { value: 'screening', selected: setup.mode !== 'monitoring' }, 'Initial staged screening'), h('option', { value: 'monitoring', selected: setup.mode === 'monitoring' }, 'Repeat monitoring'))),
      h('p', { class: 'quiet' }, setup.mode === 'monitoring' ? 'Full measures stay open at low brief scores; stop rules still apply. Keep forms and settings consistent.' : 'Brief screens open follow-up when indicated.'),
      h('label', { class: 'field' }, 'Moving between questions', h('select', { id: 'advance-mode', onChange: event => { setup.advanceMode = event.target.value; render() } },
        h('option', { value: 'automatic', selected: setup.advanceMode !== 'manual' }, 'Advance when an answer is selected'), h('option', { value: 'manual', selected: setup.advanceMode === 'manual' }, 'Select an answer, then Continue'))), h('a', { class: 'context-help', href: 'help.html#answer', target: '_blank', rel: 'noopener noreferrer' }, 'Answering & accessibility guidance ↗'))),
    ),
    setupPanel('context', contextFields(),
    h('details', { class: 'external-measures', 'data-section': 'external-measures' }, h('summary', null, 'External measures'),
      h('p', { class: 'quiet' }, 'Embedding requires permission. Record authorised external results during review.'),
      ...externalMeasures.map((row) => h('p', { class: 'quiet' }, h('a', { href: row.url, target: '_blank', rel: 'noopener noreferrer' }, row.title + ' ↗'), ' · ' + row.reason)))),

    setupPanel('measures',
    h('div', { class: 'setup-start', hidden: setupPage !== 'measures' }, h('label', { class: 'field reference-field' }, 'Reference (optional)', h('input', { type: 'text', 'aria-label': 'Reference (optional)', placeholder: 'Patient or file reference', maxlength: 200, readonly: Object.keys(answers).length > 0 || history.length > 0, value: clinician.reference || '', onInput: event => { clinician.reference = event.target.value; markDirty() } })),
    h('p', { class: 'quiet' }, 'Needed for history. Locks after the first response.'),
    ),
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
    h('div', { class: 'guided-advance' }, h('button', { type: 'button', class: 'back-link', onClick: () => showSetupPage('setting') }, icon('back'), 'Back to Setting'),
      h('button', { type: 'button', class: 'go', disabled: errors.length > 0, onClick: () => showSetupPage('ready') }, 'Continue to Ready', icon('arrow'))),
    errors.length ? h('p', { class: 'setup-hint', role: 'status' }, errors.join(' ')) : null,
    ),
    setupPanel('ready',
    h('div', { class: 'guided-recap' }, h('h2', null, 'Selected measures'), h('p', { class: 'quiet' }, `${setup.context ? setup.context === 'forensic' ? 'Forensic' : 'Clinical' : 'Setting not selected'} · ${setup.mode === 'monitoring' ? 'Repeat monitoring' : 'Initial staged screening'}`),
      h('ul', null, ...scales.filter(scale => setup.topics[scale.id]).map(scale => h('li', null, h('span', { class: 'recap-symbol', 'aria-hidden': 'true' }, icon(measureSymbol(scale.id))), h('strong', null, scale.name), h('span', { class: 'quiet' }, scale.detail)))),
      h('p', { class: 'recap-burden quiet', title: 'Follow-ups and source skips change the length.' }, icon('list'), `About ${burden.min === burden.max ? burden.min : burden.min + '–' + burden.max} response tasks`)),
    h('p', { class: 'advance-mode-visual' }, icon(setup.advanceMode === 'manual' ? 'check' : 'resume'), h('strong', null, setup.advanceMode === 'manual' ? 'Manual advance' : 'Automatic advance'), h('span', null, setup.advanceMode === 'manual' ? 'Select an answer, then Continue.' : 'Selecting an answer opens the next question.')),
    h("div", { class: "setup-launch" },
    h('details', { class: 'handoff-preparation', 'data-section': 'preparation' },
      h('summary', { id: 'prepare-title' }, 'Before you start'),
      h('p', null, 'Explain the purpose, recipients and confidentiality before handing over the device. Record forensic participation details in Context.'),
      h('p', null, 'The person can pause, ask for help, or leave an answer missing. No time limit; follow-ups change the length.'),
      h('p', null, 'Responses stay in this tab until export. Save encrypted to resume; reports and clipboard copies are unencrypted.'),
      h('p', null, `Answering mode: ${setup.advanceMode === 'manual' ? 'select an answer, then Continue' : 'selecting an answer advances immediately'}.`),
      ),
    errors.filter(error => error !== "Choose a setting.").length ? h("p", { class: "setup-hint", id: "setup-errors", role: "status" }, errors.filter(error => error !== "Choose a setting.").join(" ")) : null,
    h("button", {
      type: "button",
      class: "go",
      disabled: errors.length > 0,
      "aria-describedby": !setup.context ? "setup-setting-hint" : errors.length ? "setup-errors" : null,
      onClick: () => {
        if (refreshPractice()) { render(); return }
        if (practiceError) return
        if (setupErrors(setup).length) return
        cursor = null
        phase = "question"
        render()
      },
    }, "Start assessment", icon("arrow")),
    h('p', { class: 'quiet setup-privacy' }, 'Tab only · Save encrypted to resume.'),
    ),
    ),
    ),
    setupPanel('guide', h("details", { open: true, class: "sitting-plan", "data-section": "sitting-plan" }, h("summary", null, "How the assessment works"),
      h("p", { class: "kicker" }, "The assessment"),
      h("h2", null, setup.mode === "monitoring" ? "Repeat, then review." : "Two stages, then review."),
      h("ol", { class: "stage-list visual-stages", role: "list", "aria-label": "Assessment workflow" },
        ...(setup.mode === "monitoring" ? [["list", "Full measures"]] : [["list", "Brief screens"], ["layers", "Indicated follow-ups"]]).map(([symbol, label]) => h("li", null, icon(symbol), h("strong", null, label))),
        h("li", null, icon("check"), h("strong", null, "Clinician review")),
        h("li", null, icon("save"), h("strong", null, "Encrypted save")),
      ),
      h("p", { class: "plan-note" }, icon("lock"), "Tab only. Save encrypted to resume."),
      h("p", { class: "quiet" }, "Direct safety assessment is separate from these screens."),
      h("a", { href: "https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/cssrs-for-communities-and-healthcare/", target: "_blank", rel: "noopener noreferrer", class: "source-link" }, "Open the official C-SSRS resources ↗"),
      h("details", { class: "threshold-details" }, h("summary", null, "Thresholds & sources"),
        ...clinicalScreens.map((screen) => h("p", null, `${screen.brief} ≥${screen.openAt} → ${screen.full}. `, h("a", { href: screen.source, target: "_blank", rel: "noopener noreferrer" }, "Official form"))),
        h("p", null, `PC-PTSD-5 ≥${screener.policy.thresholds.trauma.gate} → PCL-5. The configured rule is recorded in exports.`),
        h("p", null, `Policy ${screener.policy.id} · ${screener.policy.version}. ${screener.policy.rationale}`),
      ),
    ))),
  ))
  document.querySelectorAll('.measure-option > .help-button').forEach(button => { button.replaceChildren(icon('info')); button.setAttribute('aria-label', button.getAttribute('aria-label') + ' · Burden, limitations & source') })
  filterMeasures()
}

function filterMeasures() {
  document.querySelectorAll("[data-measure-search]").forEach(node => { node.hidden = !node.dataset.measureSearch.includes(measureSearch.toLowerCase().trim()) })
  document.querySelectorAll("[data-measure-group]").forEach(group => { group.hidden = [...group.querySelectorAll("[data-measure-search]")].every(node => node.hidden) })
  document.getElementById("measure-empty").hidden = [...document.querySelectorAll("[data-measure-search]")].some(node => !node.hidden)
  if (measureSearch) document.querySelector(".additional-measures").open = true
}

function measureSymbol(id) {
  return ({ depression: 'book', anxiety: 'layers', trauma: 'shield', alcohol: 'list', irritability: 'sliders', taps: 'list' })[id] || (/ipip|catpd|personality/.test(id) ? 'layers' : 'book')
}
function scaleOption(scale) {
  const [timeframe, detail] = measureInfo(screener, scale.id)
  const search = `${scale.name} ${scale.detail} ${detail}`.toLowerCase()
  return h('div', { class: 'measure-option', 'data-measure-search': search, hidden: !search.includes(measureSearch.toLowerCase().trim()) },
    h("button", { type: "button", pressed: !!setup.topics[scale.id], "data-focus-key": scale.id, onClick: () => toggleScale(scale.id) },
      h("span", { class: "scale-check", "aria-hidden": "true" }, setup.topics[scale.id] ? icon("check") : null),
      h("span", { class: "measure-symbol", "aria-hidden": "true" }, icon(measureSymbol(scale.id))),
      h("strong", null, scale.name), h("span", { class: "scale-detail" }, scale.detail)),
    informationButton('About ' + scale.name, h('p', null, setup.mode === 'monitoring' ? 'Planned measure · source skips apply' : scale.tag), h('p', null, timeframe), h('p', null, detail), ...evidenceLines(screener, scale.id).map(line => /^https:\/\//.test(line) ? h('a', { href: line, target: '_blank', rel: 'noopener noreferrer' }, 'Evidence source ↗') : h('p', null, line))))
}

function toggleScale(id) {
  selectedPreset = null
  setup.topics[id] = !setup.topics[id]
  if (id === "alcohol" && !setup.topics.alcohol) setup.auditFee = null
  render()
}

function choice(label, on, click) {
  return h("button", { type: "button", role: "radio", checked: on, onClick: () => { markDirty(); click() } }, label)
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
    // Keep administration and save state below the reading task, not above each item.
    h('div', { class: 'question-header' }, sharedHeader(
      h('div', { class: 'question-topline' },
        h('p', { class: 'progress sr-only' }, `Question ${position}`),
        h('p', { class: 'kicker sr-only' }, setup.mode === 'monitoring' ? 'Repeat monitoring' : step.stage === 1 ? 'Stage 1 · Brief screening' : 'Stage 2 · Additional screening'),
        h('span', { class: 'quiet' }, step.index && step.count > 1 && step.id !== 'phq-difficulty' ? `${step.kicker} · ${step.index} of ${step.count}` : step.kicker)),
      'interview', { navigation: false })),
    h('section', { class: 'question-body', 'aria-label': 'Current question' },
    step.stem ? h("p", { class: "stem", id: "question-stem" }, step.stem) : null,
    step.examples ? h("ul", { class: "pills", id: "question-examples" }, ...step.examples.map((line) => h("li", null, line))) : null,
    h("h1", { class: "question", id: "question-title", "aria-describedby": context }, step.title),
    step.kind === "text"
      ? h("textarea", {
        class: "event",
        id: "event-text", maxlength: 4000,
        "aria-label": step.title,
        "aria-describedby": context,
      }, omissionReason(selected) ? "" : selected || "")
      : h("div", null,
        h("p", { class: `keyboard-hint${position === 1 || step.index === 1 ? "" : " sr-only"}`, id: "answer-help" }, setup.advanceMode === "manual" ? `Select an answer, then Continue. Keys 1–${step.options.length} select.` : `Selecting an answer moves to the next question. Keys 1–${step.options.length} also answer.`),
        answerControl(step, selected, [context, "answer-help"].filter(Boolean).join(" ")))),
    h("div", { class: "question-actions" },
      h("button", { type: "button", class: "back-link", onClick: () => back(step) }, icon("back"), "Back"),
      h('button', { type: 'button', class: 'question-save', onClick: saveSitting }, icon('save'), 'Save progress'),
      step.kind === "text" || setup.advanceMode === "manual" ? h("button", { type: "button", class: "go", id: "continue", disabled: step.kind !== "text" && !responseValid(step, answers), onClick: () => advance(step) }, "Continue", icon("arrow")) : null,
    ),
    h('p', { class: 'question-save-state quiet', id: 'save-state', role: 'status' }, saveState()),
    h('p', { class: 'practice-error', role: 'alert' }, questionError),
    h('div', { class: 'question-utilities', 'aria-label': 'Question actions' },
      ...['prefer-not-to-answer','unable-to-answer'].map(reason => h('button', { type: 'button', class: 'quiet-action', onClick: () => { if (setResponse(step, { missing: reason })) advance(step) } }, omissionReason({ missing: reason }))),
      informationAction('Pause or ask for help', h('p', null, 'Assessment paused. Let your clinician know you need a break or help. Close this message when you are ready to continue. Use Save progress before closing the tab.')),
      h('button', { type: 'button', class: 'quiet-action', onClick: () => {
        const finished = screener.progress(setup, answers).finished
        if (!window.confirm(finished ? 'Open the clinician review? The selected questions are complete.' : 'End questions for clinician review? Unanswered items will remain incomplete and this record cannot be finalised.')) return
        phase = 'record'; cursor = null; render()
      } }, 'Review partial assessment'),
      informationButton('About this questionnaire',
        h('p', null, 'You can leave an answer missing or pause and ask your clinician for help. Missing answers are never scored as zero.'),
        step.footer ? h('p', null, step.footer) : null)),
    step.kind === 'text' ? h('p', { class: 'keyboard-hint' }, 'Ctrl / ⌘ + Enter to continue. This description is optional.') : null,
  ))
  const box = document.querySelector("#event-text")
  if (box) {
    box.addEventListener("input", () => { answers[step.id] = box.value; copied = false; updateSaveStatus() })
    box.addEventListener("keydown", (event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); advance(step) } })
  }
}

let keyBound = false
function onKey(event) {
  if (phase !== "question" || event.repeat || document.querySelector("dialog[open]")) return
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
  if (!setResponse(step, value)) return
  if (step.id === 'phq-9' && value > 0) clinician.safetyEndorsed = true
  answers[step.id] = value
  copied = false
  if (setup.advanceMode === 'manual') render()
  else advance(step)
}

function setResponse(step, value) {
  try {
    if (step.id === 'phq-9' && JSON.stringify(answers[step.id]) !== JSON.stringify(value)) {
      const prior = preserveSafetyReview(screener.record(setup, answers, clinician))
      if (prior.safetyPriorReviews) clinician.safetyPriorReviews = structuredClone(prior.safetyPriorReviews)
      Object.assign(clinician, safetyResponseChange(clinician, answers[step.id], value))
    }
    answers[step.id] = value; questionError = ''; copied = false
    return true
  } catch (error) { questionError = error.message + ' Save progress and ask the clinician to review.'; render(); return false }
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

function followUpCandidates() {
  const automatic = screener.getSteps(screener.createSetup({ ...setup, followUpChoices: {} }), answers).filter(step => step.stage === 2)
  const recommended = new Set(automatic.map(followUpTopic))
  const fullSetup = screener.createSetup({ ...setup, followUpChoices: {}, followUps: { ...setup.followUps, ...Object.fromEntries(scales.filter(row => setup.topics[row.id]).map(row => [row.id,true])) } })
  const steps = screener.getSteps(fullSetup, answers).filter(step => step.stage === 2 && !responseValid(step, answers))
  const groups = new Map()
  for (const step of steps) {
    const id = followUpTopic(step)
    if (!groups.has(id)) groups.set(id, { id, recommended: recommended.has(id), steps: [] })
    groups.get(id).steps.push(step)
  }
  // TAPS asks extra questions after a positive substance-use answer. Show the
  // possible range before asking for a decision, rather than promising a short path.
  const expanded = { ...answers, ...Object.fromEntries(steps.filter(step => /^taps-.*-use$/.test(step.id)).map(step => [step.id,1])) }
  const maximum = screener.getSteps(fullSetup, expanded).filter(step => step.stage === 2 && !responseValid(step, answers))
  return [...groups.values()].map(row => ({ ...row, maximum: maximum.filter(step => followUpTopic(step) === row.id) }))
}

function initialBriefRows(record) {
  return [
    ...record.symptoms.map(row => ({ name: row.brief, score: row.gateScore, max: 6, threshold: row.threshold, subject: row.gateScore == null ? 'Incomplete brief screen' : row.label })),
    ...(record.alcohol.gateScore != null ? [{ name: 'AUDIT-C', score: record.alcohol.gateScore, max: 12, threshold: record.alcohol.threshold, subject: 'Alcohol' }] : []),
    ...(record.trauma.exposure ? [{ name: 'PC-PTSD-5', score: record.trauma.exposure === 'no' ? null : record.trauma.count, max: 5, threshold: record.trauma.threshold, subject: record.trauma.exposure === 'no' ? 'Exposure not endorsed' : record.trauma.count == null ? 'Incomplete brief screen' : 'Trauma' }] : []),
    ...(record.personality?.groups || []).map(row => ({ name: row.label || row.construct, score: null, subject: row.headline + ' marker · not a clinical screen' })),
    ...screener.getSteps(setup, answers).filter(step => step.instrument === 'taps' && step.stage === 1).map(step => ({ name: 'TAPS · ' + ({ tobacco: 'Tobacco', alcohol: 'Alcohol', drugs: 'Illicit drugs', prescription: 'Prescription misuse' })[step.id.replace('taps-brief-','').replace(/-(female|male)$/, '')], score: null, subject: step.options.find(option => option.value === answers[step.id])?.label || 'Incomplete brief screen' })),
    ...record.additional.filter(row => row.gateScore != null).map(row => ({ name: row.brief, score: row.gateScore, max: row.gateMax ?? row.max, threshold: row.threshold ?? (row.status === 'scored' ? row.screenAt : null), subject: row.label }))
  ]
}

function initialBriefReadout(record) {
  return h('section', { class: 'brief-readout', 'aria-label': 'Brief screening results' },
      ...initialBriefRows(record).map(row => h('div', { class: 'brief-row' },
        h('strong', null, row.name), h('span', null, row.score == null ? row.subject : `${row.score}/${row.max}`),
        h('span', { class: row.score != null && row.threshold != null && row.score >= row.threshold ? 'suggested' : 'quiet' }, row.score == null ? '' : row.threshold == null ? row.subject : row.score >= row.threshold ? `${row.subject}: explore further` : 'Below follow-up threshold'))))
}

function drawFollowUps() {
  const record = currentRecord()
  const candidates = followUpCandidates()
  const names = { depression: 'PHQ-9 · Depression', anxiety: 'GAD-7 · Anxiety', alcohol: 'AUDIT · Alcohol', trauma: 'PCL-5 · PTSD symptoms', irritability: 'DASS-21 Stress', personality: 'IPIP trait extensions', validity: 'IPIP response patterns' }
  const selected = new Set(candidates.filter(row => setup.followUpChoices?.[row.id] ?? row.recommended).map(row => row.id))
  const start = () => {
    setup.followUpChoices = { ...setup.followUpChoices, ...Object.fromEntries(candidates.filter(row => row.recommended || selected.has(row.id)).map(row => [row.id, selected.has(row.id)])) }
    for (const row of candidates) if (selected.has(row.id) && !row.recommended) setup.followUps[row.id] = true
    markDirty(); cursor = null
    phase = screener.nextStep(setup, answers) ? 'question' : 'record'
    render()
  }
  const continueButton = h('button', { type: 'button', class: 'go', onClick: start }, 'Continue with selected')
  const briefButton = h('button', { type: 'button', class: 'quiet-action', onClick: () => { selected.clear(); start() } }, 'Use brief results')
  const update = () => { continueButton.textContent = selected.size ? 'Continue with selected' : 'Use brief results'; briefButton.hidden = !selected.size }
  app.replaceChildren(h('main', { class: 'wrap sitting initial-results', id: 'main', tabindex: '-1', 'data-screen': 'followups' },
    header(), h('h1', null, 'Initial results'),
    h('p', { class: 'quiet' }, 'Brief findings, not diagnoses. Choose what to explore further.'),
    record.safetyFlag ? h('p', { class: 'screening-observation' }, 'PHQ-9 item 9 was endorsed.') : null,
    initialBriefReadout(record),
    h('h2', null, 'Choose full questionnaires'),
    h('div', { class: 'follow-up-choices' }, ...candidates.map(row => {
      const count = row.steps.filter(step => step.kind !== 'text').length
      const maxCount = row.maximum.filter(step => step.kind !== 'text').length
      const maxPrompts = row.maximum.length - maxCount
      const countLabel = count === maxCount ? String(count) : `${count}–${maxCount}`
      const timeLabel = Math.max(1,Math.ceil(count/4)) === Math.max(1,Math.ceil(maxCount/4)) ? String(Math.max(1,Math.ceil(count/4))) : `${Math.max(1,Math.ceil(count/4))}–${Math.max(1,Math.ceil(maxCount/4))}`
      const definition = scales.find(scale => scale.id === row.id)
      const box = h('input', { type: 'checkbox', onChange: event => { if (event.target.checked) selected.add(row.id); else selected.delete(row.id); (setup.followUpChoices ||= {})[row.id] = event.target.checked; markDirty(); update() } })
      box.checked = selected.has(row.id)
      return h('label', { class: 'follow-up-choice' }, box, h('span', null,
        h('strong', null, names[row.id] || definition?.name || row.id),
        h('span', { class: 'quiet' }, `${row.recommended ? 'Suggested · ' : 'Optional · '}${countLabel} more questions${maxPrompts ? ` + ${row.id === 'trauma' ? '' : 'up to '}${maxPrompts} ${row.id === 'trauma' ? 'optional event' : 'text'} prompt` : ''} · about ${timeLabel} min`)))
    })),
    h('p', { class: 'quiet follow-up-estimate' }, 'Answered items carry forward. Length can change with answers; times are approximate. Brief screens do not exclude problems.'),
    h('div', { class: 'actions' }, continueButton,
      briefButton,
      h('button', { type: 'button', class: 'quiet-action', onClick: saveSitting }, 'Save progress'))))
  update()
}

function advance(step) {
  if (!step) return
  if (step.kind === "text" && !Object.prototype.hasOwnProperty.call(answers, step.id)) answers[step.id] = ""
  if (!responseValid(step, answers)) return
  const path = patientPath(setup, answers)
  const index = path.findIndex((entry) => entry.id === step.id)
  const following = path[index + 1]
  if (following) {
    cursor = following.id
    phase = setup.mode !== "monitoring" && step.stage === 1 && following.stage === 2 && screener.nextStep(setup, answers)?.stage === 2 ? "followups" : "question"
    if (phase === "followups") cursor = null
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
    h("p", { class: "kicker" }, Object.values(answers).some(omissionReason) ? "Responses ready for review" : "Questions complete"),
    h("h1", null, "Thank you. You’re all done."),
    h("p", { class: "lede" }, "Return this device to your psychologist to review your responses."),
    !patientPath(setup, answers).some(step => step.stage === 2 && responseValid(step, answers)) ? h('section', { class: 'initial-readout-actions', 'aria-label': 'Initial screening readout' },
      initialBriefReadout(currentRecord()),
      h('p', { class: 'quiet' }, 'Brief screens do not diagnose or exclude a condition.'),
      followUpCandidates().length ? h('button', { type: 'button', class: 'quiet-action', onClick: () => { phase = 'followups'; cursor = null; render() } }, 'Choose full questionnaires') : null) : null,
    h("p", { class: "quiet" }, "For the clinician"),
    h("button", { type: "button", class: "go", id: "open-record", onClick: () => { phase = "record"; render() } }, "Review clinician record", icon("arrow")),
    h("button", { type: "button", class: "back-link", onClick: reviewAnswers }, "Review answers"),
  ))
}

function drawRecord() {
  const record = currentRecord()
  const licences = licencesAdministered(setup, answers)
  const panels = resultPanels(record)
  const historyView = historySection(historyMarkup(historySeries([...history, ...(finalAssessment ? [finalAssessment] : [])])), () => vaultDialog({ mode: 'history', onHistory: addHistory }), history.length, { onArchive: history.length ? archiveSitting : null, onClear: clearArchivedHistory, canClear: archivedSignature === bundleSignature(sittingBundle()),
    comparison: record.trauma.pcl ? h('section', { 'aria-label': 'Trauma comparison anchor' }, practiceField('pclEventId'), h('p', { class: 'quiet' }, 'Use a non-identifying reference. Reuse it only after confirming the same event.')) : null })
  const closed = [
    ...(record.additional || []).filter((row) => row.status === "gate-closed").map((row) => [row.id, row.full]),
    ...record.symptoms.filter((row) => row.status === "gate-closed" || row.followUpDeferred).map((row) => [row.id, row.full]),
    ...((record.alcohol.status === "gate-closed" || setup.followUpChoices?.alcohol === false) && record.alcohol.gateScore != null ? [["alcohol", "AUDIT"]] : []),
    ...(record.trauma.status === "scored" && record.trauma.stopped && !record.trauma.pcl && answers["pcptsd-exposure"] === "yes" ? [["trauma", "PCL-5"]] : []),
  ]
  app.replaceChildren(h("main", { class: "wrap record-wrap", id: "main", tabindex: "-1", "data-screen": "record" },
    header(h("p", { class: "quiet" }, record.forensic ? "Forensic" : "Clinical")),
    h("div", { class: "review-heading" },
      h("h1", null, "Results"),
      h("p", { class: "review-reference" }, clinician.reference || '', h("span", null, finalAssessment ? "Final" : "Draft")),
    ),
    record.safetyFlag ? h('p', { class: 'screening-observation' }, 'PHQ-9 item 9 was endorsed.') : null,
    screener.policy.id === "practice-custom" ? h("details", { class: "practice-notice" }, h("summary", null, "Custom practice settings used"), h("p", null, screener.policy.rationale)) : null,
    record.forensic ? h("p", { class: "context-limit" }, "Forensic context: published thresholds are not calibrated for this population.") : null,
    reviewPriorities(record, panels),
    h('section', { class: 'review-results', 'aria-label': 'Measure results' },
        resultIndex(panels), profileIndex(record),
        h("div", { class: "board" }, validityTile(record), stressTile(record)),
        personalityBlock(record),
        history.length ? historyView : null),
    h('details', { class: 'summary-preview', 'data-section': 'summary-preview' },
      h('summary', { id: 'summary-preview-title' }, icon('copy'), finalAssessment ? 'Preview summary' : 'Preview draft summary'),
      h('div', { class: 'summary-preview-text', id: 'summary-preview-text' }, clinicalSummary(record, clinician, { concise: true }))),
    h("div", { class: "review-toolbar actions" },
      h('button', { type: 'button', class: 'action action-primary', id: 'copy-record', onClick: () => copyRecord() }, 'Copy summary'),
      h('button', { type: 'button', class: 'action action-secondary', id: 'export-pdf', title: 'Complete report · choose Save as PDF in the print dialog', onClick: exportPDF }, icon('print'), 'Export PDF'),
      finalAssessment ? h('button', { type: 'button', class: 'action action-secondary', onClick: saveSitting }, icon('lock'), 'Save assessment') : null,
      exportTools({ includeAppendix, onAppendix: value => { includeAppendix = value },
        saveSitting, archiveSitting: history.length ? archiveSitting : null, downloadReport,
        downloadJSON, copyFull: () => copyRecord(true),
        reviewAnswers, clearSitting }),
    ),
    h("p", { class: "export-status", id: "export-status", role: "status", "aria-live": "polite" }),
    closed.length ? h("section", { class: "follow-up-options", "aria-label": "Additional follow-ups" },
      h("div", { class: "override-actions" }, ...closed.map(([id, label]) => h("button", { type: "button", class: "text-button", onClick: () => { setup.followUps[id] = true; if (setup.followUpChoices) delete setup.followUpChoices[id]; phase = "question"; cursor = null; markDirty(); render() } }, `Open ${label}`))),
    ) : null,
    h('details', { class: 'record-details', 'data-section': 'record-details', open: false },
    h('summary', null, 'Notes & final record'),
    checklist(record),
    h('details', { class: 'risk-notes', 'data-section': 'risk-notes' },
      h('summary', null, 'Risk notes (optional)'),
      practiceField('riskNotes'),
      h('details', { class: 'risk-details', 'data-section': 'risk-details' }, h('summary', null, 'Additional risk details'),
    h("section", { class: "review-safety", id: "safety-review", tabindex: "-1" },
      h("div", { class: "review-section-heading" }, h("h2", null, "Safety review"), h("span", { class: "quiet" }, "Independent of symptom scores")),
      h("div", { class: "segment", role: "radiogroup", "aria-label": "Direct safety review" }, ...["Not recorded", "Reviewed in interview", "Follow-up required", "Deferred", "Declined"].map((label) => choice(label, (clinician.safetyReview || "Not recorded") === label, () => { clinician.safetyReview = label; markDirty(); render() }))),
      h("a", { class: "source-link", href: "https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/cssrs-for-communities-and-healthcare/", target: "_blank", rel: "noopener noreferrer" }, "Official C-SSRS resources ↗"),
    ),
    h('section', { class: 'practice-review', 'aria-label': 'Safety outcome & plan' },
      ...['safetyMethod','safetyOutcome', ...(['Deferred','Declined'].includes(clinician.safetyReview) ? ['safetyReason'] : [])].map(practiceField), h('details', { class: 'follow-up-plan', 'data-section': 'follow-up-plan', open: ['Follow-up required','Deferred','Declined'].includes(clinician.safetyReview) || !!clinician.practice?.followUpAction }, h('summary', null, 'Follow-up plan'), ...['followUpAction','followUpOwner','followUpDue'].map(practiceField), h('p', { class: 'quiet' }, 'Arrange follow-up in your practice system. No reminder is scheduled here.'))),
    h('details', { id: 'safety-findings-review', tabindex: '-1', class: 'safety-findings', 'data-section': 'safety-findings', open: !safetyReviewCurrent(record) },
      h('summary', null, 'Safety review details'),
      riskReviewNotice(record) ? h('p', { class: 'quiet' }, riskReviewNotice(record)) : null,
      practiceField('safetyRecheck'),
      h('button', { type: 'button', onClick: () => { clinician.safetyReviewedFindings = safetyFindings(answers, clinician); markDirty(); render() } }, 'Link these notes to the current responses')),
      ...record.cards.filter(card => ['suicide','harm','weapon','withdrawal','overdose'].includes(card.id)).map(cardBlock))),
    contextFields(),
    h('details', { class: 'clinical-context', 'data-section': 'clinical-context' }, h('summary', null, 'Account, observations & limitations'), ...['selfReport','observations','uncertainty'].map(practiceField)),
    Object.values(record.omissions).some(omissionReason) ? h('section', { class: 'missing-review', id: 'missing-answers' }, h('h2', null, 'Missing answers'), ...Object.entries(record.omissions).map(([id,v]) => h('p', null, `${id}: ${omissionReason(v)}`))) : null,
    h("details", { class: "review-checks", "data-section": "review-checks", open: Object.values(clinician.flags || {}).some((value) => value === "Yes") },
      h("summary", null, "Interview & external measures", h("span", null, "Not scored here")),
      ...record.cards.filter(card => !['suicide','harm','weapon','withdrawal','overdose'].includes(card.id)).map(cardBlock),
    ),
    h("label", { class: "field formulation-field" }, h("span", null, "Formulation & follow-up"), h("textarea", { id: "clinical-notes", maxlength: 20000, placeholder: "Relevant interview findings, collateral information, and agreed next steps.", onInput: (event) => { clinician.facts = event.target.value; markDirty() } }, clinician.facts)),
    !history.length ? historyView : null,
    reviewSignoff(),
    h("details", { class: "sources", "data-section": "sources" }, h("summary", null, "Sources & scoring notes"),
      ...licences.map((row) => h("p", null, `${row.title}. ${row.limit}`)),
      h("ol", { class: "refs" }, ...record.references.map((entry) => h("li", null, entry.apa))),
    )),
    h("p", { class: "review-footnote" }, "Screening supports assessment. Below-gate results do not exclude conditions. Save before closing."),
    h("section", { class: "print-only", id: "print-record" }, markup(reportMarkup(record, clinician, { appendix: true, history: historySeries([...history, ...(finalAssessment ? [finalAssessment] : [])]) }))),
  ))
  const appendix = document.querySelector('.export-options input')
  if (appendix) appendix.checked = includeAppendix
  for (const [id, value] of invalidExternal) {
    const field = document.getElementById('external-' + id)
    if (field) setFieldError(field, (externalTotalError(id, value) || 'Correct this total.') + ' This value has not been recorded.')
  }
}

function checklist(record = currentRecord()) {
  return reviewChecklist(record, { finished: screener.progress(setup, answers).finished,
    finalised: !!finalAssessment, extraIssues: [...invalidExternal.keys()].map(id => ({ id: 'external-' + id, target: 'external-' + id, label: 'Correct external ' + id + ' total', message: 'The invalid value has not been recorded.' })), onContinue: () => { phase = 'question'; cursor = null; render() } })
}
function updateChecklist() {
  if (phase !== 'record') return
  const current = document.getElementById('review-checklist')
  const next = checklist(currentRecord())
  if (current && next) current.replaceWith(next)
  else if (current) current.remove()
  else if (next) document.querySelector('.record-details > summary')?.after(next)
}

function reviewPriorities(record, panels) {
  // A completed brief score is not the unfinished follow-up. Profiles do not
  // have scalar panels, so include their completeness explicitly as well.
  const incomplete = panels.filter((p) => p.badge === 'Incomplete').map((p) => {
    const result = [...record.symptoms, ...(record.additional || [])].find((r) => r.id === p.id)
    if (result?.opened) return result.full
    if (p.id === 'alcohol' && record.alcohol.opened) return 'AUDIT'
    if (p.id === 'trauma' && record.trauma.pcl?.status === 'incomplete') return 'PCL-5'
    return p.instrument
  })
  incomplete.push(...(record.additional || []).filter((r) => r.scales && r.status !== 'scored').map((r) => r.label))
  if (record.stress.status === 'incomplete') incomplete.push('DASS-21 Stress')
  if (record.validity?.status === 'incomplete') incomplete.push('IPIP response patterns')
  if (setup.topics.personality && !record.personality?.ready) incomplete.push('Personality markers')
  incomplete.push(...(record.ipip || []).filter((r) => r.status === 'incomplete').map((r) => 'IPIP extension · ' + r.label))
  if (!incomplete.length) return null
  return h('section', { class: 'review-priorities', 'aria-label': 'Incomplete results' },
    h('h2', null, 'Incomplete results'), h('p', null, incomplete.join(', ') + '. No missing answers are imputed.'),
    !screener.progress(setup, answers).finished ? h('button', { type: 'button', class: 'back-link', onClick: () => { phase = 'question'; cursor = null; render() } }, 'Continue unanswered questions') : null)
}
function reviewSignoff() {
  if (finalAssessment) return h('section', { class: 'review-signoff', id: 'review-signoff', 'aria-labelledby': 'final-record-title' }, h('h2', { id: 'final-record-title' }, 'Final record'),
    h('p', null, `Attested by ${finalAssessment.review.by} · ${finalAssessment.review.at}`),
    h('p', { class: 'quiet' }, 'Edits create a draft and preserve this final version in the assessment file. Local attestation does not authenticate identity.'),
    h('button', { type: 'button', class: 'action action-primary', onClick: saveSitting }, 'Save encrypted final record'), h('button', { type: 'button', class: 'action action-secondary', onClick: startMonitoring }, 'Start repeat monitoring'), h('button', { type: 'button', class: 'action action-secondary', onClick: clearSitting }, 'Start new assessment'))
  const name = h('input', { id: 'reviewer-name', type: 'text', maxlength: 200, autocomplete: 'off', required: true, value: reviewerName, onInput: (event) => { reviewerName = event.target.value } })
  const attest = h('input', { id: 'review-attest', type: 'checkbox', required: true })
  const error = h('p', { role: 'alert', class: 'practice-error', tabindex: '-1' })
  return h('section', { class: 'review-signoff', id: 'review-signoff' }, h('h2', null, 'Draft record'),
    h('form', { onSubmit: async (event) => {
      event.preventDefault(); error.textContent = ''
      const button = event.target.querySelector('button'); button.disabled = true
      try {
        if (invalidExternal.size) {
          const field = document.querySelector(`[data-external-id="${invalidExternal.keys().next().value}"]`)
          if (field) revealReviewTarget(field.id)
          throw new Error('Correct the invalid external total before finalising. It has not been recorded.')
        }
        if (history.length >= 40) throw new Error('The assessment file has 40 final records. Export it, then start a new assessment before finalising another version.')
        const captured = draftAssessment()
        const final = await finaliseAssessment(captured, name.value)
        assertVaultCapacity({ schemaVersion: 1, current: final, history })
        if (assessmentContent(captured) !== assessmentContent(draftAssessment())) throw new Error('The assessment changed during review. Review and finalise the latest version.')
        finalAssessment = final; copied = false; render(); revealReviewTarget("review-signoff")
      } catch (e) { error.textContent = e.message; button.disabled = false; error.focus() }
    } },
    h('label', { class: 'field', for: 'reviewer-name' }, 'Reviewing clinician', name),
    h('label', { class: 'attestation-check' }, attest, h('span', null, 'I reviewed this screening record.')),
    h('p', { class: 'quiet' }, 'Local workflow attestation; not authenticated identity or a legal digital signature.'),
    history.length ? h('p', { class: 'quiet' }, 'A previous final version is kept in Assessment history. It is not this draft.') : null,
    error,
    h('button', { type: 'submit', class: 'primary action action-primary' }, 'Finalise record')))
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
    h("p", { class: "quiet" }, validity.sampleNote),
    h("p", { class: "quiet" }, `Option counts 1–5: ${validity.responseCounts.join(", ")}. Longest repeated run: ${validity.run}.`),
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
  if (!record.personality?.ready && !record.ipip.length) return null
  return h("section", { class: "tile wide" },
    record.personality?.ready ? histogram(record.personality) : h("p", null, "Personality marker profile incomplete; complete trait scores are shown separately."),
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
        ...entry.options.map((option) => choice(option, (clinician.flags || {})[entry.id] === option, () => {
          changeFinding(entry.id, option)
          render()
        })),
      ),
    )
  }
  const common = {
    "aria-label": entry.label,
    id: 'external-' + entry.id, 'data-external-id': entry.id,
    onInput: (event) => {
      const error = event.target.validity.badInput ? 'Enter a whole-number total, or leave it blank.' : externalTotalError(entry.id, event.target.value)
      if (error) {
        const wasFinal = !!finalAssessment
        invalidExternal.set(entry.id, event.target.value)
        if (wasFinal) {
          preserveFinal(); render()
          const field = document.getElementById('external-' + entry.id)
          setFieldError(field, error + ' This value has not been recorded.'); field.focus()
        } else { setFieldError(event.target, error + ' This value has not been recorded.'); updateChecklist() }
        return
      }
      invalidExternal.delete(entry.id); setFieldError(event.target)
      ;(clinician.entered ||= {})[entry.id] = event.target.value; markDirty()
    },
  }
  return h("label", { class: "field" },
    h("span", null, entry.label),
    entry.kind === "number"
      ? h("input", { type: "number", inputmode: "numeric", min: externalTotals[entry.id]?.min, max: externalTotals[entry.id]?.max, step: 1, value: invalidExternal.has(entry.id) ? invalidExternal.get(entry.id) : (clinician.entered || {})[entry.id] ?? "", ...common })
      : h("input", { type: "text", maxlength: 4000, value: (clinician.entered || {})[entry.id] || "", ...common }),
  )
}

function fieldControl(card, field) {
  if (field.when && (clinician.flags || {})[field.when] !== "Yes") return null
  if (field.options) {
    return h("div", { class: "field" },
      h("span", null, field.label),
      h("div", { class: "segment", role: "radiogroup", "aria-label": field.label },
        ...field.options.map((option) => choice(option, (clinician.flags || {})[field.id] === option, () => {
          changeFinding(field.id, option)
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
      value: (clinician.flags || {})[field.id] || "",
      "aria-label": field.label,
      onInput: (event) => { changeFinding(field.id, event.target.value); markDirty() },
    }),
  )
}

function changeFinding(id, value) {
  const proposed = { ...clinician, flags: { ...clinician.flags, [id]: value } }
  if (safetyFindings(answers, clinician) !== safetyFindings(answers, proposed)) {
    const prior = preserveSafetyReview(screener.record(setup, answers, clinician))
    if (prior.safetyPriorReviews) clinician.safetyPriorReviews = structuredClone(prior.safetyPriorReviews)
  }
  ;(clinician.flags ||= {})[id] = value
}

function markDirty() {
  const wasFinal = !!finalAssessment
  const notes = document.activeElement
  const fieldId = notes?.id
  const caret = notes?.selectionStart ?? null
  preserveFinal()
  updateSaveStatus()
  updateChecklist()
  const preview = document.getElementById('summary-preview-text')
  if (preview) preview.textContent = clinicalSummary(currentRecord(), clinician, { concise: true })
  if (wasFinal) {
    copied = false
    render()
    const restored = fieldId ? document.getElementById(fieldId) : null
    if (restored) {
      restored.focus({ preventScroll: true })
      if (Number.isInteger(caret)) restored.setSelectionRange(caret, caret)
    }
    return
  }
  const reference = document.querySelector('.review-reference span')
  if (reference) reference.textContent = reference.textContent.replace(/^Final/, 'Draft')
  copied = false
  const button = document.querySelector("#copy-record")
  if (button) button.textContent = "Copy summary"
  const status = document.querySelector("#export-status")
  if (status) status.textContent = ""
}

async function copyRecord(full = false) {
  const snapshot = JSON.stringify({ setup, answers, clinician })
  const record = currentRecord()
  const success = await copyText(full ? clinicalSummary(record, clinician) + "\n\n" + record.text : clinicalSummary(record, clinician, { concise: true }))
  const unchanged = snapshot === JSON.stringify({ setup, answers, clinician })
  copied = success && unchanged
  const button = document.getElementById(full ? "copy-full-record" : "copy-record")
  if (button) button.textContent = copied ? "Copied" : full ? "Copy full record" : "Copy summary"
  const status = document.getElementById("export-status")
  if (status) status.textContent = !success ? "Copy unavailable. Use Save report or Export PDF." : !unchanged ? "Copied the earlier version. Copy again to include your latest edits." : full ? "Full record copied." : "Clinical summary copied."
}

function syncPrintRecord() {
  const output = document.getElementById("print-record")
  if (output) output.replaceChildren(markup(reportMarkup(currentRecord(), clinician, { appendix: true, history: historySeries([...history, ...(finalAssessment ? [finalAssessment] : [])]) })))
}

function exportPDF() {
  syncPrintRecord()
  document.getElementById('export-status').textContent = 'Choose Save as PDF in the print dialog. The complete report includes all recorded responses. Printing does not save an encrypted assessment.'
  window.print()
}

function downloadReport() {
  const record = currentRecord()
  const html = buildReport(record, clinician, { appendix: includeAppendix, history: historySeries([...history, ...(finalAssessment ? [finalAssessment] : [])]) })
  downloadFile(html, "text/html;charset=utf-8", `open-screen-${record.generatedAt.slice(0, 10)}.html`)
  document.getElementById("export-status").textContent = "Report download requested. The HTML report opens offline and can be printed to PDF."
}

function downloadJSON() {
  const record = currentRecord()
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

function startMonitoring() {
  if (!finalAssessment) return
  if (savedSignature !== bundleSignature(sittingBundle()) && !window.confirm('The final record has not been saved in an encrypted assessment. Start monitoring and keep it in this tab’s history? Save the new assessment to preserve both.')) return
  try {
    const proposedSetup = freshSetup(screener, setup, { monitoring: true })
    const proposedHistory = [...history, finalAssessment]
    if (proposedHistory.length >= 40) throw new Error('Archive and remove previous history before starting another monitoring assessment.')
    const proposedClinician = { reference: clinician.reference, flags: {}, entered: {}, facts: '', practice: { goals: clinician.practice?.goals || '' } }
    const proposedIdentity = { id: crypto.randomUUID(), startedAt: new Date().toISOString() }
    const proposedCurrent = newAssessment(screener.configuration, proposedSetup, {}, proposedClinician, { phase: 'setup', cursor: null }, proposedIdentity)
    assertVaultCapacity({ schemaVersion: 1, current: proposedCurrent, history: proposedHistory })
    history = proposedHistory; finalAssessment = null
    Object.assign(setup, proposedSetup)
    for (const key of Object.keys(answers)) delete answers[key]
    for (const key of Object.keys(clinician)) delete clinician[key]
    Object.assign(clinician, proposedClinician); identity = proposedIdentity
    invalidExternal.clear(); archivedSignature = null
    selectedPreset = null; setupPage = 'measures'; measureSearch = ''
    reviewerName = ''; savedSignature = null; cursor = null; phase = 'setup'; render()
  } catch (error) { document.getElementById('export-status').textContent = error.message }
}

function clearSitting() {
  if (!window.confirm("Start a new assessment? Export first. Current answers and clinical notes will be cleared.")) return
  // Construct the entire deployment-compatible replacement before discarding state.
  const deployment = readPractice()
  const proposed = freshSetup(deployment.screener, setup)
  const proposedScreens = deployment.screener.symptomDefinitions(proposed)
  screener = deployment.screener; scales = screener.catalog
  primaryTopics = screener.policy.defaults.primaryTopics; clinicalScreens = proposedScreens
  for (const key of Object.keys(setup)) delete setup[key]
  Object.assign(setup, proposed)
  for (const key of Object.keys(answers)) delete answers[key]
  for (const key of Object.keys(clinician)) delete clinician[key]
  Object.assign(clinician, { flags: {}, entered: {}, auditSex: 'not-recorded', facts: '', reference: '', practice: {}, safetyReview: null, safetyAcknowledged: false, safetyEndorsed: false })
  history = []; finalAssessment = null; capturedConfiguration = false
  practiceError = deployment.error || ''
  identity = { id: crypto.randomUUID(), startedAt: new Date().toISOString() }
  workspaceMessage = ''; measureSearch = ''; selectedPreset = null; setupPage = 'measures'
  invalidExternal.clear(); archivedSignature = null; questionError = ''
  includeAppendix = false; reviewerName = ''; savedSignature = null
  cursor = null; copied = false; phase = 'setup'; render()
}

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = event.target.closest('a[href]')
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return
  const home = new URL('index.html#/', location.href)
  if (link.href !== home.href || !hasWork() || savedSignature === bundleSignature(sittingBundle())) return
  event.preventDefault()
  leaveAssessmentDialog({ onSave: () => saveSitting({ returnHomeAfterSave: true }), onLeave: returnHome })
})

window.addEventListener("beforeunload", (event) => {
  if (homeNavigationApproved) { homeNavigationApproved = false; return }
  if (!hasWork() || savedSignature === bundleSignature(sittingBundle())) return
  event.preventDefault()
  event.returnValue = ""
})

// The second click of a double click may land on empty space after a redraw.
// Keep that activation from stealing focus or activating a different control.
document.addEventListener('click', event => {
  if (phase === 'question' && setup.advanceMode !== 'manual' && event.detail > 1) {
    event.preventDefault(); event.stopPropagation()
    document.getElementById('question-title')?.focus({ preventScroll: true })
  }
}, true)
if (!keyBound) {
  document.addEventListener("keydown", onKey)
  keyBound = true
}

document.querySelector(".skip").addEventListener("click", (event) => { event.preventDefault(); document.querySelector("#main").focus() })
wireExportDisclosure()
wireWorkspaceMenu()
wireFormValidation()
window.addEventListener("storage", (event) => {
  if ((event.key === PRACTICE_KEY || event.key === null) && phase === "setup" && refreshPractice()) render()
})
window.addEventListener("focus", () => { if (phase === "setup" && refreshPractice()) render() })
document.addEventListener('focusin', () => requestAnimationFrame(keepFocusedControlVisible))
window.addEventListener('resize', () => requestAnimationFrame(keepFocusedControlVisible))
window.visualViewport?.addEventListener('resize', () => requestAnimationFrame(keepFocusedControlVisible))
render()

// An action-only URL opens recovery without creating or loading patient data.
const entryURL = new URL(location.href)
if (entryURL.searchParams.get('resume') === '1') {
  entryURL.searchParams.delete('resume')
  window.history.replaceState(null, '', entryURL.pathname + entryURL.search + entryURL.hash)
  vaultDialog({ mode: 'resume', onRestore: restoreSitting })
}
