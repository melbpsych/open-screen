/** Small validation helpers for the public data boundary. No coercion or merging. */
export function object(value, label, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError(`${label} must be a plain object`)
  for (const key of Object.keys(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key) || (keys && !keys.includes(key))) throw new TypeError(`${label}: unknown field ${key}`)
  }
  return value
}

export function text(value, label, max = 4000) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new TypeError(`${label} must be nonempty text (maximum ${max} characters)`)
  return value
}

export function identifier(value, label) {
  text(value, label, 80)
  if (!/^[a-z][a-z0-9-]*$/.test(value) || ["constructor", "prototype", "__proto__"].includes(value)) throw new TypeError(`${label} must use lowercase letters, digits and hyphens and cannot be a reserved property`)
  return value
}

export function number(value, label, min, max, integer = true) {
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value)) || value < min || value > max) throw new TypeError(`${label} must be ${integer ? "an integer" : "a number"} from ${min} to ${max}`)
  return value
}

export function list(value, label, max = 200) {
  if (!Array.isArray(value) || value.length > max) throw new TypeError(`${label} must be an array with at most ${max} entries`)
  return value
}

export function unique(values, label) {
  if (new Set(values).size !== values.length) throw new TypeError(`${label} contains duplicates`)
}

/** Exclusive upper bounds cover every integer, including the maximum score. */
export function bands(value, max, label) {
  list(value, label, 12)
  let previous = 0
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) throw new TypeError(`${label} needs [exclusiveUpperBound, label] pairs`)
    number(entry[0], label, previous + 1, max + 1)
    text(entry[1], label, 120)
    previous = entry[0]
  }
  if (value.length && previous !== max + 1) throw new TypeError(`${label} must cover all scores through ${max}`)
}

/** Configuration is copied before freezing; callers retain ownership of input. */
export function immutableCopy(value) {
  const copy = structuredClone(value)
  function freeze(node) {
    if (node && typeof node === "object") {
      Object.values(node).forEach(freeze)
      Object.freeze(node)
    }
    return node
  }
  return freeze(copy)
}
