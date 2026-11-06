import { startAssessment } from './helpers.mjs'
import { workspaceMenu } from './helpers.mjs'
import { setupView } from './helpers.mjs'
import { readFile } from "node:fs/promises"
import AxeBuilder from "@axe-core/playwright"
import { test, expect, setupSitting, answer, complete, openReview, downloadJSON, more, configure, noOverflow } from "./helpers.mjs"
const key = "open-screen.practice-preferences.v1"
const note = "Synthetic practice preference for browser verification."

async function activateDraft(page) {
  await page.getByRole('textbox', { name: 'Revision name', exact: true }).fill('Synthetic named revision')
  await page.getByRole('button', { name: 'Save draft revision', exact: true }).click()
  await expect(page.locator('#practice-status')).toContainText('Draft revision saved')
  await page.getByRole('button', { name: 'Review revision', exact: true }).first().click()
  await page.getByRole('textbox', { name: 'Reviewing clinician', exact: true }).fill('Synthetic settings reviewer')
  await page.getByRole('checkbox', { name: /I reviewed these changes/ }).check()
  await page.getByRole('button', { name: 'Activate reviewed revision', exact: true }).click()
}

async function changeGate(page, value = "3") {
  await page.goto("/logic.html")
  await page.getByRole("button", { name: /Edit PHQ-2 follow-up gate/ }).click()
  await page.getByRole("spinbutton", { name: "PHQ-2 follow-up gate", exact: true }).fill(value)
  await page.getByRole("textbox", { name: "Reason for customisation" }).fill(note)
  await activateDraft(page)
  await expect(page.locator("#practice-status")).toContainText("Saved for new assessments")
}

async function settingsDownload(page) {
  const pending = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export settings" }).click()
  const download = await pending
  return JSON.parse(await readFile(await download.path(), "utf8"))
}

test("edited gates persist, document their defaults and reason, change screening and reset cleanly", async ({ page, context }) => {
  await changeGate(page)
  await expect(page.locator('[data-pathway="depression"]')).toContainText("Customised")
  await page.locator(".practice-record > summary").click()
  await expect(page.locator(".practice-record")).toContainText("2 → 3")
  const saved = await settingsDownload(page)
  expect(saved.preferences.reason).toBe(note)
  expect(saved.changes[0]).toMatchObject({ key: "depression.gate", before: 2, after: 3 })
  await page.reload()
  await page.locator(".practice-editor > summary").click()
  await expect(page.getByRole("spinbutton", { name: "PHQ-2 follow-up gate", exact: true })).toHaveValue("3")
  const assessment = await context.newPage()
  await setupSitting(assessment, { topics: ["depression"] })
  const trace = await complete(assessment, (id) => id === "phq-1" ? 2 : 0)
  expect(trace).toHaveLength(2)
  await openReview(assessment)
  await expect(assessment.getByText("Custom practice settings used", { exact: true })).toBeVisible()
  const record = await downloadJSON(assessment)
  expect(record.symptoms[0].total).toBeNull()
  expect(record.configuration.policy.id).toBe("practice-custom")
  expect(record.configuration.policy.rationale).toContain(note)
  const pending = assessment.waitForEvent("download")
  await more(assessment)
  await assessment.getByRole("button", { name: "Save report", exact: true }).click()
  const html = await readFile(await (await pending).path(), "utf8")
  expect(html).toContain(note)
  expect(await assessment.evaluate(() => Object.keys(localStorage))).toEqual([key])
  await page.getByRole("button", { name: "Reset to defaults", exact: true }).click()
  await expect(page.locator("#practice-status")).toContainText("Reset to project defaults")
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).active, key)).toBeNull()
  const defaults = await context.newPage()
  await setupSitting(defaults, { topics: ["depression"] })
  expect((await complete(defaults, (id) => id === "phq-1" ? 2 : 0)).length).toBe(10)
})

