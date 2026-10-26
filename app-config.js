/** Browser composition: only practice preferences persist. Responses, references
 * and clinical notes never enter this store. The SDK itself remains pure.
 */
import {
  validateJournal,
  emptyJournal,
  stageRevision,
  activateRevision,
  revisionState
} from './core/revisions.js'
import { createScreener } from './api.js'
import { questionnaires } from './questionnaires/registry.js'
import { restorePractice, practiceFields } from './core/practice.js'

export const PRACTICE_KEY = 'open-screen.practice-preferences.v1'
export const screener = createScreener({ questionnaires })
export const editableFields = practiceFields(screener)

function storage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function readPractice() {
  let raw = null
  try {
    raw = storage()?.getItem(PRACTICE_KEY) ?? null
    if (raw === null)
      return {
        screener,
        preferences: null,
        changes: [],
        raw,
        error: null,
        journal: emptyJournal(),
        legacy: false
      }
    if (raw.length > 100000)
      throw new TypeError('Saved preferences are too large')
    const parsed = JSON.parse(raw)
    if (parsed.schemaVersion !== 2)
      return {
        ...restorePractice(screener, parsed),
        raw,
        error: null,
        journal: emptyJournal(),
        legacy: true
      }
    const journal = validateJournal(screener, parsed)
    const result = revisionState(screener, journal)
    return { ...result, raw, error: null, journal, legacy: false }
  } catch {
    // Never substitute defaults for an unreadable policy in a clinical sitting.
    // The logic page can still show the defaults and offer an explicit reset.
    return {
      screener,
      preferences: null,
      changes: [],
      raw,
      journal: emptyJournal(),
      legacy: false,
      error:
        'Practice settings could not be loaded. Review or reset them on the screening logic page before starting a sitting.'
    }
  }
}

export function loadPracticeScreener() {
  const state = readPractice()
  if (state.error) throw new Error(state.error)
  return state.screener
}

function writeJournal(journal, expectedRaw) {
  const store = storage()
  if (!store) throw new Error('This browser cannot save practice settings.')
  if (store.getItem(PRACTICE_KEY) !== expectedRaw)
    throw new Error(
      'Settings changed in another tab. Reload the saved settings before saving.'
    )
  const serialized = JSON.stringify(journal)
  if (serialized.length > 100000)
    throw new Error('These settings exceed the browser settings limit.')
  revisionState(screener, journal) // Validate the exact active composition before committing the journal.
  store.setItem(PRACTICE_KEY, serialized)
  return readPractice()
}
function currentJournal(expectedRaw) {
  const state = readPractice()
  if (state.error || state.raw !== expectedRaw)
    throw new Error('Settings changed or need review. Reload before saving.')
  if (!state.legacy) return state.journal
  // Preserve legacy active values during migration, without inventing a reviewer.
  // The user reviews this draft before activation; staging alone must not revert
  // legacy settings. The logic UI handles migration via explicit activation.
  throw new Error(
    'Legacy preferences need review. Use Review legacy settings before creating another revision.'
  )
}
async function coordinatedWrite(operation) {
  if (!globalThis.navigator?.locks)
    throw new Error(
      'This browser cannot coordinate settings writes. Use a current browser with Web Locks support.'
    )
  // Firefox reports synchronous Web Locks callback exceptions to the console
  // even when the request promise is caught. Return an outcome from the lock;
  // reject only after leaving it, so expected conflicts/quota errors stay local.
  const outcome = await navigator.locks.request(
    'open-screen.practice-settings',
    { mode: 'exclusive' },
    () => {
      try {
        return { ok: true, value: operation() }
      } catch (error) {
        return { ok: false, error }
      }
    }
  )
  if (!outcome.ok) throw outcome.error
  return outcome.value
}
export async function savePractice(overrides, reason, expectedRaw, name) {
  const proposal = structuredClone({ overrides, reason, name })
  return coordinatedWrite(() =>
    writeJournal(
      stageRevision(screener, currentJournal(expectedRaw), proposal),
      expectedRaw
    )
  )
}
export async function reviewPractice(id, by, expectedRaw) {
  return coordinatedWrite(() => {
    const state = readPractice()
    if (state.legacy && id === 'legacy') {
      if (state.raw !== expectedRaw)
        throw new Error(
          'Settings changed in another tab. Reload before reviewing.'
        )
      const staged = stageRevision(screener, emptyJournal(), {
        overrides: state.preferences.overrides,
        reason: state.preferences.reason,
        name: 'Reviewed legacy settings'
      })
      return writeJournal(
        activateRevision(screener, staged, staged.revisions[0].id, by),
        expectedRaw
      )
    }
    return writeJournal(
      activateRevision(screener, currentJournal(expectedRaw), id, by),
      expectedRaw
    )
  })
}
export async function resetPractice(expectedRaw) {
  return coordinatedWrite(() => {
    const state = readPractice(),
      store = storage()
    if (!store)
      throw new Error('This browser cannot reset practice preferences.')
    if (store.getItem(PRACTICE_KEY) !== expectedRaw)
      throw new Error(
        'Settings changed in another tab. Reload the saved settings before resetting.'
      )
    if (state.error || state.legacy) {
      store.removeItem(PRACTICE_KEY)
      return readPractice()
    }
    const staged =
      state.journal.revisions.length < 20
        ? stageRevision(screener, state.journal, {
            overrides: {},
            reason: 'Restore published project defaults',
            name: 'Project defaults'
          })
        : state.journal
    return writeJournal({ ...staged, active: null }, expectedRaw)
  })
}
