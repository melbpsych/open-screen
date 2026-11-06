import { evidenceLines } from "./core/evidence.js"
import { workflowLines } from "./core/workflow.js"
import { isVerifiedRecord, canonical } from './core/assessment.js'
import { ENGINE_VERSION, RULES_VERSION } from './core/version.js'
/** Presentation shared by the screen and offline report. No rescoring or storage. */
import { DEFAULT_POLICY, policyNote } from "./policy.js"

export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])
const E = escapeHtml
const palette = ["#dce6e2", "#bdd0c8", "#94b0a3", "#688f7c", "#426d59"]

/** Integer scores occupy cells. Thresholds sit between cells, never on a score. */
export function scoreChartModel({ value, max, threshold = null, bands = [] }) {
  if (!Number.isInteger(max) || max < 1 || !Number.isInteger(value) || value < 0 || value > max) return null
  let lower = 0
  const regions = bands.map(([upper, label], index) => {
    if (!Number.isInteger(upper) || upper <= lower || upper > max + 1) throw new Error("Invalid chart bands")
    const region = { from: lower, to: upper - 1, label, left: lower / (max + 1) * 100, width: (upper - lower) / (max + 1) * 100, color: palette[index % palette.length], selected: value >= lower && value < upper }
    lower = upper
    return region
  })
  if (bands.length && lower !== max + 1) throw new Error("Chart bands must cover every possible score")
  if (threshold != null && (!Number.isInteger(threshold) || threshold < 0 || threshold > max)) throw new Error("Invalid chart threshold")
  return { value, max, point: (value + .5) / (max + 1) * 100, threshold, cut: threshold == null ? null : threshold / (max + 1) * 100, regions }
}

export function scoreChart({ label, value, max, threshold = null, bands = [] }) {
  const model = scoreChartModel({ value, max, threshold, bands })
  if (!model) return '<p class="chart-unavailable">No complete score available.</p>'
  const selected = model.regions.find((region) => region.selected)
  const description = `${label}: ${value} of ${max}.${selected ? ` ${selected.label} score category.` : ""}${threshold != null ? ` Follow-up threshold ${threshold} or greater; ${value >= threshold ? "met" : "not met"}.` : ""}`
  const segments = model.regions.length ? model.regions.map((region) => `<rect x="${region.left}%" y="18" width="${region.width}%" height="12" fill="${region.color}"/>`).join("") : '<rect x="0" y="18" width="100%" height="12" rx="3" fill="#e0e8e2"/>'
  const boundaries = model.regions.slice(1).map((region) => `<line x1="${region.left}%" x2="${region.left}%" y1="18" y2="30" stroke="#fff" stroke-width="2"/>`).join("")
  return `<figure class="score-graphic" role="img" aria-label="${E(description)}" data-value="${value}" data-max="${max}">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="48" aria-hidden="true" focusable="false">${segments}${boundaries}
      ${model.cut != null ? `<line x1="${model.cut}%" x2="${model.cut}%" y1="5" y2="43" stroke="#7b654c" stroke-width="1.5" stroke-dasharray="3 3"/>` : ""}
      <line x1="${model.point}%" x2="${model.point}%" y1="11" y2="37" stroke="#233b33" stroke-width="2"/>
      <circle cx="${model.point}%" cy="24" r="5" fill="#233b33" stroke="#fff" stroke-width="2"/>
    </svg>
    <div class="chart-axis" aria-hidden="true"><span>0</span><span>${threshold != null ? `Follow-up ≥${threshold}` : "Raw score"}</span><span>${max}</span></div>
    ${model.regions.length ? `<div class="band-legend">${model.regions.map((region) => `<span class="${region.selected ? "selected" : ""}"><i style="background:${region.color}"></i><span>${E(region.label)} <small>${region.from}–${region.to}</small></span></span>`).join("")}</div>` : ""}
  </figure>`
}