test("active assessments retain their configuration and the next patient uses saved settings", async ({ page, context }) => {
  await setupSitting(page, { topics: ["depression"] })
  await answer(page, 2)
  const editor = await context.newPage()
  await changeGate(editor, "6")
  await complete(page)
  await openReview(page)
  const original = await downloadJSON(page)
  expect(original.configuration.policy.id).toBe("open-screen-default")
  expect(original.symptoms[0].total).toBe(2)
  await more(page)
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "New assessment", exact: true }).click()
  await expect(page.locator(".practice-notice")).toContainText("Custom practice settings")
 await setupView(page, 'Measures')
  await startAssessment(page)
  expect((await complete(page, (id) => id === "phq-1" ? 2 : 0)).length).toBe(2)
  await openReview(page)
  const next = await downloadJSON(page)
  expect(next.configuration.policy.thresholds.depression.gate).toBe(6)
  await editor.getByRole("button", { name: "Reset to defaults", exact: true }).click()
  expect((await downloadJSON(page)).configuration.policy.thresholds.depression.gate).toBe(6)
})

test("invalid drafts cannot be saved, field reset works and concurrent edits cannot overwrite", async ({ page, context }) => {
  await page.goto("/logic.html")
  await page.locator(".practice-editor > summary").click()
  const field = page.getByRole("spinbutton", { name: "PHQ-2 follow-up gate", exact: true })
  for (const value of ["", "7", "2.5"]) {
    await field.fill(value)
    await expect(page.locator("#practice-error")).toContainText("Preview not updated")
    await expect(page.getByRole("button", { name: "Save draft revision" })).toBeDisabled()
  }
  await page.getByRole("button", { name: "Reset field: PHQ-2 follow-up gate", exact: true }).click()
  await expect(field).toHaveValue("2")
  await field.fill("4")
  const other = await context.newPage()
  await changeGate(other)
  await expect(page.locator("#practice-error")).toContainText("another tab")
  await expect(page.getByRole("button", { name: "Save draft revision" })).toBeDisabled()
  await page.getByRole("button", { name: "Discard edits", exact: true }).click()
  await expect(page.locator("#practice-status")).toBeFocused()
  await expect(field).toHaveValue("3")
  const download = await settingsDownload(page)
  expect(download.preferences.overrides["depression.gate"]).toBe(3)
})

test("registered questionnaire thresholds use the same editor and are recorded in results", async ({ page }) => {
  const q = JSON.parse(await readFile(new URL("../../examples/questionnaire.json", import.meta.url)))
  q.screenAt = 2
  await configure(page, (policy) => { policy.defaults.topics = [q.id] }, q)
  await page.goto("/logic.html")
  await page.getByRole("button", { name: /Edit Example check-in follow-up gate/ }).click()
  await page.getByRole("spinbutton", { name: "Example check-in follow-up gate", exact: true }).fill("0")
  await page.getByRole("button", { name: "All thresholds", exact: true }).click()
  await page.locator(".practice-advanced > summary").first().click()
  await page.getByRole("spinbutton", { name: "Example check-in screen threshold", exact: true }).fill("3")
  await page.getByRole("textbox", { name: "Reason for customisation" }).fill(note)
  await activateDraft(page)
  await expect(page.locator("#practice-status")).toContainText("Saved for new assessments")
  await page.goto("/interview.html")
  await page.getByRole("radio", { name: "Clinical", exact: true }).click()
  await page.getByRole("checkbox", { name: "This is a synthetic development session, not patient care." }).check()
 await setupView(page, 'Measures')
  await startAssessment(page)
  expect((await complete(page, () => 0)).length).toBe(3)
  await openReview(page)
  const record = await downloadJSON(page)
  expect(record.configuration.questionnaires[0].gate.threshold).toBe(0)
  expect(record.configuration.questionnaires[0].screenAt).toBe(3)
  expect(record.additional[0]).toMatchObject({ threshold: 0, total: 1, positive: false })
})

test("expanded settings remain accessible and usable with enlarged text", async ({ page }) => {
  await page.goto("/logic.html")
  await page.locator(".practice-editor > summary").click()
  for (const summary of await page.locator(".practice-advanced > summary").all()) await summary.click()
  await page.getByRole("checkbox", { name: "middle", exact: true }).check()
  await page.getByRole("button", { name: "Reset field: Personality extension bands", exact: true }).click()
  await expect(page.locator(".practice-bands")).toBeFocused()
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await noOverflow(page)
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%" })
  await noOverflow(page)
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  expect(scan.violations.map((row) => ({ id: row.id, targets: row.nodes.map((node) => node.target) }))).toEqual([])
})

