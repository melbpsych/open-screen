/** Known fixed-form totals. Entries remain observations, never imported items. */
export const externalTotals = Object.freeze({
  phq9: { min: 0, max: 27 }, gad7: { min: 0, max: 21 },
  scoff: { min: 0, max: 5 }, sleep: { min: 0, max: 28 },
  fourat: { min: 0, max: 12 }, epds: { min: 0, max: 30 }
})
export function externalTotalError(id, value) {
  const range = externalTotals[id]
  if (!range || value == null || value === '') return ''
  const valid = typeof value === 'number' ? Number.isInteger(value)
    : typeof value === 'string' && /^\d+$/.test(value)
  return valid && Number(value) >= range.min && Number(value) <= range.max
    ? '' : `Enter a whole-number ${id} total from ${range.min} to ${range.max}, or leave it blank.`
}
export function validateExternalTotals(entered) {
  for (const [id, value] of Object.entries(entered)) {
    const error = externalTotalError(id, value)
    if (error) throw new TypeError(error)
  }
}
