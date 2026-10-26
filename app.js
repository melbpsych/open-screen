import { profile, summaryText } from "./core/score.js"
import { findMeasure, measures } from "./measures/registry.js"
import { copyText, focusMain, footer, h, header, icon, installStyles, markup, wireRadios } from "./ui.js"
import { distributionChart, presentationStyles } from "./presentation.js"

installStyles(presentationStyles)

const app = document.querySelector("#app")
const answers = new Map()
let copied = false
let shownHash = location.hash

function route() {
  const raw = location.hash.replace(/^#/, "") || "/"
  const [path, preview] = raw.split("/preview/")
  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) return { name: "home" }
  return { name: "measure", id: parts[0], preview: preview || null }
}

function setTitle(text) {
  document.title = text ? `${text} · Open Screen` : "Open Screen"
}

function home() {
  setTitle("")
  const list = measures.map((measure) => h("article", { class: "card measure-card" },
    h("a", { class: "measure-link", href: `#/${measure.id}` },
      h("div", { class: "card-topline" }, h("span", { class: "tool-icon" }, icon("sliders")), h("span", { class: "pill" }, licenseLabel(measure.license))),
      h("p", { class: "kicker" }, "Personality · IPIP"),
      h("h2", null, measure.title),
      h("p", null, `${measure.items.length} trait markers, each read separately against a public reference sample.`),
      h("div", { class: "meta" },
        h("span", null, icon("clock"), `About ${measure.minutes} minute`),
        h("span", null, `${measure.items.length} questions`),
      ),
      h("div", { class: "card-cta" }, "Start screening", icon("arrow")),
    ),
  ))
  app.replaceChildren(h("div", { class: "wrap library-wrap" },
    header(),
    h("main", { id: "main", tabindex: "-1" },
      h("section", { class: "hero" },
        h("div", { class: "hero-copy" },
          h("p", { class: "eyebrow" }, h("span", { class: "status-dot" }), "For psychology practice"),
          h("h1", null, "Clinical screening,", h("br"), h("em", null, "step by step.")),
          h("p", { class: "lede" }, "Brief screens first. Published follow-ups when indicated. A clear clinical record."),
          h("div", { class: "hero-actions" },
            h("a", { class: "primary-link", href: "interview.html" }, "New sitting", icon("arrow")),
            h("a", { class: "secondary-link", href: "#/", onClick: (event) => { event.preventDefault(); document.getElementById("tools").scrollIntoView() } }, "View all tools"),
          ),
          h("p", { class: "hero-note" }, "Adult clinical and forensic settings · Scored locally"),
        ),
        screeningIllustration(),
      ),
      h("section", { class: "tools-section", id: "tools", "aria-labelledby": "tools-title" },
        h("div", { class: "section-heading" }, h("h2", { id: "tools-title" }, "Screening tools")),
        h("div", { class: "tool-grid" },
          h("article", { class: "card clinical-card" },
            h("a", { class: "measure-link", href: "interview.html" },
              h("div", { class: "card-topline" }, h("span", { class: "tool-icon" }, icon("layers")), h("span", { class: "pill" }, "For clinicians")),
              h("p", { class: "kicker" }, "Two stages"),
              h("h2", null, "Clinical sitting"),
              h("p", null, "Depression, anxiety, alcohol and trauma. Choose the areas relevant to this assessment."),
              h("div", { class: "meta" }, h("span", null, "Clinical & forensic settings"), h("span", null, "Two-stage screening")),
              h("div", { class: "card-cta" }, "Set up a sitting", icon("arrow")),
            ),
          ),
          ...list,
        ),
      ),
    ),
    footer(),
  ))
}

function screeningIllustration() {
  return h("aside", { class: "profile-preview", "aria-label": "The two-stage clinical screening pathways" },
    h("div", { class: "preview-heading" }, h("span", { class: "kicker" }, "Clinical & forensic settings"), icon("sliders")),
    h("p", { class: "preview-title" }, "Brief screen → follow-up"),
    h("div", { class: "preview-traits" },
      ...[
        ["Depression", "PHQ-2", "PHQ-9"],
        ["Anxiety", "GAD-2", "GAD-7"],
        ["Alcohol", "AUDIT-C", "AUDIT"],
        ["Trauma", "PC-PTSD-5", "PCL-5"],
      ].map(([name, brief, full]) => h("div", { class: "preview-trait" },
        h("span", null, name),
        h("span", { class: "preview-path" }, h("span", null, brief), icon("arrow"), h("strong", null, full)),
      )),
    ),
    h("div", { class: "preview-bottom" }, h("a", { href: "logic.html" }, "View screening logic →")),
  )
}

function licenseLabel(license) {
  if (license === "public-domain") return "Public domain"
  return license
}

