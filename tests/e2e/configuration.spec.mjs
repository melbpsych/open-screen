import { startAssessment } from './helpers.mjs'
import { setupView } from './helpers.mjs'
import { readFile } from "node:fs/promises"
import { test, expect, configure, setupSitting, complete, openReview, downloadJSON, noOverflow, more } from "./helpers.mjs"

test("custom policy gates control routing and appear in the actual downloaded record", async ({ page }) => {
  await configure(page, (policy) => {
    policy.id = "synthetic-policy"
    policy.version = "e2e-1"
    policy.rationale = "Synthetic E2E policy, not a clinical recommendation."
    policy.thresholds.depression.gate = 3
  })
  await setupSitting(page, { topics: ["depression"] })
  const trace = await complete(page, (id) => id === "phq-1" ? 2 : 0)
  expect(trace).toHaveLength(2)
  await openReview(page)
  const record = await downloadJSON(page)
  expect(record.symptoms[0]).toMatchObject({ gateScore: 2, threshold: 3, total: null, status: "gate-closed" })
  expect(record.configuration.policy.id).toBe("synthetic-policy")
  await expect(page.locator('.clinical-results [data-domain="depression"] .score-graphic')).toHaveAttribute("aria-label", /threshold 3 or greater; not met/)
})

test("registered questionnaire is discovered, gated, scored, and exported using original codes", async ({ page }) => {
  const definition = JSON.parse(await readFile(new URL("../../examples/questionnaire.json", import.meta.url), "utf8"))
  await configure(page, (policy) => { policy.defaults.topics = [definition.id] }, definition)
  await page.goto("/interview.html")
  await page.getByRole("radio", { name: "Clinical", exact: true }).click()
  await expect(page.getByRole("button", { name: "Continue to Ready" })).toBeDisabled()
  await page.getByRole("checkbox", { name: "This is a synthetic development session, not patient care." }).check()
 await setupView(page, 'Measures')
  await startAssessment(page)
  const trace = await complete(page, (id) => id === "example-checkin-2" ? 2 : id === "example-checkin-1" ? 1 : 0)
  expect(trace.map((row) => row.id)).toEqual(["example-checkin-1", "example-checkin-2", "example-checkin-3"])
  await openReview(page)
  const record = await downloadJSON(page, { responses: true })
  expect(record.additional[0]).toMatchObject({ total: 4, gateScore: 1, status: "scored" })
  expect(record.responses["example-checkin-3"]).toBe(0)
  await expect(page.locator('.clinical-results [data-domain="example-checkin"] .score-graphic')).toHaveAttribute("data-value", "4")
})

test("long custom questionnaire labels fit setup, review and the offline report", async ({ page, context }) => {
  const definition = JSON.parse(await readFile(new URL("../../examples/questionnaire.json", import.meta.url), "utf8"))
  definition.label = "SyntheticLongQuestionnaireName".repeat(5)
  await configure(page, (policy) => { policy.defaults.topics = [definition.id] }, definition)
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto("/interview.html")
  await noOverflow(page)
  await page.getByRole("radio", { name: "Clinical", exact: true }).click()
  await noOverflow(page)
  await page.getByRole("checkbox").check()
 await setupView(page, 'Measures')
  await startAssessment(page)
  await complete(page, () => 0)
  await openReview(page)
  await noOverflow(page)
  const pending = page.waitForEvent("download")
  await more(page)
  await page.getByRole("button", { name: "Save report", exact: true }).click()
  const download = await pending
  const html = await readFile(await download.path(), "utf8")
  const report = await context.newPage()
  await report.setViewportSize({ width: 320, height: 800 })
  await report.setContent(html)
  await noOverflow(report)
})

test("invalid configuration gives a visible unavailable screen without partial clinical controls", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "expected-console-error", description: "Open Screen startup failed" })
  await configure(page, (policy) => { policy.thresholds.depression.gate = "not-a-number" })
  await page.goto("/interview.html")
  await expect(page.getByRole("heading", { name: "Screening is unavailable" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Start assessment" })).toHaveCount(0)
  await expect(page.locator("main")).toHaveAttribute("role", "alert")
})
