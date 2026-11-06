import { evidenceLines } from "./core/evidence.js"
import { externalMeasures } from './questionnaires/external.js'
import { screener as defaults, editableFields, readPractice, savePractice, reviewPractice, resetPractice, PRACTICE_KEY } from "./app-config.js"
import { configurePractice, restorePractice, displayPreference } from "./core/practice.js"
import { h, header, icon, setFieldError, wireFormValidation } from "./ui.js"

// Read the same validated configuration as the assessment. This page never creates
// a session or accesses responses; labels below describe routing, not diagnoses.
let state = readPractice()
let preview = state.screener
let draft, reason, conflict = false
let pendingWrites = 0
async function applying(operation) {
  pendingWrites++
  try { return await operation() } finally { pendingWrites-- }
}
const fieldByKey = new Map(editableFields.map((field) => [field.key, field]))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function initialValues() {
  return Object.fromEntries(editableFields.map((field) => [field.key, state.preferences && Object.hasOwn(state.preferences.overrides, field.key) ? state.preferences.overrides[field.key] : field.defaultValue]))
}
function dirty() {
  return !same(draft, initialValues()) || !!state.preferences && reason !== state.preferences.reason
}
function startDraft() {
  draft = structuredClone(initialValues())
  reason = state.preferences?.reason || ""
  preview = state.screener
  conflict = false
}
startDraft()
const arrow = () => h("span", { class: "logic-arrow", "aria-hidden": "true" }, icon("arrow"))
const node = (title, detail, className = "") => h("div", { class: `logic-node ${className}` },
  h("strong", null, title), detail ? h("span", null, detail) : null)

function pathway({ id, label, brief, count, gate, full, remaining, note }) {
  const field = fieldByKey.get(`${id}.gate`) || (id === "alcohol" ? fieldByKey.get("alcohol.allowed") : null)
  const changed = field && !same(draft[field.key], field.defaultValue)
  return h("article", { class: "logic-path", "data-pathway": id, "aria-labelledby": `path-${id}` },
    h("h3", { id: `path-${id}` }, label, changed ? h("span", { class: "practice-badge" }, "Customised") : null),
    h("div", { class: "logic-route" },
      node(brief, count), arrow(),
      h("div", { class: "logic-decision" }, field ? h("button", { type: "button", class: "gate-edit", "aria-label": `${gate} · Edit ${field?.label || label}`, onClick: () => { focusRule(field.key); } }, gate, icon("sliders")) : h("span", { class: "gate-edit" }, gate)), arrow(),
      node(full, remaining, "logic-follow-up")),
    note ? h("p", { class: "logic-note" }, note) : null)
}

function pathways() {
  const { policy, questionnaires } = preview.configuration
  const rules = policy.thresholds
  const screens = preview.symptomDefinitions(preview.createSetup())
  const routes = [
    ...screens.map((screen) => ({ id: screen.id, label: screen.label, brief: screen.brief, count: "2 items",
      gate: `Score ≥${screen.openAt}`, full: screen.full,
      remaining: `+${screen.items.length - 2} items · ${screen.items.length} total` })),
    { id: "trauma", label: "Trauma", brief: "PC-PTSD-5", count: "Exposure → if yes, 5 items",
      gate: `Yes count ≥${rules.trauma.gate}`, full: "PCL-5", remaining: "20 items",
      note: "No exposure → stop; brief score 0." },
    { id: "alcohol", label: "Alcohol", brief: "AUDIT-C", count: "3 items",
      gate: rules.alcohol.allowed.map((cut) => `≥${cut}`).join(" or "), full: "AUDIT", remaining: "+7 items · 10 total",
      note: "No fee to complete AUDIT." },
  ]

  return [
    h("div", { class: "logic-section-heading" }, h("h2", { id: "routes-title" }, "Follow-up gates"), h("span", null, "Brief → gate → follow-up")),
    ...routes.map(pathway),
    ...questionnaires.filter((q) => q.phase !== 2).map((q) => q.algorithm === 'taps' ? pathway({ id: q.id, label: q.label, brief: 'TAPS-1', count: '4 items · past 12 months', gate: 'Any use by class', full: 'TAPS-2', remaining: 'Substance-specific · past 3 months', note: 'Fixed published skips. Original US alcohol form; clinician selects the form.' }) : q.gate ? pathway({ id: q.id, label: q.label, brief: q.gate.title,
      count: `${q.gate.itemCount} items`, gate: `Score ≥${q.gate.threshold}`, full: q.title,
      remaining: `+${q.items.length - q.gate.itemCount} items · ${q.items.length} total`,
      note: q.requirements?.length ? "Setup requirements apply." : null }) :
      h("article", { class: "logic-path", "data-pathway": q.id }, h("h3", null, q.label),
        node(q.title, `${q.items.length} items → ${q.algorithm === 'asrs-v1.1' ? '≥4 endorsements → clinical ADHD assessment. Fixed scoring; no 18-item checklist embedded.' : 'clinician review. No automatic cutoff.'}${q.requirements?.length ? " Setup requirements apply." : ""}`))),
  ]
}

