import { test as base, expect } from "@playwright/test"
import { readFile } from "node:fs/promises"

export { expect }

/** Every successful flow must also be free of uncaught exceptions, console
 * errors, failed assets and unexpected outbound requests. No real patient data.
 */
export const test = base.extend({
  page: async ({ page, context, baseURL }, use, testInfo) => {
    const errors = []
    const inspect = (tab) => {
      tab.on("pageerror", (error) => errors.push(error.message))
      tab.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
      tab.on("requestfailed", (request) => errors.push(`Failed asset: ${request.url()}`))
      tab.on("response", (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`) })
      tab.on("request", (request) => {
        if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL).origin) errors.push(`Unexpected outbound request: ${request.url()}`)
      })
    }
    inspect(page)
    context.on("page", inspect)
    await use(page)
    const allowed = testInfo.annotations.filter((row) => row.type === "expected-console-error").map((row) => row.description)
    const unexpected = errors.filter((error) => !allowed.some((fragment) => error.includes(fragment)))
    expect.soft(unexpected, "Browser diagnostics").toEqual([])
  },
})

export async function setupSitting(page, { topics, context = "Clinical", alcoholThreshold = 3, reference } = {}) {
  await page.goto("/interview.html")
  await expect(page.getByRole("heading", { name: "New assessment", exact: true })).toBeVisible()
  await page.getByRole("radio", { name: context, exact: true }).click()
  if (topics) {
    const available = await page.locator("[data-focus-key]").evaluateAll((nodes) => nodes.map((node) => node.dataset.focusKey))
    for (const id of available) {
      const button = page.locator(`[data-focus-key="${id}"]`)
      if ((await button.getAttribute("aria-pressed") === "true") !== topics.includes(id)) await button.click()
    }
  }
  if (topics?.includes("alcohol")) {
    await page.getByRole("checkbox", { name: "No fee is charged to complete this questionnaire." }).check()
    await page.getByRole("radio", { name: `≥${alcoholThreshold}`, exact: true }).click()
  }
  if (topics?.includes("irritability")) {
    for (const name of ["A defined patient or research group.", "Scores go to the clinician, not the respondent.", "The scale is not sold."]) await page.getByRole("checkbox", { name }).check()
  }
  if (reference) await page.getByRole("textbox", { name: "Reference (optional)" }).fill(reference)
  await expect(page.getByRole("button", { name: "Continue to Ready" })).toBeEnabled()
  await startAssessment(page)
}

export async function answer(page, option = 0) {
  const id = await page.locator("#main").getAttribute("data-step")
  const text = page.locator("#event-text")
  if (await text.count()) {
    await text.fill(typeof option === "string" ? option : "Synthetic event for browser testing")
    await page.getByRole("button", { name: "Continue", exact: true }).click()
  }
  else await page.getByRole("radio").nth(option).click()
  await expect(page.locator("#main")).not.toHaveAttribute("data-step", id)
  return id
}

export async function complete(page, choose = (id) => id === "pcptsd-exposure" ? 1 : 0) {
  const trace = []
  for (let i = 0; i < 220 && ["question","followups"].includes(await page.locator("#main").getAttribute("data-screen")); i++) {
    if (await page.locator("#main").getAttribute("data-screen") === "followups") {
      await page.getByRole("button", { name: "Continue with selected", exact: true }).click()
      continue
    }
    const id = await page.locator("#main").getAttribute("data-step")
    const stage = await page.locator(".question-topline .kicker").textContent()
    trace.push({ id, stage })
    await answer(page, choose(id))
  }
  await expect(page.locator("#main")).toHaveAttribute("data-screen", "handoff")
  return trace
}

export function allPositive(id) {
  if (id === "phq-1" || id === "gad-1") return 2
  if (/^phq-[3-8]$|^gad-[3-7]$|^audit-[123]$|^pcl-/.test(id)) return 1
  if (/^pcptsd-[45]$/.test(id)) return 1
  return 0
}

export async function openReview(page, { documentation = true } = {}) {
  await page.getByRole("button", { name: "Review clinician record" }).click()
  await expect(page.locator("#main")).toHaveAttribute("data-screen", "record")
  if (documentation) await recordDetails(page)
}

export async function recordDetails(page) {
  const details = page.locator(".record-details")
  if (!await details.evaluate(node => node.open)) await details.locator(":scope > summary").click()
}

export async function more(page) {
  if (!await page.locator(".export-menu").evaluate((node) => node.open)) await page.locator(".export-menu > summary").click()
}

export async function downloadJSON(page, { responses = false } = {}) {
  await more(page)
  await page.getByRole("checkbox", { name: "Include response appendix" }).setChecked(responses)
  const downloaded = page.waitForEvent("download")
  await page.getByRole("button", { name: "Save structured JSON" }).click()
  const download = await downloaded
  expect(download.suggestedFilename()).toMatch(/^open-screen-\d{4}-\d{2}-\d{2}\.json$/)
  expect(await download.failure()).toBeNull()
  return JSON.parse(await readFile(await download.path(), "utf8"))
}

export async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow").toBe(true)
}

export async function configure(page, change, definition) {
  const original = JSON.parse(await readFile(new URL("../../config/policy.json", import.meta.url), "utf8"))
  change(original)
  await page.route("**/config/policy.json", (route) => route.fulfill({ json: original }))
  if (definition) {
    await page.route("**/questionnaires/registry.js", (route) => route.fulfill({ contentType: "text/javascript", body: 'import definition from "./e2e-example.json" with { type: "json" }; export const questionnaires = [definition]' }))
    await page.route("**/questionnaires/e2e-example.json", (route) => route.fulfill({ json: definition }))
  }
}

export async function setupView(page, name) {
  await expect(page.locator("#main")).toHaveAttribute("data-screen", /setup|record|question|safety|handoff/)
  if (await page.locator('[data-screen="setup"]').count()) {
    await workspaceMenu(page)
    await page.getByRole('navigation', { name: 'Assessment setup', exact: true }).getByRole('button', { name, exact: true }).click()
  }
}

export async function workspaceMenu(page) {
  const menu = page.locator('.workspace-menu')
  await expect(menu).toBeVisible()
  if (!await menu.evaluate(node => node.open)) await menu.locator(':scope > summary').click()
}

export async function workspaceAction(page, name) {
  await expect(page.locator('#main[data-screen]')).toBeVisible()
  const button = page.getByRole('button', { name, exact: true })
  if (!await button.isVisible() && await page.locator('.workspace-menu').count()) await workspaceMenu(page)
  await button.click()
}

/** The selected design has a separate Ready step before the first response. */
export async function startAssessment(page) {
  const ready = page.getByRole('button', { name: 'Continue to Ready', exact: true })
  if (await ready.isVisible()) await ready.click()
  await page.getByRole('button', { name: 'Start assessment', exact: true }).click()
}

export async function riskDetails(page) {
 await recordDetails(page)
 for(const selector of ['.risk-notes','.risk-details']) {
  if(!await page.locator(selector).evaluate(n=>n.open)) await page.locator(selector+' > summary').click()
 }
}
