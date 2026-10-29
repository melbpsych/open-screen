/** Small, shared browser primitives. No storage, network calls, or scoring. */
export function h(tag, props, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props || {})) {
    if (key === "checked" || key === "pressed") {
      node.setAttribute(key === "checked" ? "aria-checked" : "aria-pressed", String(!!value))
    } else if (value == null || value === false) continue
    else if (key === "class") node.className = value
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value)
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue
    node.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return node
}

const paths = {
  save: "M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8",
  resume: "M3 12a9 9 0 1 0 3-6M3 3v6h6M12 7v5l3 2",
  copy: "M8 8h13v13H8V8ZM16 8V3H3v13h5",
  print: "M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6v-7",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  list: "M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1",

  arrow: "M4 12h16M14 6l6 6-6 6",
  back: "M20 12H4m6-6-6 6 6 6",
  check: "m5 12 4 4L19 6",
  shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6",
  layers: "m12 3 10 6-10 6L2 9l10-6ZM2 13l10 6 10-6M2 17l10 6 10-6",
  sliders: "M4 7h6m4 0h6M4 17h10m4 0h2M10 4v6m4 4v6",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  book: "M12 5C8 2 3 3 3 3v16s5-1 9 2m0-16c4-3 9-2 9-2v16s-5-1-9 2V5Z",
  lock: "M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4",
}

export function icon(name, className = "icon") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  for (const [key, value] of Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: className })) svg.setAttribute(key, value)
  const path = document.createElementNS(svg.namespaceURI, "path")
  path.setAttribute("d", paths[name] || paths.arrow)
  svg.append(path)
  return svg
}

export function header(extra, active = "library", { navigation = true, homeLink = true } = {}) {
  return h("header", { class: "top" },
    h(homeLink ? "a" : "span", { class: "brand", href: homeLink ? "index.html#/" : null, "aria-label": homeLink ? "openscreen home" : "openscreen" },
      h("span", { class: "brand-mark", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
      "open", h("strong", null, "screen"),
    ),
    navigation ? h("nav", { class: "top-nav", "aria-label": "Main navigation" },
      h("a", { href: "index.html#/", "aria-current": active === "library" ? "page" : null }, "Home"),
      h("a", { href: "interview.html", "aria-current": active === "interview" ? "page" : null }, "Assessment"),
      h("a", { href: "logic.html", "aria-current": active === "logic" ? "page" : null }, "Logic"),
      h("a", { href: "help.html", target: active === "interview" ? "_blank" : null, rel: active === "interview" ? "noopener noreferrer" : null }, active === "interview" ? "Help ↗" : "Help"),
    ) : null,
    extra || h("p", { class: "privacy" }, icon("lock"), "On this device"),
  )
}

export function footer() {
  return h("footer", { class: "site-footer" },
    h("p", null, "Open Screen"),
    h("p", null, "Answers stay in this tab. Export before closing."),
  )
}

/** Only use with escaped markup from the presentation module. */
export function markup(html) {
  const template = document.createElement("template")
  template.innerHTML = html
  return template.content
}

export function installStyles(css, id = "presentation-styles") {
  if (document.getElementById(id)) return
  const style = h("style", { id }, css)
  document.head.append(style)
}

export function focusMain() {
  const main = document.querySelector("#main")
  const heading = main?.querySelector("h1")
  if (heading) heading.tabIndex = -1
  // Announce the new screen, without reading the workspace navigation again.
  const target = heading || main
  target?.focus({ preventScroll: true })
  window.scrollTo(0, 0)
}

let validationId = 0
/** Field feedback adds to existing instructions, never to the field's label.
 * Clinical/business rules stay in their validators; this renders their feedback.
 */
export function setFieldError(field, message = '') {
  if (!field.id) field.id = 'validation-field-' + ++validationId
  const id = field.id + '-error'
  let note = document.getElementById(id)
  const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean))
  if (message) {
    if (!note) {
      note = h('p', { id, class: 'field-error', role: 'alert' })
      const anchor = field.closest('label') || field
      anchor.after(note)
    }
    note.textContent = message
    field.setAttribute('aria-invalid', 'true')
    descriptions.add(id)
  } else {
    note?.remove()
    field.removeAttribute('aria-invalid')
    descriptions.delete(id)
  }
  if (descriptions.size) field.setAttribute('aria-describedby', [...descriptions].join(' '))
  else field.removeAttribute('aria-describedby')
}