function optionalMeasures() {
  const policy = preview.policy
  return [
    node("Personality", `5 markers → ${policy.personality.followUpBands.length ? policy.personality.followUpBands.join(" / ") + " bands → 9 more items per trait" : "no automatic extensions"}`),
    node("Response patterns", "30 IPIP items · descriptive only, not a credibility test."),
    node("Tension", "7 DASS-21 Stress items · raw and doubled scores."),
    ...preview.configuration.questionnaires.filter((q) => q.phase === 2).map((q) => node(q.label, `${q.items.length} items · descriptive trait profile; no clinical gate.`)),
  ]
}

function changeList(changes) {
  return changes.length ? h("ul", { class: "practice-changes" }, ...changes.map((change) =>
    h("li", null, h("strong", null, change.label), `: ${displayPreference(change.before)} → ${displayPreference(change.after)}`))) : document.createDocumentFragment()
}

function fieldControl(field) {
  const id = `preference-${field.key}`
  const value = draft[field.key]
  const onInput = (event) => {
    draft[field.key] = field.kind === "list" ? (/^\s*\d+(\s*,\s*\d+)*\s*$/.test(event.target.value) ? event.target.value.split(",").map(Number) : [NaN]) :
      field.kind === "nullable" && event.target.value === "" ? null : event.target.value === "" ? NaN : Number(event.target.value)
    updatePreview()
  }
  const control = field.kind === "bands" ? h("fieldset", { id, tabindex: "-1", class: "practice-bands", "aria-describedby": `${id}-hint` },
    h("legend", null, field.label), ...["low", "middle", "high"].map((band) => {
      const input = h("input", { type: "checkbox", value: band, onChange: () => {
        draft[field.key] = [...document.querySelectorAll(`#${CSS.escape(id)} input:checked`)].map((item) => item.value)
        updatePreview()
      } })
      input.checked = value.includes(band)
      return h("label", null, input, band)
    })) : h("div", null, h("label", { for: id }, field.label), h("input", {
      id, name: field.key, type: field.kind === "list" ? "text" : "number", inputmode: field.kind === "list" ? "text" : "decimal",
      min: field.min, max: field.max, step: field.step === 1 ? 1 : "any", required: field.kind !== "nullable", maxlength: field.kind === "list" ? 60 : null,
      value: Array.isArray(value) ? value.join(", ") : value ?? "", placeholder: field.kind === "nullable" ? "Ask each assessment" : null,
      "aria-describedby": `${id}-hint`, onInput,
    }))
  return h("div", { class: "practice-field", "data-preference": field.key }, control,
    h("div", { class: "practice-field-meta" },
    h("p", { class: "logic-note", id: `${id}-hint` }, `Default ${displayPreference(field.defaultValue)} · Active ${displayPreference(field.path.reduce((value, key) => value[key], state.screener.configuration))} · `,
      field.kind === "list" ? "Comma-separated, 0–12." : field.section === "Severity bands" ? "Exclusive upper bound." : field.kind === "nullable" ? "Empty = ask each assessment." : field.kind === "bands" ? "Bands opening an extension." : `${field.min}–${field.max}${field.step === 1 ? ", whole numbers" : ""}`),
    h("button", { type: "button", class: "preference-reset", "aria-label": `Reset field: ${field.label}`, disabled: same(value, field.defaultValue), onClick: () => {
      draft[field.key] = structuredClone(field.defaultValue)
      const root = document.querySelector(`[data-preference="${field.key}"]`)
      if (field.kind === "bands") root.querySelectorAll("input").forEach((input) => { input.checked = field.defaultValue.includes(input.value) })
      else document.getElementById(id).value = Array.isArray(field.defaultValue) ? field.defaultValue.join(", ") : field.defaultValue ?? ""
      root.querySelectorAll('[aria-invalid]').forEach(input => setFieldError(input))
      updatePreview()
      document.getElementById(id).focus()
    } }, "Reset field")))
}

