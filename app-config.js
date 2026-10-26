/** Browser composition: only practice preferences persist. Responses, references
 * and clinical notes never enter this store. The SDK itself remains pure.
 */
import { createScreener } from "./api.js"
import { questionnaires } from "./questionnaires/registry.js"
import { configurePractice, restorePractice, practiceFields } from "./core/practice.js"

export const PRACTICE_KEY = "open-screen.practice-preferences.v1"
export const screener = createScreener({ questionnaires })
export const editableFields = practiceFields(screener)

function storage() {
  return typeof window === "undefined" ? null : window.localStorage
}

export function readPractice() {
  let raw = null
  try {
    raw = storage()?.getItem(PRACTICE_KEY) ?? null
    if (raw === null) return { screener, preferences: null, changes: [], raw, error: null }
    if (raw.length > 100000) throw new TypeError("Saved preferences are too large")
    return { ...restorePractice(screener, JSON.parse(raw)), raw, error: null }
  } catch {
    // Never substitute defaults for an unreadable policy in a clinical sitting.
    // The logic page can still show the defaults and offer an explicit reset.
    return { screener, preferences: null, changes: [], raw, error: "Practice settings could not be loaded. Review or reset them on the screening logic page before starting a sitting." }
  }
}

export function loadPracticeScreener() {
  const state = readPractice()
  if (state.error) throw new Error(state.error)
  return state.screener
}

export function savePractice(overrides, reason, expectedRaw) {
  const result = configurePractice(screener, overrides, reason, new Date().toISOString())
  const store = storage()
  if (!store) throw new Error("This browser cannot save practice preferences.")
  if (store.getItem(PRACTICE_KEY) !== expectedRaw) throw new Error("Settings changed in another tab. Reload the saved settings before saving.")
  if (result.preferences) {
    const serialized = JSON.stringify(result.preferences)
    if (serialized.length > 100000) throw new Error("These preferences exceed the browser settings limit.")
    store.setItem(PRACTICE_KEY, serialized)
  }
  else store.removeItem(PRACTICE_KEY)
  return readPractice()
}

export function resetPractice(expectedRaw) {
  const store = storage()
  if (!store) throw new Error("This browser cannot reset practice preferences.")
  if (store.getItem(PRACTICE_KEY) !== expectedRaw) throw new Error("Settings changed in another tab. Reload the saved settings before resetting.")
  store.removeItem(PRACTICE_KEY)
  return readPractice()
}
