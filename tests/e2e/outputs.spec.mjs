import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"
import { test, expect, setupSitting, complete, openReview, more, downloadJSON, noOverflow } from "./helpers.mjs"

test("offline report download includes current notes and safely renders untrusted text", async ({ page, context }, testInfo) => {
  await setupSitting(page, { reference: 'SYNTHETIC <img src=x onerror="alert(1)">' })
  await complete(page)
  await openReview(page)
  const notes = 'Synthetic note </p><script>alert("x")</script> & clinical follow-up.'
  await page.getByRole("textbox", { name: "Formulation & follow-up" }).fill(notes)
  const pending = page.waitForEvent("download")
  await page.getByRole("button", { name: "Save report", exact: true }).click()
  const download = await pending
  const path = testInfo.outputPath("synthetic-report.html")
  await download.saveAs(path)
  const html = await readFile(path, "utf8")
  expect(html).not.toMatch(/<script|<img|<link|<iframe/)
  expect(html).toContain("&lt;script&gt;")
  const report = await context.newPage()
  await report.goto(pathToFileURL(path).href)
  await expect(report.locator(".report-notes")).toHaveText(notes)
  await expect(report.locator(".score-graphic")).toHaveCount(3)
  await expect(report.locator(".report-sources")).toHaveAttribute("open", "")
  await expect(report.locator(".report-appendix")).toHaveCount(0)
  await report.setViewportSize({ width: 320, height: 800 })
  await noOverflow(report)
  await report.emulateMedia({ media: "print" })
  await expect(report.locator(".panel-evidence").first()).toBeHidden()
  await expect(report.locator(".report-sources li").first()).toBeVisible()
})

test("the response appendix is explicit in JSON and HTML exports", async ({ page, context }) => {
  await setupSitting(page)
  await complete(page)
  await openReview(page)
  const brief = await downloadJSON(page)
  expect(brief).not.toHaveProperty("responses")
  const full = await downloadJSON(page, { responses: true })
  expect(full.responses).toEqual({ "phq-1": 0, "phq-2": 0, "gad-1": 0, "gad-2": 0, "pcptsd-exposure": "no" })
  expect(full.text).toContain("Response record")
  await page.locator(".export-menu > summary").click()
  const pending = page.waitForEvent("download")
  await page.getByRole("button", { name: "Save report", exact: true }).click()
  const downloaded = await pending
  const html = await readFile(await downloaded.path(), "utf8")
  expect(html).toContain('class="report-appendix"')
  const report = await context.newPage()
  await report.setContent(html)
  await expect(report.getByRole("heading", { name: "Full record & response appendix" })).toBeVisible()
})

test("clipboard denial and an unavailable fallback give feedback without losing the record", async ({ page }) => {
  await setupSitting(page)
  await complete(page)
  await openReview(page)
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Synthetic clipboard denial") } } })
    document.execCommand = () => { throw new Error("Synthetic fallback unavailable") }
  })
  await page.getByRole("button", { name: "Copy summary", exact: true }).click()
  await expect(page.locator("#export-status")).toContainText("Copy unavailable")
  await expect(page.locator("#main")).toHaveAttribute("data-screen", "record")
  await expect(page.locator(".clipboard-fallback")).toHaveCount(0)
})

test("an edit during asynchronous copy keeps the newer record marked unsaved", async ({ page }) => {
  await setupSitting(page)
  await complete(page)
  await openReview(page)
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (text) => { window.syntheticCopied = text; return new Promise((resolve) => { window.finishSyntheticCopy = resolve }) } } })
  })
  await page.getByRole("button", { name: "Copy summary", exact: true }).click()
  await page.getByRole("textbox", { name: "Formulation & follow-up" }).fill("Synthetic note entered during copy")
  await page.evaluate(() => window.finishSyntheticCopy())
  await expect(page.locator("#export-status")).toContainText("earlier version")
  await expect(page.locator("#copy-record")).toHaveText("Copy summary")
  expect((await downloadJSON(page)).clinician.facts).toContain("during copy")
})

test("external interview text has the same length limit as the integration boundary", async ({ page }) => {
  await setupSitting(page)
  await complete(page)
  await openReview(page)
  await page.locator(".review-checks > summary").click()
  await page.getByRole("radiogroup", { name: "Any indication of harm to a specified person", exact: true }).getByRole("radio", { name: "Yes", exact: true }).click()
  const field = page.getByRole("textbox", { name: "Target", exact: true })
  await expect(field).toHaveAttribute("maxlength", "4000")
  await field.fill("x".repeat(4100))
  await page.getByRole("radio", { name: "Reviewed in interview", exact: true }).click()
  const record = await downloadJSON(page)
  for (const text of Object.values(record.clinician.flags)) expect(String(text).length).toBeLessThanOrEqual(4000)
})

test("a cancelled new-sitting confirmation preserves responses and clinical notes", async ({ page }) => {
  await setupSitting(page, { reference: "SYNTHETIC-KEEP" })
  await complete(page)
  await openReview(page)
  await page.getByRole("textbox", { name: "Formulation & follow-up" }).fill("Keep this synthetic note")
  await more(page)
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "New sitting", exact: true }).click()
  await expect(page.getByRole("textbox", { name: "Formulation & follow-up" })).toHaveValue("Keep this synthetic note")
  expect((await downloadJSON(page, { responses: true })).clinician.reference).toBe("SYNTHETIC-KEEP")
})