/** A gate edits its own field without discarding any other draft values. */
function focusRule(key = null) {
  const editor = document.querySelector('.practice-editor')
  editor.open = true
  editor.dataset.focusedRule = key || ''
  editor.querySelectorAll('.practice-field').forEach(node => { node.hidden = !!key && node.dataset.preference !== key })
  editor.querySelectorAll('.practice-advanced').forEach(node => { node.hidden = !!key })
  const label = document.getElementById('focused-rule-label')
  label.hidden = !key
  label.textContent = key ? 'Editing ' + fieldByKey.get(key).label : ''
  document.getElementById('show-all-thresholds').hidden = !key
  const target = key ? document.getElementById('preference-' + key) : editor.querySelector('input, textarea')
  target?.focus()
}

function editor() {
  return h("details", { class: "practice-editor" }, h("summary", null, "Edit thresholds"),
    h("p", { class: "logic-note" }, "For new assessments in this browser. Custom thresholds require clinical justification."),
    h('div', { class: 'focused-rule-heading' }, h('p', { id: 'focused-rule-label', hidden: true }), h('button', { type: 'button', id: 'show-all-thresholds', class: 'text-button', hidden: true, onClick: () => focusRule() }, 'All thresholds')),
    h("form", { id: "practice-form", onSubmit: async (event) => {
      event.preventDefault()
      try {
        const saved = await applying(() => savePractice(draft, reason, state.raw, document.getElementById("revision-name").value))
        if (saved.error) throw new Error(saved.error)
        state = saved; startDraft(); render(true, "Draft revision saved. Review and activate it below before new assessments use it.")
        document.getElementById("practice-status").focus()
      } catch (error) { showError(error.message) }
    } },
      h("div", { class: "practice-fields" }, ...editableFields.filter((field) => field.section === "Follow-up gates").map(fieldControl)),
      ...["Additional rules", "Severity bands"].map((section) => h("details", { class: "practice-advanced" }, h("summary", null, section),
        section === "Additional rules" ? h("p", { class: "logic-note" }, "Screen thresholds, personality extensions and descriptive response-pattern rules." ) : null,
        h("div", { class: "practice-fields" }, ...editableFields.filter((field) => field.section === section).map(fieldControl)))),
      h('label', { for: 'revision-name' }, 'Revision name'),
      h('input', { id: 'revision-name', type: 'text', maxlength: 80, required: true, placeholder: 'e.g. Adult intake · October 2026' }),
      h("label", { for: "practice-reason" }, "Reason for customisation"),
      h("p", { class: "logic-note", id: "reason-help" }, "No patient details. ", h("a", { href: "help.html#settings", target: "_blank", rel: "noopener noreferrer" }, "Settings guidance ↗")),
      h("textarea", { id: "practice-reason", "aria-describedby": "reason-help", maxlength: 600, rows: 2, required: true, onInput: (event) => { reason = event.target.value; updatePreview() } }, reason),
      h("div", { class: "practice-diff", "aria-label": "Changes from project defaults" }, changeList(state.changes)),
      h("p", { class: "practice-error", id: "practice-error", role: "alert" }),
      h("div", { class: "practice-actions" }, h("button", { type: "submit", class: "primary-link action action-primary", id: "save-practice", disabled: true }, "Save draft revision"),
        h("button", { type: "button", class: "text-button action action-secondary", id: "reload-practice", onClick: () => { state = readPractice(); startDraft(); render(true, "Saved settings reloaded."); document.getElementById("practice-status").focus() } }, "Discard edits")),
    ))
}

