/** Explicit TAPS routing. No summed TAPS-1 or cross-substance score.
 * The 2017 CTN US form is fixed. Never infer its sex-specific alcohol variant.
 * Published skips make a negative past-year or past-three-month use response
 * zero by stop rule; missing responses remain missing, never zero-imputed.
 */
const classes = [
  ['tobacco', 'Tobacco', 'tobacco'], ['alcohol', 'Alcohol', 'alcohol'],
  ['cannabis', 'Cannabis', 'drugs'], ['stimulants', 'Cocaine / methamphetamine', 'drugs'],
  ['heroin', 'Heroin', 'drugs'], ['opioids', 'Prescription opioids', 'prescription'],
  ['sedatives', 'Prescription sedatives', 'prescription'], ['rx-stimulants', 'Prescription stimulants', 'prescription'],
  ['other', 'Other drugs', 'drugs'],
]
const validBrief = (value) => Number.isInteger(value) && value >= 0 && value <= 4
const validYesNo = (value) => value === 0 || value === 1
const alcoholForm = (setup) => setup.forms?.taps
const briefId = (group, setup) => `taps-brief-${group}${group === 'alcohol' ? '-' + alcoholForm(setup) : ''}`
const idsFor = (id, setup) => id === 'other' ? ['taps-other-use', 'taps-other-detail'] :
  [`taps-${id}-use`, ...(id === 'alcohol' ? [`taps-alcohol-${alcoholForm(setup)}`] : []), `taps-${id}-a`, `taps-${id}-b`]

export function tapsPath(setup, answers) {
  const briefs = ['tobacco', 'alcohol', 'drugs', 'prescription'].map((group) => briefId(group, setup))
  const path = briefs.map((id) => ({ id, stage: 1 }))
  // No follow-up before every brief item has a valid response.
  if (!briefs.every((id) => validBrief(answers[id]))) return path
  for (const [id, , group] of classes) {
    if (answers[briefId(group, setup)] === 4) continue
    const [use, ...rest] = idsFor(id, setup)
    path.push({ id: use, stage: 2 })
    if (answers[use] === 1) path.push(...rest.map((id) => ({ id, stage: 2 })))
  }
  return path
}

export function tapsResult(setup, answers) {
  const briefs = ['tobacco', 'alcohol', 'drugs', 'prescription'].map((group) => briefId(group, setup))
  const briefReady = briefs.every((id) => validBrief(answers[id]))
  const scales = classes.map(([id, label, group]) => {
    const brief = answers[briefId(group, setup)]
    const ids = idsFor(id, setup)
    const use = answers[ids[0]]
    const skipped = validBrief(brief) && brief === 4
    const useNo = briefReady && !skipped && use === 0
    const complete = skipped || useNo || (briefReady && ids.every((key) => key === 'taps-other-detail' ? typeof answers[key] === 'string' : validYesNo(answers[key])))
    const sum = !complete || id === 'other' ? null : skipped || useNo ? 0 : ids.reduce((n, key) => n + answers[key], 0)
    return { id, label, status: complete ? 'scored' : 'incomplete', sum, min: 0, max: id === 'alcohol' ? 4 : 3,
      mean: null, stopRule: skipped ? 'No past-year use reported; follow-up not administered.' : useNo ? 'No past-three-month use reported; remaining items skipped.' : null,
      // Other drugs has one use question and a description; there is no validated
      // 0–3 score for this slot in the included form.
      note: id === 'other' ? complete ? skipped ? 'No past-year illicit drug use reported.' : useNo ? 'No other drug use reported in the past 3 months.' : 'Other drug use reported; assess directly. No numerical score.' : 'Incomplete.' :
        complete ? sum >= 2 ? 'Higher substance-specific score; prioritise clinical assessment. This is not a diagnosis.' : sum === 1 ? 'Use reported; review clinically, including harm at low frequency.' : 'Zero by the published use/skip rule; this does not exclude a problem.' : 'Incomplete.' }
  })
  return { scales, total: null, gateScore: null, gateMax: null, threshold: null, positive: null, band: null,
    opened: briefReady && briefs.some((id) => answers[id] !== 4), override: false,
    thresholdMet: briefReady ? briefs.some((id) => answers[id] !== 4) : null,
    status: briefReady && scales.every((row) => row.status === 'scored') ? 'scored' : 'incomplete',
    algorithm: 'taps' }
}
