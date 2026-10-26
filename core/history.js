/** Compare observed scores only. Compatibility includes the instrument's actual
 * item/key definition, timeframe and form. Threshold changes are disclosed but do
 * not turn the same raw score into a different measurement instrument.
 */
import {
  assessmentRecord,
  canonical,
  validateAssessment
} from './assessment.js'
import { resultPanels } from '../presentation.js'
function measurements(a) {
  const r = assessmentRecord(a),
    rows = []
  const add = (id, label, value, min, max, definition) => {
    if (Number.isFinite(value))
      rows.push({
        key: canonical({
          id,
          min,
          max,
          definition,
          engine: a.configuration.engineVersion,
          rules: a.configuration.rulesVersion
        }),
        label,
        value,
        min,
        max
      })
  }
  for (const p of resultPanels(r)) {
    if (
      !['scored', 'gate-closed'].includes(p.status) &&
      !(p.id === 'trauma' && r.trauma.status === 'scored')
    )
      continue
    const q = a.configuration.questionnaires.find((q) => q.id === p.id)
    const def = q
      ? { ...q, gate: undefined, screenAt: undefined, bands: undefined }
      : p.instrument
    add(p.id + ':' + p.instrument, p.instrument, p.value, 0, p.max, def)
  }
  for (const q of r.additional || [])
    for (const s of q.scales || []) {
      if (s.status !== 'scored' || s.sum == null) continue
      const definition = a.configuration.questionnaires.find(
        (d) => d.id === q.id
      )
      add(
        q.id + ':' + s.id,
        `${q.label} · ${s.label}`,
        s.mean ?? s.sum,
        s.mean != null ? s.min / s.count : s.min,
        s.mean != null ? s.max / s.count : s.max,
        { definition, form: a.setup.forms?.[q.id] || null }
      )
    }
  if (r.stress.status === 'scored')
    add(
      'dass-stress',
      'DASS-21 Stress (doubled)',
      r.stress.doubled,
      0,
      42,
      'DASS-21 Stress original 7 items'
    )
  for (const s of r.ipip || [])
    if (s.status === 'scored')
      add(
        'ipip-extension:' + s.id,
        s.label + ' · IPIP extension',
        s.sum,
        10,
        50,
        s.id
      )
  return rows
}
export function historySeries(assessments) {
  const groups = new Map()
  let reference = null
  const latest = new Map()
  for (const incoming of assessments) {
    const checked = validateAssessment(incoming)
    if (checked.review.status !== 'final') continue
    if (!checked.clinician.reference?.trim()) continue
    if (reference !== null && reference !== checked.clinician.reference)
      throw new TypeError('History patient references do not match')
    reference = checked.clinician.reference
    if (
      !latest.has(checked.id) ||
      Date.parse(latest.get(checked.id).review.at) <
        Date.parse(checked.review.at)
    )
      latest.set(checked.id, checked)
  }
  for (const a of latest.values()) {
    for (const m of measurements(a)) {
      if (!groups.has(m.key))
        groups.set(m.key, {
          label: m.label,
          min: m.min,
          max: m.max,
          points: []
        })
      groups
        .get(m.key)
        .points.push({
          date: a.startedAt,
          finalisedAt: a.review.at,
          value: m.value,
          policy: a.configuration.policy.version,
          settings: canonical({
            policy: a.configuration.policy,
            form: a.setup.forms,
            auditThreshold: a.setup.auditThreshold
          }),
          id: a.id
        })
    }
  }
  return [...groups.values()].map((g) => ({
    ...g,
    points: g.points.sort((a, b) => a.date.localeCompare(b.date)),
    settingsChanged: new Set(g.points.map((p) => p.settings)).size > 1
  }))
}