function revisionReview(revision) {
  const reviewedRaw = state.raw
  const oldFocus = document.activeElement
  const next = revision.preferences ? restorePractice(defaults, revision.preferences).screener : defaults
  const changes = editableFields.flatMap((field) => {
    let before = state.screener.configuration, after = next.configuration
    for (const key of field.path) { before = before[key]; after = after[key] }
    return same(before, after) ? [] : [{ label: field.label, before, after }]
  })
  const by = h('input', { id: 'revision-reviewer', type: 'text', required: true, maxlength: 200, autocomplete: 'off' })
  const ack = h('input', { id: 'revision-ack', type: 'checkbox', required: true })
  const error = h('p', { role: 'alert', class: 'practice-error' })
  const dialog = h('dialog', { class: 'revision-dialog', 'aria-labelledby': 'revision-review-title' },
    h('h2', { id: 'revision-review-title' }, 'Review ' + revision.name),
    h('p', null, revision.preferences?.reason || 'Restore project defaults'),
    h('h3', null, 'Compared with active settings'), changeList(changes),
    !changes.length ? h('p', null, 'No threshold differences.') : null,
    h('form', { onSubmit: async (event) => {
      event.preventDefault()
      try { state = await applying(() => reviewPractice(revision.id, by.value, reviewedRaw)); dialog.close(); startDraft(); render(true, 'Saved for new assessments in this browser. Reviewed revision activated.'); document.getElementById('practice-status').focus() }
      catch (e) { error.textContent = e.message }
    } }, h('label', { for: 'revision-reviewer' }, 'Reviewing clinician'), by,
    h('label', { class: 'revision-ack' }, ack, h('span', null, 'I reviewed these changes and accept responsibility for their use in this practice.')),
    h('p', { class: 'logic-note' }, 'Local review record only. This browser does not authenticate identity or enforce separation of roles.'), error,
    h('div', { class: 'practice-actions' }, h('button', { type: 'submit', class: 'primary-link action action-primary' }, 'Activate reviewed revision'), h('button', { type: 'button', class: 'action action-secondary', onClick: () => dialog.close() }, 'Cancel'))))
  dialog.addEventListener('close', () => { dialog.remove(); if (oldFocus?.isConnected) oldFocus.focus() })
  document.body.append(dialog); dialog.showModal()
}
function revisionsSection() {
  const rows = state.journal.revisions
  return h('details', { class: 'revision-history', open: rows.some(r => !r.review) }, h('summary', null, 'Settings revisions'),
    state.legacy ? h('div', null, h('p', { class: 'logic-note' }, 'Legacy preferences are active without a named review record. Review the current values before creating further revisions.'), h('button', { type: 'button', class: 'text-button', onClick: () => revisionReview({ id: 'legacy', name: 'Reviewed legacy settings', preferences: state.preferences }) }, 'Review legacy settings')) : null,
    !rows.length ? h('p', { class: 'logic-note' }, 'No named revisions saved.') : null,
    ...[...rows].reverse().map(r => h('article', { class: 'revision-row', 'data-revision': r.id }, h('h3', null, r.name),
      h('p', { class: 'logic-note' }, state.journal.active === r.id ? 'Active' : r.review ? 'Previously reviewed' : 'Draft · not active', ' · ', r.createdAt),
      r.review ? h('p', { class: 'logic-note' }, `Reviewed by ${r.review.by} · ${r.review.at}`) : h('button', { type: 'button', class: 'text-button', onClick: () => revisionReview(r) }, 'Review revision'),
      r.review ? h('button', { type: 'button', class: 'text-button', onClick: () => {
        const result = r.preferences ? restorePractice(defaults, r.preferences) : { preferences: null }
        draft = Object.fromEntries(editableFields.map(f => [f.key, result.preferences && Object.hasOwn(result.preferences.overrides, f.key) ? result.preferences.overrides[f.key] : structuredClone(f.defaultValue)]))
        reason = 'Restore values from ' + r.name; preview = state.screener
        render(true, 'Earlier values loaded as an unsaved draft. Name, save and review a new revision.');
        for (const f of editableFields) {
          const input = document.getElementById('preference-' + f.key)
          if (f.kind === 'bands') input.querySelectorAll('input').forEach(i => { i.checked = draft[f.key].includes(i.value) })
          else input.value = Array.isArray(draft[f.key]) ? draft[f.key].join(', ') : draft[f.key] ?? ''
        }
        document.getElementById('practice-reason').value = reason; updatePreview()
      } }, 'Use as new draft') : null)))
}