function measureView(id, preview) {
  const measure = findMeasure(id)
  if (!measure) {
    setTitle("Not found")
    app.replaceChildren(h("main", { class: "wrap", id: "main" },
      header(),
      h("h1", null, "That screen is not in the library."),
      h("p", null, h("a", { href: "#/" }, "Back to the library")),
    ))
    return
  }
  if (preview) fillPreview(measure, preview)
  setTitle(measure.title)
  const answered = measure.items.filter((item) => answers.has(item.id)).length
  app.replaceChildren(h("div", { class: "wrap screen-wrap" },
    header(),
    h("main", { id: "main", tabindex: "-1", class: "measure-main" },
    h("a", { class: "back", href: "#/" }, icon("back"), "All tools"),
    h("div", { class: "screen-intro" },
      h("p", { class: "kicker" }, `Personality · ${measure.items.length} questions · About ${measure.minutes} minute`),
      h("h1", null, measure.title),
      h("p", { class: "lede" }, "Read each sentence and choose the answer that feels most like you. There are no right or wrong answers."),
    ),
    h("div", { class: "screen-progress" },
      h("span", null, "Your responses"),
      h("span", { class: "progress", id: "progress", role: "status", "aria-live": "polite" }, `${answered} of ${measure.items.length} answered`),
      h("progress", { id: "answer-progress", value: answered, max: measure.items.length, "aria-label": "Questions answered" }),
    ),
    h("div", { class: "caution" }, h("strong", null, measure.notFor), " Answers stay in this tab."),
    h("p", { class: "sr-only", id: "profile-status", role: "status", "aria-live": "polite", "aria-atomic": "true" }),
    preview ? h("p", { class: "preview-flag" }, "Sample answers are filled in so the result can be reviewed. Clear them before a real use.") : null,
    ...measure.items.map((item, index) => itemCard(measure, item, index)),
    resultsSection(measure),
    noteCard(measure),
    ),
    footer(),
  ))
}

function fillPreview(measure, name) {
  const patterns = {
    low: [1, 1, 1, 1, 1],
    high: [5, 5, 5, 5, 5],
    mixed: [4, 5, 1, 2, 3],
  }
  const pattern = patterns[name]
  if (!pattern) return
  measure.items.forEach((item, index) => answers.set(item.id, pattern[index]))
}

function itemCard(measure, item, index) {
  const raw = answers.get(item.id)
  return h("article", { class: "item", id: `item-${item.id}` },
    h("div", { class: "item-heading" }, h("p", { class: "construct" }, item.construct), h("span", { class: "item-number" }, `${String(index + 1).padStart(2, "0")} / ${String(measure.items.length).padStart(2, "0")}`)),
    h("h2", null, item.text),
    h("div", {
      class: "response",
      role: "radiogroup",
      "aria-label": item.text,
    },
      ...measure.responseOptions.map((option) => h("button", {
        type: "button",
        role: "radio",
        checked: raw === option.value,
        "aria-label": option.value === 2 || option.value === 4
          ? `${option.value}, between the labeled points`
          : `${option.value}, ${option.label}`,
        onClick: () => choose(measure, item, option.value),
      }, String(option.value))),
    ),
    h("div", { class: "anchors", "aria-hidden": "true" },
      h("span", null, "Disagree"),
      h("span", null, ""),
      h("span", null, "Neutral"),
      h("span", null, ""),
      h("span", null, "Agree"),
    ),
  )
}

function choose(measure, item, value) {
  const wasReady = profile(measure, Object.fromEntries(answers)).ready
  answers.set(item.id, value)
  copied = false
  const card = document.getElementById(`item-${item.id}`)
  const buttons = card.querySelectorAll("button")
  buttons.forEach((button, index) => {
    button.setAttribute("aria-checked", measure.responseOptions[index].value === value ? "true" : "false")
  })
  const answered = measure.items.filter((entry) => answers.has(entry.id)).length
  document.getElementById("progress").textContent = `${answered} of ${measure.items.length} answered`
  document.getElementById("answer-progress").value = answered
  card.classList.add("answered")
  const next = resultsSection(measure)
  document.getElementById("results").replaceWith(next)
  buttons[value - 1].focus()
  wireRadios()
  // Keep the response and keyboard focus in view when results become available.
  if (!wasReady && next.dataset.ready === "true") document.getElementById("profile-status").textContent = "Your personality profile is ready below the questions."
}

