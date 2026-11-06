/** Templates contain practice selections only: never patient details, completed
 * administration confirmations, form choices, responses or clinical notes.
 */
import { object, text, list, immutableCopy } from './validation.js'
export const TEMPLATE_KEY = 'open-screen.templates.v1'
export function validateTemplates(raw, factory) {
  list(raw, 'Templates', 20)
  const names = new Set()
  return immutableCopy(
    raw.map((row) => {
      object(row, 'Template', ['name', 'context', 'topics', 'mode'])
      if (row.mode != null && !['screening','monitoring'].includes(row.mode)) throw new TypeError('Invalid template mode')
      text(row.name, 'Template name', 80)
      if (names.has(row.name.trim().toLowerCase()))
        throw new TypeError('Template names must be unique')
      names.add(row.name.trim().toLowerCase())
      if (!['clinical', 'forensic'].includes(row.context))
        throw new TypeError('Choose a setting before saving a template')
      list(row.topics, 'Template areas', 50)
      if (
        !row.topics.length ||
        new Set(row.topics).size !== row.topics.length ||
        row.topics.some((id) => !factory.catalog.some((s) => s.id === id))
      )
        throw new TypeError('Template contains unavailable or duplicate areas')
      return {
        name: row.name.trim(),
        context: row.context,
        ...(row.mode ? { mode: row.mode } : {}),
        topics: [...row.topics]
      }
    })
  )
}
export function templateSetup(row, factory) {
  const checked = validateTemplates([row], factory)[0]
  return factory.createSetup({
    context: checked.context,
    mode: checked.mode || 'screening',
    topics: Object.fromEntries(
      factory.catalog.map((s) => [s.id, checked.topics.includes(s.id)])
    )
  })
}
const builtinInfo = {
  depression: [
    'Past 2 weeks',
    'Depressive symptoms; 2 → 9 items, plus functional impact when indicated.'
  ],
  anxiety: ['Past 2 weeks', 'Generalised anxiety symptoms; 2 → 7 items.'],
  trauma: [
    'Past month',
    'Exposure + 5 brief items → 20 PCL-5 items and an optional event description.'
  ],
  alcohol: [
    'Past year; lifetime harm items',
    '3 → 10 items. Clinician chooses the brief gate; administration must be free.'
  ],
  personality: [
    'General tendencies',
    '5 markers; 9 additional items per opened trait. Volunteer frequencies, not clinical norms.'
  ],
  validity: [
    'General tendencies',
    '30 descriptive IPIP items. Does not establish credibility or malingering.'
  ],
  irritability: [
    'Past week',
    '7 DASS Stress items; raw and doubled scores, no automated severity bands.'
  ]
}
export function measureInfo(factory, id) {
  const q = factory.configuration.questionnaires.find((row) => row.id === id)
  if (!q) return builtinInfo[id] || ['', '']
  return [
    q.stem || 'See official administration instructions',
    `${q.algorithm === 'taps' ? '4 brief items, then class-specific skips.' : `${q.items.length} items${q.gate ? `; ${q.gate.itemCount} initially` : ''}.`} ${q.source.limits}`
  ]
}
export function personalityOverlap(topics) {
  return (
    ['personality', 'mini-ipip', 'ipip-neo-120'].filter((id) => topics[id])
      .length > 1
  )
}

/** Response-task range, not a completion-time or clinical burden estimate. */
export function assessmentBurden(factory, setup) {
  const fixed = { depression: [2,10], anxiety: [2,7], trauma: [1,27], alcohol: [3,10], personality: [5,50], validity: [30,30], irritability: [7,7] }
  let min = 0, max = 0
  for (const row of factory.catalog.filter(row => setup.topics[row.id])) {
    const q = factory.configuration.questionnaires.find(q => q.id === row.id)
    let range = fixed[row.id] || [q?.algorithm === 'taps' ? 4 : q?.gate?.itemCount || q?.items.length || 0, q?.items.length || 0]
    if (setup.mode === 'monitoring' && !['trauma','taps'].includes(row.id)) range = [range[1],range[1]]
    min += range[0]; max += range[1]
  }
  return { min, max }
}