function showError(message) {
  document.getElementById("practice-error").textContent = message
}

function updatePreview() {
  let candidate
  try {
    candidate = configurePractice(defaults, draft, reason.trim() || "Unsaved preview", new Date().toISOString())
    preview = candidate.screener
    document.querySelector(".logic-pathways").replaceChildren(...pathways())
    document.querySelector(".logic-optional-grid").replaceChildren(...optionalMeasures())
    document.querySelector(".practice-diff").replaceChildren(changeList(candidate.changes))
    document.getElementById("practice-reason").required = candidate.changes.length > 0
    showError(conflict ? "Settings changed in another tab. Discard edits to load the saved settings." : state.error || "")
  } catch (error) { showError(`Preview not updated: ${error.message}`) }
  document.getElementById("save-practice").disabled = !candidate || !dirty() || conflict || !!state.error
  document.getElementById("download-practice").disabled = dirty() || !!state.error
  document.getElementById("reset-practice").disabled = !state.raw && !dirty()
  document.getElementById("reset-practice").hidden = !state.raw && !dirty()
  document.querySelector(".practice-diff").hidden = !dirty()
  document.getElementById("preview-label").textContent = dirty() ? candidate ? "Unsaved preview" : "Invalid draft · showing last valid preview" : state.preferences ? "Custom practice settings" : "Project defaults"
  document.querySelectorAll(".practice-field").forEach((root) => {
    const field = fieldByKey.get(root.dataset.preference)
    const changed = !same(draft[field.key], field.defaultValue)
    root.classList.toggle("customised", changed)
    root.querySelector(".preference-reset").disabled = !changed
  })
}