export function distributionChart(view) {
  if (!view?.ready || !Number.isFinite(view.ceiling) || view.ceiling <= 0) return ""
  const rows = view.groups.map((group) => {
    const bins = group.comparison?.bins || []
    if (bins.length !== 5 || bins.some((bin) => !Number.isFinite(bin.share) || bin.share < 0 || bin.share > view.ceiling)) throw new Error("Invalid reference distribution")
    const chosen = bins.find((bin) => bin.selected)
    const description = bins.map((bin) => `Scored answer ${bin.label}: ${Math.round(bin.share * 100)}%${bin.selected ? ", selected" : ""}`).join(". ")
    return `<section class="distribution-row"><div class="distribution-label"><h3>${E(group.label)}</h3><span class="cat">${E(group.headline)}</span></div>
      <figure role="img" aria-label="${E(`${group.label}. ${description}. Reference-sample frequencies, not clinical probabilities.`)}"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="72" aria-hidden="true" focusable="false">
        <line x1="0" x2="100%" y1="7" y2="7" stroke="#dce4dd" stroke-dasharray="2 4"/>
        <line x1="0" x2="100%" y1="67" y2="67" stroke="#dce4dd"/>
        ${bins.map((bin, index) => { const height = bin.share / view.ceiling * 60; return `<rect x="${index * 20 + 3}%" y="${67 - height}" width="14%" height="${height}" rx="2" fill="${bin.selected ? "#365e4e" : "#d8e3dc"}"${bin.selected ? ' stroke="#203b30" stroke-width="1.5"' : ""}><title>Scored ${E(bin.label)} · ${Math.round(bin.share * 100)}%${bin.selected ? " · selected" : ""}</title></rect>` }).join("")}
      </svg><div class="distribution-axis" aria-hidden="true">${bins.map((bin) => `<span${bin.selected ? ' class="selected"' : ""}>${E(bin.label)}${bin.selected ? " ●" : ""}</span>`).join("")}</div></figure>
      <span class="distribution-share">${chosen ? `${Math.round(chosen.share * 100)}%` : "—"}<small>gave this answer</small></span>
    </section>`
  }).join("")
  return `<div class="reference-chart">${rows}<p class="chart-footnote">Scored answers 1–5. The selected answer is outlined. Every row uses the same 0–${Math.round(view.ceiling * 100)}% height scale. Frequencies describe online volunteers.</p></div>`
}

/** Read the engine's result. An absent full score always stays absent. */
export function resultPanels(record) {
  const panels = record.symptoms.map((row) => {
    const full = row.status === "scored"
    return {
      id: row.id, title: row.label, instrument: full ? row.full : row.brief,
      value: full ? row.total : row.gateScore, max: full ? row.max : 6,
      threshold: full ? null : row.threshold, bands: full ? row.bands : [],
      band: full ? row.band : null, status: row.status,
      brief: `${row.brief} ${row.gateScore ?? "—"}/6 · Follow-up ≥${row.threshold}`,
      badge: row.followUpDeferred ? "Full questionnaire not selected" : full ? (row.positive ? "Screen threshold met" : "Below screen threshold") : row.status === "gate-closed" ? "Below gate" : "Incomplete",
      note: row.followUpDeferred ? "Brief result only. No full score or diagnosis." : full ? `${row.band} symptom severity. Screen threshold ≥${row.screenThreshold}: ${row.positive ? "met" : "not met"}.${row.difficulty ? ` Functional impact: ${row.difficulty.toLowerCase()}.` : ""} Not a diagnosis.` : row.status === "gate-closed" ? "No current full-scale score. Clinical review still applies." : row.opened ? `${row.full} follow-up is incomplete.` : "Brief screen is incomplete.",
      evidence: [row.sentence, row.evidence], override: row.override,
    }
  })
  const alcohol = record.alcohol
  if (alcohol.status !== "not-selected") {
    const full = alcohol.status === "scored"
    panels.push({ id: "alcohol", title: "Alcohol", instrument: full ? "AUDIT" : "AUDIT-C", value: full ? alcohol.total : alcohol.gateScore, max: full ? 40 : 12, threshold: full ? null : alcohol.threshold, bands: [], status: alcohol.status, badge: record.setup?.followUpChoices?.alcohol === false && record.setup?.mode !== "monitoring" ? "Full questionnaire not selected" : full ? "Follow-up complete" : alcohol.status === "gate-closed" ? "Below gate" : "Incomplete", brief: alcohol.gateScore != null ? `AUDIT-C ${alcohol.gateScore}/12 · Follow-up ≥${alcohol.threshold}` : "AUDIT-C not complete", note: full ? "Raw total. Use the source guidance and clinical interview." : alcohol.status === "gate-closed" ? "No current full-scale score. Clinical review still applies." : alcohol.reason || "Follow-up is incomplete.", evidence: [alcohol.sentence, alcohol.drinkNote, alcohol.formZone, alcohol.pageZone, alcohol.zoneLimit, "AUDIT-C threshold selected by the clinician: published female ≥3; male ≥4 (AIHW). Not forensic calibration."].filter(Boolean), override: alcohol.override })
  }
  const trauma = record.trauma
  if (trauma.status !== "not-selected") {
    const full = trauma.pcl?.status === "scored"
    const noExposure = trauma.exposure === "no"
    panels.push({ id: "trauma", title: "Trauma", instrument: full ? "PCL-5" : "PC-PTSD-5", notAdministered: noExposure, value: noExposure ? null : full ? trauma.pcl.total : trauma.count, max: full ? 80 : 5, threshold: full ? null : (trauma.threshold ?? record.policy?.thresholds.trauma.gate ?? DEFAULT_POLICY.thresholds.trauma.gate), bands: [], status: trauma.status, badge: trauma.followUpDeferred ? "Full questionnaire not selected" : full ? "Follow-up complete" : noExposure ? "Not administered" : trauma.status === "incomplete" ? "Incomplete" : "Brief screen complete", brief: noExposure ? "Exposure not endorsed · symptom questions not administered" : `PC-PTSD-5 ${trauma.count ?? "—"}/5 · Follow-up ≥${(trauma.threshold ?? record.policy?.thresholds.trauma.gate ?? DEFAULT_POLICY.thresholds.trauma.gate)}`, note: full ? `Symptom-cluster rule ${trauma.pcl.provisional ? "met" : "not met"} (item ≥${trauma.pcl.endorsementThreshold}); provisional only.` : noExposure ? "Symptom questions skipped. No PCL-5 score. Clinical review still applies." : trauma.pcl ? "PCL-5 follow-up is incomplete." : "No current PCL-5 score. Clinical review still applies.", evidence: [trauma.sentence, trauma.formCutNote, trauma.branchNote, trauma.pcl?.probableNote].filter(Boolean), override: trauma.override })
  }
  for (const row of record.additional || []) {
    if (row.scales) continue
    const full = row.status === "scored"
    panels.push({ id: row.id, title: row.label, instrument: full || row.threshold === null ? row.full : row.brief,
      value: full ? row.total : row.gateScore, max: full || row.threshold === null ? row.max : row.gateMax,
      threshold: full ? null : row.threshold, bands: full ? row.bands : [], band: full ? row.band : null,
      badge: full ? row.positive === true ? 'Screen positive' : row.positive === false ? 'Threshold not met' : "Complete" : row.status === "gate-closed" ? "Below gate" : row.status === "omitted" ? "Not administered" : "Incomplete",
      brief: row.threshold === null ? row.full : `${row.brief} ${row.gateScore ?? "—"}/${row.gateMax} · Follow-up ≥${row.threshold}`,
      note: row.reason || (row.algorithm === 'asrs-v1.1' ? `${row.positive ? 'Further ADHD assessment indicated.' : 'Concerns still warrant clinical assessment.'} Original endorsement count ≥4. No diagnosis from this score.` : row.source.limits), evidence: [row.source.citation, row.source.limits, ...(row.continuousTotal != null ? [`Alternative research total ${row.continuousTotal}/24; research threshold ≥14 ${row.continuousTotal >= 14 ? 'met' : 'not met'}. This is separate from the original 0–6 endorsement rule.`] : [])], override: row.override })
  }
  for (const panel of panels) panel.evidence.push(...evidenceLines({ policy: record.policy || DEFAULT_POLICY, configuration: record.configuration || { questionnaires: [] } }, panel.id))
  return panels
}

/** Trait scales retain their own denominators and direction. No invented norms,
 * percentages, aggregate severity, or between-instrument score comparisons.
 * TAPS uses discrete substance totals and stop-rule notes, not trait means.
 */
export function profilesMarkup(record, { expandFacets = false } = {}) {
  return (record.additional || []).filter((row) => row.scales).map((row) => {
    const scaleMarkup = (scale) => {
      let graphic = ''
      if (scale.mean != null) {
        const min = scale.min / scale.count, max = scale.max / scale.count
        const point = 4 + (scale.mean - min) / (max - min) * 92
        graphic = `<figure role="img" aria-label="${E(`${scale.label}: keyed mean ${scale.mean.toFixed(2)}, range ${min}–${max}; raw sum ${scale.sum}, range ${scale.min}–${scale.max}. Not a percentile.`)}"><svg viewBox="0 0 200 20" width="100%" height="20" aria-hidden="true" focusable="false"><line x1="8" x2="192" y1="10" y2="10" stroke="#d2dfd9" stroke-width="5" stroke-linecap="round"/><circle cx="${point * 2}" cy="10" r="5" fill="#285c4d" stroke="white" stroke-width="1.5"/></svg></figure>`
      } else if (scale.sum != null) graphic = scoreChart({ label: scale.label, value: scale.sum, max: scale.max })
      return `<div class="profile-row" data-scale="${E(scale.id)}"><div><h3>${E(scale.label)}</h3><p>${scale.status !== 'scored' ? 'Incomplete' : scale.sum == null ? E(scale.note) : `Sum ${scale.sum} · range ${scale.min}–${scale.max}`}</p>${scale.stopRule ? `<p>${E(scale.stopRule)}</p>` : ''}${scale.note && scale.sum != null ? `<p>${E(scale.note)}</p>` : ''}</div>${graphic}<strong>${scale.mean != null ? scale.mean.toFixed(2) : scale.sum ?? '—'}<small>${scale.mean != null ? 'keyed mean' : scale.sum != null ? `/ ${scale.max}` : 'no score'}</small></strong></div>`
    }
    const ranges = [...new Set(row.scales.filter((s) => s.count).map((s) => `${s.min / s.count}–${s.max / s.count}`))].join(', ')
    const domains = row.scales.filter((s) => s.level !== 'facet')
    const facets = row.scales.filter((s) => s.level === 'facet')
    return `<section class="profile-panel" data-profile="${E(row.id)}"><div class="panel-heading"><h2>${E(row.label)}</h2><span class="result-badge">${row.status === 'scored' ? 'Complete' : row.status === 'omitted' ? 'Not administered' : 'Incomplete'}</span></div><p class="panel-note">${row.algorithm === 'taps' ? 'Substance scores remain separate. Zero by a skip rule is identified below.' : `Keyed means${ranges ? ' · ' + ranges : ''}. No clinical cutoffs or combined total.`}</p>${domains.map(scaleMarkup).join('')}${facets.length ? `<details class="profile-facets"${expandFacets ? " open" : ""}><summary>30 facet scores</summary>${facets.map(scaleMarkup).join('')}</details>` : ''}<details class="panel-evidence"><summary>Scoring & evidence</summary><p>${E(row.reason || row.source.limits)}</p><p>${E(row.source.citation)}</p></details></section>`
  }).join('')
}

export function panelHtml(panel) {
  return `<article class="score-panel" data-domain="${E(panel.id)}"><div class="panel-heading"><h2>${E(panel.title)}</h2><span class="result-badge">${E(panel.badge)}</span></div>
    ${panel.notAdministered ? `<p class="panel-gate">Not administered—exposure not endorsed.</p>` : `<div class="panel-score"><strong>${Number.isInteger(panel.value) ? panel.value : "—"}<small> / ${panel.max}</small></strong><span>${E(panel.instrument)}${panel.band ? `<b>${E(panel.band)}</b>` : ""}</span></div>
    ${scoreChart({ label: panel.instrument, value: panel.value, max: panel.max, threshold: panel.threshold, bands: panel.bands })}`}
    <p class="panel-gate">${E(panel.brief)}${panel.override ? " · Clinician requested" : ""}</p><p class="panel-note">${E(panel.note)}</p>
    <details class="panel-evidence" data-section="evidence-${E(panel.id)}"><summary>Scoring & evidence</summary>${panel.evidence.map((line) => `<p>${E(line)}</p>`).join("")}</details></article>`
}

function recordedFields(record, clinician) {
  const rows = []
  for (const card of record.cards) {
    for (const field of [card.entry, ...(card.fields || [])].filter(Boolean)) {
      if (field.when && clinician.flags?.[field.when] !== "Yes") continue
      const value = clinician.flags?.[field.id] ?? clinician.entered?.[field.id]
      if (value != null && value !== "") rows.push(`${field.label}: ${value}`)
    }
  }
  return rows
}

export function historyMarkup(series) {
  if (!Array.isArray(series) || series.length > 1000) throw new TypeError('Invalid history series')
  for (const g of series) {
    if (!g || typeof g.label !== 'string' || g.label.length > 300 || !Number.isFinite(g.min) || !Number.isFinite(g.max) || g.min >= g.max || (g.comparisonNote != null && (typeof g.comparisonNote !== 'string' || g.comparisonNote.length > 4500)) || typeof g.settingsChanged !== 'boolean' || !Array.isArray(g.points) || g.points.length > 40) throw new TypeError('Invalid history series')
    for (const p of g.points) if (!p || typeof p.date !== 'string' || !Number.isFinite(Date.parse(p.date)) || !Number.isFinite(p.value) || p.value < g.min || p.value > g.max || typeof p.policy !== 'string' || p.policy.length > 200) throw new TypeError('Invalid history point')
  }
  const comparable = series.filter((g) => g.points.length > 1)
  const single = series.filter((g) => g.points.length === 1)
  if (!comparable.length && !single.length) return '<p class="quiet">Add a final assessment with the same patient reference to compare compatible scores. Brief and full forms stay separate.</p>'
  const singleMarkup = single.map((g) => {
    const point = g.points[0]
    const score = Number.isInteger(point.value) ? point.value : point.value.toFixed(2)
    return `<section class="history-series"><h3>${E(g.label)}</h3>${g.comparisonNote ? `<p class="history-context">${E(g.comparisonNote)}</p>` : ""}<p>${score} · range ${E(g.min)}–${E(g.max)}. Finalised ${E(point.finalisedAt || point.date)}. Policy ${E(point.policy)}. One kept final is not a change score.</p></section>`
  }).join("")
  const singleNote = single.length ? `<p class="quiet">Kept final ${single.length === 1 ? "score" : "scores"}. A graph appears when two or more compatible finals exist.</p>${singleMarkup}` : ""
  if (!comparable.length) return singleNote
  return singleNote + '<p class="quiet">Observed scores only. A difference is not evidence of reliable or clinically meaningful change. Points use assessment start dates; only the latest final revision of each assessment is compared.</p>' + comparable.map((g, i) => {
    const start = Date.parse(g.points[0].date), duration = Date.parse(g.points.at(-1).date) - start
    const coordinates = g.points.map((p, n) => [duration ? 20 + (Date.parse(p.date) - start) / duration * 560 : 20 + n / (g.points.length - 1) * 560, 100 - (p.value - g.min) / (g.max - g.min) * 80])
    return `<section class="history-series"><h3>${E(g.label)}</h3>${g.comparisonNote ? `<p class="history-context">${E(g.comparisonNote)}</p>` : ""}<p class="history-last">Latest ${Number.isInteger(g.points.at(-1).value) ? g.points.at(-1).value : g.points.at(-1).value.toFixed(2)} · range ${E(g.min)}–${E(g.max)}</p><figure role="img" aria-label="${E(g.label)} observed scores over time; values in the table below"><svg viewBox="0 0 600 120" width="100%" aria-hidden="true" focusable="false"><line x1="20" x2="580" y1="20" y2="20" stroke="#dce4dd"/><line x1="20" x2="580" y1="60" y2="60" stroke="#dce4dd" stroke-dasharray="4 4"/><line x1="20" x2="580" y1="100" y2="100" stroke="#9aaba1"/><polyline points="${coordinates.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#276451" stroke-width="2"/>${coordinates.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#203b32"/>`).join('')}</svg></figure><p class="history-range"><span>${E(new Date(g.points[0].date).toISOString().slice(0,10))}</span><span>${E(new Date(g.points.at(-1).date).toISOString().slice(0,10))} · UTC</span></p><p class="quiet">Range ${E(g.min)}–${E(g.max)}${g.settingsChanged ? ' · Practice settings changed; compare source records before interpretation.' : ''}</p><div class="history-table"><table><caption class="sr-only">${E(g.label)} assessment history</caption><thead><tr><th scope="col">Started (UTC)</th><th scope="col">Score</th><th scope="col">Policy</th></tr></thead><tbody>${g.points.map((p) => `<tr><td>${E(p.date)}</td><td>${Number.isInteger(p.value) ? p.value : p.value.toFixed(2)}</td><td>${E(p.policy)}</td></tr>`).join('')}</tbody></table></div></section>`
  }).join('')
}

function reviewLabel(record, clinician = record.clinician) {
  const r = record.assessment?.review
  const verified = isVerifiedRecord(record) && canonical(clinician) === canonical(record.clinician)
  return r?.status === "final" && verified ? `Final${Object.keys(record.omissions || {}).length ? " · contains unscored missing answers" : ""} · attested by ${r.by} · ${r.at}. Local workflow attestation; identity is not authenticated.` : r?.status === 'final' ? 'Draft · unsigned or unverified content; the earlier attestation does not cover this rendering.' : "Draft · not finalised by a clinician."
}

const administrationLines = record => (record.administration || []).map(row => `${row.label}: ${row.status === 'omitted' ? 'not administered' : row.status}. ${row.answered}/${row.required} current-path responses available${row.missing ? `; ${row.missing} explicitly missing` : ''}.${row.reason ? ' ' + row.reason : ''}`)

export function clinicalSummary(record, clinician = record.clinician || {}, { concise = false } = {}) {
  const lines = ["Open Screen · Clinical screening", reviewLabel(record, clinician),
    ...(concise ? [] : [`Engine: ${record.configuration?.engineVersion || ENGINE_VERSION}. Application rules: ${record.configuration?.rulesVersion || RULES_VERSION}.`, `Policy: ${(record.policy || DEFAULT_POLICY).id} · ${(record.policy || DEFAULT_POLICY).version}.`]),
    `Context: ${record.forensic ? "forensic" : "clinical"}${clinician.reference ? ` · Reference: ${clinician.reference}` : ""}`]
  const represented = new Set([...resultPanels(record).map(row => row.id), ...(record.additional || []).filter(row => row.scales).map(row => row.id)])
  lines.push(...administrationLines(concise ? { administration: (record.administration || []).filter(row => !represented.has(row.id) && row.status !== 'scored') } : record))
  if (record.policy?.id === "practice-custom") lines.push(policyNote(record.policy))
  if (record.safetyFlag) lines.push("PHQ-9 item 9 was endorsed.")
  for (const panel of resultPanels(record)) {
    if (!concise) lines.push(`${panel.title}: ${panel.instrument} ${panel.notAdministered ? "not administered" : Number.isInteger(panel.value) ? `${panel.value}/${panel.max}` : "incomplete"}${panel.band ? `, ${panel.band.toLowerCase()} symptom severity` : ""}. ${panel.brief}. ${panel.override ? "Clinician requested follow-up. " : ""}${panel.note}`)
    else {
      const value = panel.notAdministered ? 'not administered (exposure not endorsed)' : Number.isInteger(panel.value) ? `${panel.value}/${panel.max}` : 'incomplete'
      const brief = panel.status === 'scored' && !panel.brief.startsWith(panel.instrument) ? `${panel.brief}. `
        : !panel.notAdministered && panel.status !== 'gate-closed' && panel.threshold != null ? `Follow-up threshold ≥${panel.threshold}. ` : ''
      const note = panel.notAdministered ? 'No PCL-5 score.' : panel.status === 'gate-closed' ? `Below follow-up threshold ≥${panel.threshold}; full form not administered.` : panel.note
      lines.push(`${panel.instrument}: ${value}. ${brief}${panel.override ? 'Clinician requested follow-up. ' : ''}${note}`)
    }
  }
  for (const row of record.additional || []) {
    if (row.continuousTotal != null) lines.push(`ASRS alternative research total: ${row.continuousTotal}/24; ≥14 ${row.continuousTotal >= 14 ? 'met' : 'not met'}. Separate from original endorsement count.`)
    if (row.scales) lines.push(`${row.label}: ${row.status}. No combined total. ${row.scales.map((s) => `${s.label}: ${s.status !== 'scored' ? 'incomplete' : s.sum == null ? s.note : `${s.sum} (range ${s.min}–${s.max})${s.mean != null ? `; mean ${s.mean.toFixed(2)}` : ''}`}${s.stopRule ? `; ${s.stopRule}` : ''}`).join('; ')}. ${row.source.limits}`)
    if (row.license) lines.push(row.license.attribution)
  }
  if (record.personality?.ready) lines.push(`Personality: ${record.personality.analysis}`)
  for (const row of record.ipip || []) lines.push(`IPIP trait extension · ${row.label}: ${row.status === "scored" ? `${row.sum}/50 (range 10–50; no clinical severity band)` : "incomplete"}.`)
  if (record.stress.status === "scored") lines.push(`DASS-21 Stress: ${record.stress.doubled}/42 (doubled score; no automated severity band).`)
  if (record.validity?.status === "scored") lines.push(`IPIP response patterns: ${record.validity.label}. Option counts 1–5: ${record.validity.responseCounts.join(", ")}; longest repeated run ${record.validity.run}. Descriptive only; not a validated malingering or credibility test.`)
  const workflow = workflowLines({ ...record, clinician })
  lines.push(...(concise ? workflow.filter(line => !line.startsWith('Administration:')) : workflow), ...recordedFields(record, clinician))
  if (clinician.facts) lines.push(`Clinical notes: ${clinician.facts}`)
  lines.push(concise ? 'Screening is not a diagnosis. Negative screens do not exclude a condition.' + (record.forensic ? ' Thresholds are not calibrated for forensic decisions.' : '') : "Screening supports clinical assessment; it does not establish a diagnosis. Negative gates do not exclude a condition. No combined score. Published thresholds are not calibrated for this practice's forensic population.")
  return lines.join(concise ? "\n" : "\n\n")
}

export function reportMarkup(record, clinician = record.clinician || {}, { appendix = false, history = [] } = {}) {
  const context = record.forensic ? "Forensic" : "Clinical"
  const generated = record.generatedAt || new Date().toISOString()
  const observations = recordedFields(record, clinician)
  return `<main class="report-sheet"><header class="report-heading"><div><span class="report-brand">open<strong>screen</strong></span><h1>Clinical screening</h1></div><div class="report-meta">${E(context)} · Adults<br>${E(generated)}${clinician.reference ? `<br>Reference: ${E(clinician.reference)}` : ""}</div></header>
    <p class="report-status">${E(reviewLabel(record, clinician))}</p>
    <p class="report-provenance">Engine ${E(record.configuration?.engineVersion || ENGINE_VERSION)} · Application rules: ${E(record.configuration?.rulesVersion || RULES_VERSION)}.</p>
    ${(record.administration || []).length ? `<section class="report-section"><h2>Selected measures and administration status</h2><ul>${administrationLines(record).map(line => `<li>${E(line)}</li>`).join('')}</ul></section>` : ''}
    ${record.safetyFlag ? '<p class="report-observation">PHQ-9 item 9 was endorsed.</p>' : ""}
    <section class="report-panels">${resultPanels(record).map(panelHtml).join("")}</section>
    ${profilesMarkup(record, { expandFacets: true })}
    ${record.personality?.ready ? `<section class="report-section"><h2>Personality markers</h2>${distributionChart(record.personality)}<p>${E(record.personality.analysis)}</p></section>` : ""}
    ${record.ipip?.length ? `<section class="report-section"><h2>IPIP trait extensions</h2><ul>${record.ipip.map((row) => `<li>${E(row.label)}: ${row.status === "scored" ? `${row.sum}/50 (range 10–50)` : "incomplete"}</li>`).join("")}</ul><p>Raw trait sums. No clinical severity bands or forensic norms.</p></section>` : ""}
    ${record.stress.status === "scored" ? `<section class="report-section"><h2>DASS-21 Stress</h2><p>Doubled score ${record.stress.doubled}/42. No automated severity classification.</p>${scoreChart({ label: "DASS-21 Stress, doubled", value: record.stress.doubled, max: 42 })}</section>` : ""}
    ${record.validity?.status === "scored" ? `<section class="report-section"><h2>Response patterns · IPIP</h2><p>${E(record.validity.label)}. Impression-management mean ${E(record.validity.im.mean)}; self-deception mean ${E(record.validity.deception.mean)}. ${E(record.validity.sampleNote)} Option counts 1–5: ${E(record.validity.responseCounts.join(", "))}. Longest repeated run ${E(record.validity.run)}. Descriptive only; not a validated malingering or credibility test.</p></section>` : ""}
    <section class="report-section"><h2>Administration & clinical context</h2>${workflowLines({ ...record, clinician }).map(line => `<p class="workflow-line">${E(line)}</p>`).join("")}</section>
    ${observations.length || clinician.facts ? `<section class="report-section"><h2>Clinical notes</h2>${observations.length ? `<ul>${observations.map((line) => `<li>${E(line)}</li>`).join("")}</ul>` : ""}${clinician.facts ? `<p class="report-notes">${E(clinician.facts)}</p>` : ""}</section>` : ""}
    ${history.length ? `<section class="report-section"><h2>Assessment history</h2>${historyMarkup(history)}</section>` : ""}
    <p class="report-limit">Screening supports clinical assessment, not a diagnosis. Negative gates do not exclude conditions. There is no combined score. ${record.forensic ? "Published thresholds are not calibrated for this forensic population. " : ""}${E(policyNote(record.policy || DEFAULT_POLICY))} Interpret the findings with interview and collateral information.</p>
    <details class="report-sources" open><summary>Sources & administration</summary><ol>${record.references.map((ref) => `<li>${E(ref.apa)}</li>`).join("")}</ol></details>
    ${appendix ? `<section class="report-appendix"><h2>Full record & response appendix</h2><pre>${E(record.text)}</pre></section>` : ""}
    <footer class="report-footer">Prepared locally · Policy ${E((record.policy || DEFAULT_POLICY).id)} · ${E((record.policy || DEFAULT_POLICY).version)} · Preserve in the practice record</footer></main>`
}

export function buildReport(record, clinician = record.clinician || {}, options = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><title>Open Screen · Clinical screening</title><style>${presentationStyles}</style></head><body class="offline-report">${reportMarkup(record, clinician, options)}</body></html>`
}

export const presentationStyles = `
.history-range{display:flex;justify-content:space-between;gap:1rem;font-size:.8125rem;color:#52665a}.history-last{font-size:.875rem;color:#203b32}
.report-status{padding:12px 0;border-bottom:1px solid #dce4dd;font-weight:600;overflow-wrap:anywhere}.history-series{margin-top:24px}.history-series h3{font-weight:500}.history-series figure{margin:0}.history-table{overflow:auto}.history-table table{border-collapse:collapse;width:100%;font-size:.8125rem}.history-table th,.history-table td{padding:10px;text-align:left;border-bottom:1px solid #dce4dd;overflow-wrap:anywhere}.report-sheet .quiet{font-size:.8125rem;color:#52665a}.report-sheet .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}

.profile-panel{border:1px solid #dce4dd;background:#fff;border-radius:9px;padding:24px 26px;margin-top:20px;min-width:0;overflow-wrap:anywhere}.profile-panel h2{font:400 1.4375rem/1.3 Georgia,serif;margin:0;color:#203b32}.profile-panel>.panel-note{margin-top:12px}.profile-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(70px,1fr) 66px;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid #e6ece7;break-inside:avoid}.profile-row h3{font:500 .9375rem/1.5 system-ui,sans-serif;margin:0;color:#28483b}.profile-row p{font:.75rem/1.6 system-ui,sans-serif;margin:3px 0 0;color:#52665a}.profile-row figure{margin:0;min-width:0}.profile-row strong{grid-column:3;text-align:right;font:400 1.5rem/1.3 Georgia,serif;color:#285c4d}.profile-row small{display:block;font:.75rem/1.5 system-ui,sans-serif;color:#52665a}.profile-facets{margin-top:18px}.profile-facets>summary{font:.875rem/1.5 system-ui,sans-serif;cursor:pointer;color:#345943}@media(max-width:480px){.profile-panel{padding:20px}.profile-row{grid-template-columns:minmax(0,1fr) 66px;gap:10px}.profile-row>div{grid-column:1}.profile-row figure{grid-column:1;grid-row:2}.profile-row strong{grid-column:2;grid-row:1/3}}@media print{.profile-facets>div{display:grid!important}.profile-facets>summary{display:block;list-style:none}.profile-panel{break-inside:auto}.profile-row{break-inside:avoid}}@media(forced-colors:active){.profile-row circle{fill:CanvasText}.profile-row line{stroke:GrayText}}

.score-graphic{margin:1.1rem 0 .9rem}.score-graphic svg{display:block;overflow:visible;print-color-adjust:exact;-webkit-print-color-adjust:exact}.chart-axis{display:flex;justify-content:space-between;color:#617069;font-size:0.75rem;line-height:1.5}.chart-axis span:nth-child(2){font-size:0.75rem}.band-legend{display:flex;flex-wrap:wrap;gap:7px 14px;margin-top:15px}.band-legend>span{display:flex;align-items:start;gap:5px;font-size:0.75rem;color:#5a6d61;line-height:1.5}.band-legend i{width:7px;height:7px;border-radius:2px;flex-shrink:0;margin-top:4px;print-color-adjust:exact}.band-legend small{display:block;font-size:0.75rem;color:#6c776f}.band-legend .selected{color:#213f31;font-weight:650}.band-legend .selected i{outline:1px solid #335841;outline-offset:1px}.chart-unavailable{color:#667269;font-size:0.75rem}.score-panel{padding:24px 26px;background:#fff;border:1px solid #dce4dd;border-radius:9px;min-width:0;break-inside:avoid}.panel-heading{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:start;gap:8px}.panel-heading h2{font:400 1.4375rem/1.3 Georgia,serif;margin:0;color:#203b32;letter-spacing:-.5px}.result-badge{font:0.75rem/1.6 system-ui,sans-serif;background:#f2f5f1;border:1px solid #e0e7e0;border-radius:4px;padding:2px 6px;color:#52645a;white-space:normal;max-width:100%}.panel-score{display:flex;align-items:center;gap:14px;margin-top:20px}.panel-score>strong{font:400 2.5rem/1 Georgia,serif;color:#234333;letter-spacing:-1px}.panel-score small{font:400 0.9375rem system-ui,sans-serif;letter-spacing:0;color:#617066}.panel-score>span{font:0.75rem/1.6 system-ui,sans-serif;color:#596b60}.panel-score b{display:block;color:#345943;font-size:0.75rem;font-weight:600}.panel-gate{font:0.75rem/1.6 system-ui,sans-serif;color:#4d6656;margin:10px 0 5px}.panel-note{font:0.75rem/1.8 system-ui,sans-serif;color:#6b756c;margin:0}.panel-evidence{border-top:1px solid #e9ede7;margin-top:15px;padding-top:12px}.panel-evidence summary{font:0.75rem/1.5 system-ui,sans-serif;cursor:pointer;color:#506956}.panel-evidence p{font:0.75rem/1.8 system-ui,sans-serif;color:#5b6e60;margin-top:12px}.reference-chart{margin-top:16px}.distribution-row{display:grid;grid-template-columns:130px minmax(0,1fr) 82px;gap:20px;align-items:center;padding:12px 0;border-bottom:1px solid #e7ece5}.distribution-label h3{font:500 0.75rem/1.6 system-ui,sans-serif;color:#2d4c3c;margin:0}.distribution-label .cat{display:block;text-align:left;font:400 1.0625rem/1.5 Georgia,serif;margin-top:3px}.distribution-row figure{margin:0;min-width:0}.distribution-row svg{display:block;print-color-adjust:exact;-webkit-print-color-adjust:exact}.distribution-axis{display:grid;grid-template-columns:repeat(5,1fr);text-align:center;font-size:0.75rem;color:#64705f;line-height:1.4}.distribution-axis .selected{color:#2d513e;font-weight:650}.distribution-share{font:400 1.375rem/1.3 Georgia,serif;text-align:right;color:#31533e}.distribution-share small{display:block;font:0.75rem/1.6 system-ui,sans-serif;color:#5f6f60;margin-top:3px}.chart-footnote{font:0.75rem/1.8 system-ui,sans-serif;color:#6b786c;margin-top:16px}.report-sheet{overflow-wrap:anywhere;font:0.8125rem/1.7 system-ui,sans-serif;color:#283b30;background:white}.report-heading{display:flex;justify-content:space-between;gap:24px;border-bottom:1px solid #cad8ca;padding-bottom:22px;margin-bottom:22px}.report-brand{font:1.25rem/1.3 system-ui,sans-serif;letter-spacing:-1px;color:#315c44}.report-heading h1{font:400 2rem/1.2 Georgia,serif;color:#243f30;letter-spacing:-1px;margin:14px 0 0}.report-meta{text-align:right;font:0.75rem/1.9 system-ui,sans-serif;color:#6a776b;overflow-wrap:anywhere;max-width:45%}.report-panels{display:grid;grid-template-columns:1fr 1fr;gap:16px}.report-section{margin-top:28px}.report-section h2{font:400 1.4375rem/1.4 Georgia,serif;margin:0 0 12px;letter-spacing:-.4px}.workflow-line,.report-notes{white-space:pre-wrap;overflow-wrap:anywhere}.report-safety{font-size:0.75rem;color:#4f6454;margin-bottom:18px}.report-priority{border-left:3px solid #9b593c;background:#fcf1e9;padding:14px 18px;color:#7c432e;margin-bottom:18px}.report-priority p{margin:5px 0 0;font-size:0.75rem}.report-limit{font-size:0.75rem;color:#5c6f5e;border-top:1px solid #dce4d8;padding-top:18px;margin-top:26px}.report-sources{font-size:0.75rem;color:#657365;margin-top:18px}.report-sources summary{cursor:pointer}.report-sources li{margin:6px 0;overflow-wrap:anywhere}.report-appendix{break-before:page;margin-top:32px}.report-appendix pre{white-space:pre-wrap;overflow-wrap:anywhere;font:0.75rem/1.7 system-ui,sans-serif}.report-footer{font-size:0.75rem;color:#626f61;margin-top:28px;border-top:1px solid #dde4d9;padding-top:12px}.offline-report{margin:0;background:#f3f5f0}.offline-report .report-sheet{max-width:940px;margin:32px auto;padding:42px}.report-section p,.report-section li{font-size:0.75rem}.report-section ul{padding-left:18px}
@media(max-width:620px){.distribution-row{grid-template-columns:1fr 75px;gap:6px 14px}.distribution-label{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:space-between;align-items:center;grid-column:1/-1}.distribution-label .cat{margin:0}.distribution-share{font-size:1.25rem}.score-panel{padding:22px}.report-panels{grid-template-columns:1fr}.offline-report .report-sheet{padding:24px 20px;margin:0}.report-heading h1{font-size:1.6875rem}.report-meta{font-size:0.75rem;max-width:none;text-align:left}.report-heading{flex-direction:column;gap:12px}}
@media print{@page{size:A4;margin:16mm}.offline-report{background:#fff}.offline-report .report-sheet{padding:0;margin:0;max-width:none}.report-sheet{font-size:10pt}.report-panels{grid-template-columns:1fr 1fr;gap:12px}.score-panel{padding:18px;box-shadow:none}.panel-evidence{display:none}.report-sources{display:block}.report-sources>summary{display:block;font-weight:600;list-style:none}.report-sources>summary::marker{content:""}.report-sources>ol{display:block!important}.report-section{break-inside:avoid}.report-appendix{break-before:page}.report-heading{break-after:avoid}.band-legend>span{font-size:0.75rem}.report-footer{margin-top:20px}}
`