test("corrupt preferences block screening and can be explicitly reset without clearing other storage", async ({ page }, testInfo) => {
  await page.goto("/logic.html")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await page.evaluate((key) => { localStorage.setItem(key, "invalid json"); localStorage.setItem("unrelated-setting", "keep") }, key)
  await page.goto("/interview.html")
  await expect(page.getByRole("heading", { name: "New assessment", exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Setup progress' }).getByRole('button', { name: 'Ready', exact: true })).toBeDisabled()
  await workspaceMenu(page)
  await expect(page.getByRole('button', { name: 'Resume assessment', exact: true })).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(page.locator('.workspace-menu')).not.toHaveAttribute('open', '')
  await page.getByRole("link", { name: "Review practice settings", exact: true }).click()
  await expect(page.locator("#practice-status")).toContainText("could not be loaded")
  await page.getByRole("button", { name: "Reset to defaults", exact: true }).click()
  await expect(page.locator("#practice-status")).toContainText("Reset to project defaults")
  expect(await page.evaluate(() => localStorage.getItem("unrelated-setting"))).toBe("keep")
  await page.goto("/interview.html")
  await expect(page.getByRole("heading", { name: "New assessment", exact: true })).toBeVisible()
})

test("a failed browser write preserves saved preferences and reports the failure", async ({ page }) => {
  await changeGate(page)
  await page.getByRole("spinbutton", { name: "PHQ-2 follow-up gate", exact: true }).fill("4")
  await page.getByRole("textbox", { name: "Revision name", exact: true }).fill("Failing draft")
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Browser storage is full", "QuotaExceededError") } })
  await page.getByRole("button", { name: "Save draft revision" }).click()
  await expect(page.locator("#practice-error")).toContainText("Browser storage is full")
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).revisions.find(r => r.id === JSON.parse(localStorage.getItem(key)).active).preferences.overrides["depression.gate"], key)).toBe(3)
  await page.getByRole("button", { name: "Discard edits", exact: true }).click()
  await expect(page.getByRole("spinbutton", { name: "PHQ-2 follow-up gate", exact: true })).toHaveValue("3")
})

test("editing from assessment setup updates its policy while retaining clinician setup choices", async ({ page, context }) => {
  await page.goto("/interview.html")
  await page.getByRole("radio", { name: "Forensic", exact: true }).click()
  await page.getByRole("textbox", { name: "Reference (optional)" }).fill("Synthetic retained setup")
  const pending = context.waitForEvent("page")
  await workspaceMenu(page)
  await page.getByRole("link", { name: "Logic", exact: true }).click()
  const editor = await pending
  await editor.getByRole("button", { name: /Edit PHQ-2 follow-up gate/ }).click()
  await editor.getByRole("spinbutton", { name: "PHQ-2 follow-up gate", exact: true }).fill("3")
  await editor.getByRole("textbox", { name: "Reason for customisation" }).fill(note)
  await activateDraft(editor)
  await expect(editor.locator("#practice-status")).toContainText("Saved for new assessments")
  await expect(page.locator(".practice-notice")).toContainText("Custom practice settings")
  await expect(page.getByRole("textbox", { name: "Reference (optional)" })).toHaveValue("Synthetic retained setup")
  await expect(page.locator('.guided-setting')).toContainText('Forensic')
 await setupView(page, 'Measures')
  await startAssessment(page)
  await complete(page, (id) => id === "phq-1" ? 2 : id === "pcptsd-exposure" ? 1 : 0)
  await openReview(page)
  const record = await downloadJSON(page)
  expect(record.symptoms[0].threshold).toBe(3)
  expect(record.symptoms[0].total).toBeNull()
  expect(record.clinician.reference).toBe("Synthetic retained setup")
})