function downloadSettings() {
  const record = { schemaVersion: 2, journal: state.journal, exportedAt: new Date().toISOString(), preferences: state.preferences, changes: state.changes, configuration: state.screener.configuration }
  const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }))
  const link = h("a", { href: url, download: "open-screen-practice-settings.json" })
  document.body.append(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function render(editorOpen = false, message = "") {
  const { policy } = state.screener.configuration
  document.querySelector("#app").replaceChildren(h("div", { class: "wrap logic-wrap" },
    header(null, "logic"),
    h("main", { id: "main", tabindex: "-1", class: "logic-main" },
      h("h1", null, "Screening logic"),
      h("p", { class: "lede" }, "Select a threshold to adjust your practice settings."),
      h("section", { class: "practice-settings", "aria-label": "Practice configuration" },
        h("div", { class: "practice-settings-heading" }, h("span", { class: "practice-badge", id: "preview-label" }, state.preferences ? "Custom practice settings" : "Project defaults"),
          h("button", { type: "button", class: "text-button", id: "reset-practice", disabled: !state.raw && !dirty(), onClick: async () => {
            try { state = await applying(() => resetPractice(state.raw)); startDraft(); render(false, "Reset to project defaults. New assessments will use these defaults."); document.getElementById("practice-status").focus() }
            catch (error) { document.getElementById("practice-status").textContent = error.message }
          } }, "Reset to defaults")),
        h("p", { id: "practice-status", class: "logic-note", role: "status", tabindex: "-1" }, message || state.error || ""),
        editor(),
        revisionsSection(),
        state.preferences ? h("details", { class: "practice-record" }, h("summary", null, "Saved customisation record"),
          h("p", null, state.preferences.reason), h("p", { class: "logic-note" }, `Saved ${state.preferences.savedAt} · ${policy.version}`), changeList(state.changes)) : null,
        h("button", { type: "button", class: "text-button", id: "download-practice", disabled: !!state.error, onClick: downloadSettings }, "Export settings")),
      h("ol", { class: "logic-overview", "aria-label": "Assessment order" },
        ...[["Choose areas", null], ["Brief screens", "All selected areas first"], ["Follow-ups", "Where indicated"], ["Review & export", null]].map(([title, detail], index) =>
          h("li", null, h("span", { class: "logic-number", "aria-hidden": "true" }, String(index + 1).padStart(2, "0")), node(title, detail), index < 3 ? arrow() : null))),
      h("section", { "aria-labelledby": "routes-title", class: "logic-pathways" }, ...pathways()),
      h("p", { class: "logic-branch" }, "Below threshold → review without a full score. Shared brief items count once."),
      h("div", { class: "logic-override" }, icon("sliders"), h("p", null,
        h("strong", null, "Clinician override"), " can open a follow-up below the gate. Trauma requires exposure.")),
      h("section", { class: "logic-safety", "aria-labelledby": "safety-title" },
        h("h2", { id: "safety-title" }, "Risk notes (optional)"),
        h("p", null, "Screening continues normally. Questionnaire findings stay in the record; risk assessment and notes are optional at clinician discretion.")),
      h("div", { class: "logic-review" }, icon("check"), node("Clinician review → export", "Screening results and optional notes.")),
      h("details", { class: "logic-optional" }, h("summary", null, "Optional measures"),
        h("div", { class: "logic-optional-grid" }, optionalMeasures())),
      h('details', { class: 'logic-external' }, h('summary', null, 'External measures'), h('p', { class: 'logic-note' }, 'Items are not embedded pending permission review. Authorised external results can be recorded at clinician review.'),
        ...externalMeasures.map((row) => h('p', { class: 'logic-note' }, h('a', { href: row.url, target: '_blank', rel: 'noopener noreferrer' }, row.title + ' ↗'), ' · ' + row.reason))),
      h("details", { class: "logic-notes" }, h("summary", null, "Pathway notes"),
        h("p", null, "Only selected areas are asked. A low brief score does not exclude a disorder; screening supports assessment, not diagnosis."),
        h("p", null, "PHQ-9 functional difficulty is asked separately when symptoms are endorsed. AUDIT requires clinician gate selection or a configured default, and no fee to complete it."),
        h("p", null, "Personality markers join stage one. Trait extensions and other optional scales follow brief screening. DASS Stress requires a defined group, clinician-only scores and no sale of the scale."),
        h("p", null, "Custom thresholds are not validated by this app. Clinical and forensic settings use the same gates; these are not forensic decision thresholds.")),
      h('details', { class: 'logic-evidence' }, h('summary', null, 'Evidence & limits'),
        h('p', { class: 'logic-note' }, 'Sources and active rules. Unsaved diagram edits remain previews until a reviewed revision is activated.'),
        ...['depression','anxiety','trauma','alcohol','personality','validity'].map(id => h('section', null,
          h('h3', null, id === 'validity' ? 'Response patterns' : id[0].toUpperCase() + id.slice(1)),
          ...evidenceLines(state.screener, id).map(line => /^https:\/\//.test(line) ? h('a', { href: line, target: '_blank', rel: 'noopener noreferrer' }, 'Evidence source ↗') : h('p', { class: 'logic-note' }, line))))),
      h("p", { class: "logic-provenance" }, `Policy: ${policy.id} · ${policy.version}`),
    ),
  ))

  document.querySelector(".practice-editor").open = editorOpen
  updatePreview()
}

// A second editor may save while this tab is open. Never silently overwrite it.
window.addEventListener("storage", (event) => {
  if (event.key !== PRACTICE_KEY && event.key !== null) return
  if (dirty()) { conflict = true; updatePreview() }
  else { const open = document.querySelector(".practice-editor").open; state = readPractice(); startDraft(); render(open, "Practice settings updated in another tab.") }
})
window.addEventListener("beforeunload", (event) => {
  if (!dirty() && !pendingWrites) return
  event.preventDefault(); event.returnValue = ""
})
render()

wireFormValidation()