function resultsSection(measure) {
  const view = profile(measure, Object.fromEntries(answers))
  if (!view.ready) {
    const total = measure.items.length
    const answered = measure.items.filter((item) => answers.has(item.id)).length
    return h("section", { class: "summary pending-results", id: "results", "aria-label": "Your profile" },
      icon("sliders"),
      h("h2", null, "Your profile"),
      h("p", null, `Your profile appears after all ${total} answers. ${total - answered} ${total - answered === 1 ? "question" : "questions"} to go.`),
    )
  }
  const histogram = view.groups.every((group) => group.comparison?.kind === "distribution")
  return h("section", { class: "summary results", id: "results", "data-ready": "true", "aria-labelledby": "profile-title" },
    h("p", { class: "kicker" }, "Your profile · All questions answered"),
    h("h2", { id: "profile-title" }, "Personality profile"),
    h("p", { class: "quiet" }, `${view.groups.length} separate readings, compared with a public reference sample.`),
    histogram ? histogramView(measure, view) : scaleProfile(view),
    h("details", { class: "profile-interpretation" }, h("summary", null, "Profile interpretation"), h("p", { class: "analysis" }, view.analysis)),
    h("div", { class: "actions" },
      h("button", { type: "button", class: "primary", onClick: () => copySummary(measure) }, "Copy summary"),
      h("button", { type: "button", onClick: () => window.print() }, "Print"),
      h("button", { type: "button", onClick: clearAnswers }, "Clear"),
    ),
  )
}

function histogramView(measure, view) {
  return markup(distributionChart(view))
}

function scaleProfile(view) {
  return h("div", { class: "scale-list" },
    ...view.groups.map((group) => h("div", { class: "scale-row" },
      h("div", { class: "result-head" },
        h("p", { class: "construct" }, group.label),
        h("p", { class: "cat" }, group.headline),
      ),
      scaleView(group.comparison),
    )),
  )
}

function scaleView(comparison) {
  const span = comparison.max - comparison.min || 1
  const at = Math.min(100, Math.max(0, ((comparison.value - comparison.min) / span) * 100))
  const described = comparison.regions.map((region) => (
    region.selected ? `${region.label}, this result` : region.label
  )).join(", ")
  return h("div", { class: "compare" },
    h("div", {
      class: "scale",
      role: "img",
      "aria-label": `${comparison.caption} Score ${comparison.value}. ${described}.`,
    },
      h("div", { class: "scale-track" },
        ...comparison.regions.map((region) => h("span", {
          class: region.selected ? "region on" : "region",
          style: `flex:${Math.max(region.to - region.from, 0.001)} 1 0`,
        })),
        h("i", { class: "marker", style: `left:${at}%` }),
      ),
      h("div", { class: "scale-ends", "aria-hidden": "true" },
        h("span", null, String(comparison.min)),
        h("span", null, comparison.category?.label || ""),
        h("span", null, String(comparison.max)),
      ),
    ),
  )
}

function noteCard(measure) {
  return h("details", { class: "note profile-method" },
    h("summary", null, "Sources & interpretation"),
    h("p", null, measure.source.selection),
    h("p", null, measure.scaleNote),
    h("p", null, "Norms are the answer frequencies in the Open-Source Psychometrics release of the IPIP Big Five markers, collected online from 2016 to 2018. They describe that volunteer sample. They are not clinic norms, applicant norms, or forensic norms. The result is a category. Categories follow the cutoffs declared in the measure definition. The screen names that category and shows how common each answer was."),
    h("p", null, "Single sentences can point at a trait. They do not measure a facet fully, and they have no test–retest estimate in this file. Longer Big Five scales remain the right instrument when a decision depends on the score."),
    h("p", { class: "footnote" },
      "Items: ",
      h("a", { href: measure.source.itemsUrl }, "IPIP Big Five factor markers"),
      ". Norms file: ",
      h("a", { href: measure.source.normsUrl }, "IPIP-FFM, 8 November 2018"),
      ". The paper next to this app is PAPER.md.",
    ),
  )
}

async function copySummary(measure) {
  const snapshot = JSON.stringify([...answers])
  const text = summaryText(measure, Object.fromEntries(answers))
  const button = document.querySelector(".actions .primary")
  const previous = button.textContent
  const success = await copyText(text)
  copied = success && snapshot === JSON.stringify([...answers]) && route().id === measure.id
  button.textContent = copied ? "Copied" : success ? "Copy again for latest edits" : "Use Print to save your summary"
  setTimeout(() => { button.textContent = previous }, 1600)
}

function clearAnswers() {
  answers.clear()
  copied = false
  const current = route()
  if (current.preview) location.hash = `#/${current.id}`
  else draw()
}

function draw() {
  const current = route()
  if (current.name === "home") {
    answers.clear()
    home()
    focusMain()
    return
  }
  measureView(current.id, current.preview)
  wireRadios()
  focusMain()
}

document.querySelector(".skip").addEventListener("click", (event) => { event.preventDefault(); document.querySelector("#main").focus() })
// A hash change does not trigger beforeunload. Protect in-app navigation too.
window.addEventListener("hashchange", () => {
  if (answers.size && !copied && !shownHash.includes("/preview/") && !window.confirm("Leave this screen? Copy or print first. Current answers will be cleared.")) {
    history.replaceState(null, "", shownHash || "#/")
    return
  }
  answers.clear()
  copied = false
  shownHash = location.hash
  draw()
})
window.addEventListener("beforeunload", (event) => {
  if (!answers.size || copied || route().preview) return
  event.preventDefault()
  event.returnValue = ""
})
draw()