test('a saved draft changes no active threshold until reviewed; activation dialog is accessible',async({page})=>{
 await page.goto('/logic.html');await page.getByRole('button',{name:/Edit PHQ-2 follow-up gate/}).click()
 await page.getByRole('spinbutton',{name:'PHQ-2 follow-up gate',exact:true}).fill('4')
 await page.getByLabel('Revision name',{exact:true}).fill('Synthetic pending revision');await page.getByLabel('Reason for customisation',{exact:true}).fill(note)
 await page.getByRole('button',{name:'Save draft revision',exact:true}).click()
 await expect(page.locator('#practice-status')).toContainText('Draft revision saved')
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).active,key)).toBeNull()
 await page.getByRole('button',{name:'Review revision',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('2 → 4')
 await page.setViewportSize({width:320,height:700});await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});await noOverflow(page)
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(scan.violations.map(v=>v.id)).toEqual([])
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0)
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).active,key)).toBeNull()
})

test('simultaneous settings writers retain one revision and reject the stale writer',async({page,context})=>{
 await page.goto('/logic.html');const other=await context.newPage();await other.goto('/logic.html')
 for(let round=0;round<8;round++){
  const expected=await page.evaluate(key=>localStorage.getItem(key),key)
  const attempt=tab=>tab.evaluate(async({expected,round})=>{
    const {savePractice}=await import('/app-config.js')
    try{await savePractice({'depression.gate':round%2?2:3},'Synthetic concurrent review',expected,'Concurrent draft '+round);return 'saved'}catch{return 'conflict'}
  },{expected,round})
  expect((await Promise.all([attempt(page),attempt(other)])).sort()).toEqual(['conflict','saved'])
  for(const tab of [page,other]) await expect.poll(()=>tab.evaluate(key=>JSON.parse(localStorage.getItem(key)).revisions.length,key)).toBe(round+1)
 }
})

test('an open revision review cannot activate against settings changed in another tab',async({page,context})=>{
 await page.goto('/logic.html');await page.getByRole('button',{name:/Edit PHQ-2 follow-up gate/}).click();await page.getByRole('spinbutton',{name:'PHQ-2 follow-up gate',exact:true}).fill('4')
 await page.getByLabel('Revision name',{exact:true}).fill('Synthetic stale review');await page.getByLabel('Reason for customisation',{exact:true}).fill(note)
 await page.getByRole('button',{name:'Save draft revision',exact:true}).click();await expect(page.locator('#practice-status')).toContainText('Draft revision saved')
 await page.getByRole('button',{name:'Review revision',exact:true}).click()
 const other=await context.newPage();await changeGate(other,'3')
 await page.getByLabel('Reviewing clinician',{exact:true}).fill('Synthetic reviewer');await page.getByRole('checkbox',{name:/I reviewed these changes/}).check();await page.getByRole('button',{name:'Activate reviewed revision',exact:true}).click()
 await expect(page.locator('dialog [role=alert]')).toContainText(/changed|review/)
 expect(await page.evaluate(key=>{const v=JSON.parse(localStorage.getItem(key));return v.revisions.find(r=>r.id===v.active).preferences.overrides['depression.gate']},key)).toBe(3)
})

test('legacy settings require explicit review and migrate without losing their active values',async({page})=>{
 await page.goto('/logic.html')
 await page.evaluate(async()=>{const {screener,PRACTICE_KEY}=await import('/app-config.js');const {configurePractice}=await import('/core/practice.js');const legacy=configurePractice(screener,{'depression.gate':3},'Synthetic legacy setting',new Date().toISOString());localStorage.setItem(PRACTICE_KEY,JSON.stringify(legacy.preferences))})
 await page.reload();await page.locator('.revision-history > summary').click();await page.getByRole('button',{name:'Review legacy settings',exact:true}).click()
 await page.getByLabel('Reviewing clinician',{exact:true}).fill('Synthetic migration reviewer');await page.getByRole('checkbox',{name:/I reviewed these changes/}).check();await page.getByRole('button',{name:'Activate reviewed revision',exact:true}).click()
 await expect(page.locator('#practice-status')).toContainText('Reviewed revision activated')
 const v=await settingsDownload(page);expect(v.configuration.policy.thresholds.depression.gate).toBe(3);expect(v.journal.revisions[0].review.by).toBe('Synthetic migration reviewer')
})