/** Delegation also covers dynamically replaced review/recovery forms. Native
 * constraints remain authoritative, with persistent inline errors instead of
 * browser bubbles. Untouched fields are not marked invalid on first render.
 */
export function wireFormValidation(root = document) {
  root.addEventListener('invalid', event => {
    const field = event.target
    if (!field.matches('input, textarea, select')) return
    event.preventDefault()
    setFieldError(field, field.validationMessage)
    if (field.form?.querySelector('input:invalid, textarea:invalid, select:invalid') === field) {
      for (let parent = field.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true
      field.focus()
    }
  }, true)
  root.addEventListener('input', event => {
    const field = event.target
    if (!field.matches('input, textarea, select') || !field.form || !field.willValidate) return
    setFieldError(field, field.validity.valid ? '' : field.validationMessage)
  })
}

/** Keep desktop popovers inside the actual viewport. Phone/short-window
 * panels use their fixed CSS layout instead; no document-wide resize redraw. */
export function positionExportPanel(menu) {
  const panel = menu.querySelector('.export-options')
  if (!panel || !menu.open) return
  if (getComputedStyle(panel).position === 'fixed') {
    panel.style.maxHeight = ''; panel.classList.remove('export-above'); return
  }
  const rect = menu.querySelector('summary').getBoundingClientRect()
  const below = Math.max(0, innerHeight - rect.bottom - 16)
  const above = Math.max(0, rect.top - 16)
  const flip = below < 280 && above > below
  panel.classList.toggle('export-above', flip)
  panel.style.maxHeight = Math.min(640, Math.max(80, flip ? above : below)) + 'px'
}

/** Native disclosures keep their usual keyboard behavior. A floating export
 * panel also closes on Escape or leaving it, so it cannot cover the next field.
 */
export function wireExportDisclosure(root = document) {
  window.addEventListener('resize', () => { const menu = root.querySelector('.export-menu[open]'); if (menu) positionExportPanel(menu) })
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.target.closest?.("dialog[open]")) return
    const panel = root.querySelector(".export-menu[open]")
    if (!panel) return
    event.preventDefault()
    panel.open = false
    panel.querySelector("summary")?.focus()
  })
  for (const type of ["pointerdown", "focusin"]) root.addEventListener(type, (event) => {
    const panel = root.querySelector(".export-menu[open]")
    if (panel && !panel.contains(event.target)) panel.open = false
  })
}

/** A radio group has one tab stop; arrows, Home/End, and numbers select. */
export function wireRadios(root = document) {
  root.querySelectorAll('[role="radiogroup"]').forEach((group, groupIndex) => {
    const radios = [...group.querySelectorAll('[role="radio"]')]
    const selected = radios.findIndex((radio) => radio.getAttribute("aria-checked") === "true")
    radios.forEach((radio, index) => { radio.tabIndex = index === Math.max(0, selected) ? 0 : -1 })
    if (group.dataset.wired) return
    group.dataset.wired = "true"
    group.addEventListener("keydown", (event) => {
      const current = radios.indexOf(document.activeElement)
      if (current < 0 || event.altKey || event.ctrlKey || event.metaKey) return
      let next
      if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (current + 1) % radios.length
      else if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = (current - 1 + radios.length) % radios.length
      else if (event.key === "Home") next = 0
      else if (event.key === "End") next = radios.length - 1
      else if (/^[1-9]$/.test(event.key) && Number(event.key) <= radios.length) next = Number(event.key) - 1
      else return
      event.preventDefault()
      event.stopPropagation()
      radios[next].click()
      // Auto-advancing screens own the new heading's focus. Do not focus an
      // option at the same index in a different question after this click.
      if (!group.isConnected) return
      const liveGroup = root.querySelectorAll('[role="radiogroup"]')[groupIndex]
      const liveRadios = liveGroup?.querySelectorAll('[role="radio"]')
      liveRadios?.[next]?.focus({ preventScroll: true })
      wireRadios(root)
    })
  })
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const focused = document.activeElement
    let area
    try {
      area = h("textarea", { readonly: "", class: "clipboard-fallback", "aria-label": "Summary to copy" }, text)
      document.body.append(area)
      area.select()
      return document.execCommand?.("copy") === true
    } catch {
      return false
    } finally {
      area?.remove()
      if (focused?.isConnected) focused.focus({ preventScroll: true })
    }
  }
}
