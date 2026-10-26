import { readFile } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { test, expect, setupSitting, complete, allPositive, openReview } from "./helpers.mjs"

test("actual browser clipboard receives a current clinical summary", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await setupSitting(page)
  await complete(page)
  await openReview(page)
  await page.getByRole("textbox", { name: "Formulation & follow-up" }).fill("Synthetic clipboard verification")
  await page.getByRole("button", { name: "Copy summary", exact: true }).click()
  await expect(page.locator("#export-status")).toHaveText("Clinical summary copied.")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Synthetic clipboard verification")
})

test("native print rendering produces a PDF with scores, current notes and sources", async ({ page }, testInfo) => {
  await setupSitting(page, { topics: ["depression", "anxiety", "alcohol", "trauma"] })
  await complete(page, allPositive)
  await openReview(page)
  await page.getByRole("textbox", { name: "Formulation & follow-up" }).fill("Synthetic current print note")
  const path = testInfo.outputPath("synthetic-clinical-report.pdf")
  await page.pdf({ path, format: "A4", printBackground: true })
  const text = execFileSync("pdftotext", [path, "-"], { encoding: "utf8" })
  expect((await readFile(path)).subarray(0, 4).toString()).toBe("%PDF")
  for (const phrase of ["Clinical screening", "PHQ-9", "GAD-7", "AUDIT", "PCL-5", "Synthetic current print note", "Sources", "Spitzer"]) expect(text).toContain(phrase)
  expect(text).not.toContain("Copy summary")
  expect(text).not.toContain("Formulation & follow-up")
  await page.locator("#main").focus()
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: testInfo.outputPath("clinical-review.png"), fullPage: true })
})

test("closing the personality tab warns and cancellation retains unexported answers", async ({ page }) => {
  await page.goto("/index.html#/personality-5")
  await page.getByRole("radiogroup").first().getByRole("radio").first().click()
  const pending = page.waitForEvent("dialog", { timeout: 5000 })
  // Unlike reload(), this API explicitly does not wait for a cancelled navigation.
  await page.close({ runBeforeUnload: true })
  const dialog = await pending
  expect(dialog.type()).toBe("beforeunload")
  await dialog.dismiss()
  expect(page.isClosed()).toBe(false)
  await expect(page.getByRole("radiogroup").first().getByRole("radio").first()).toHaveAttribute("aria-checked", "true")
})

test("forced-colour mode preserves selection and visible keyboard focus", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" })
  await page.goto("/index.html#/personality-5")
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true)
  const group = page.getByRole("radiogroup").first()
  await group.getByRole("radio").first().focus()
  await page.keyboard.press("ArrowRight")
  const selected = group.getByRole("radio").nth(1)
  await expect(selected).toBeFocused()
  await expect(selected).toHaveAttribute("aria-checked", "true")
  await expect(selected).toHaveCSS("outline-style", "solid")
  await expect(selected).toHaveCSS("outline-width", "2px")
  await expect(selected).toHaveCSS("font-weight", "700")
})

test('personality facets survive real A4 PDF output with their score labels', async ({page},testInfo)=>{
  await setupSitting(page,{topics:['ipip-neo-120']})
  await complete(page,()=>2)
  await openReview(page)
  // The screen disclosure remains compact. The separate print record is expanded.
  await expect(page.locator('.profile-facets:visible')).not.toHaveAttribute('open','')
  const path=testInfo.outputPath('synthetic-personality-report.pdf')
  await page.pdf({path,format:'A4',printBackground:true})
  const text=execFileSync('pdftotext',[path,'-'],{encoding:'utf8'})
  for(const label of ['IPIP-NEO-120','Neuroticism','Cautiousness','Sympathy','3.00','keyed mean']) expect(text).toContain(label)
  expect(text).not.toContain('No complete score available')
})

test('encrypted final history reaches actual PDF and a correction prints as draft',async({page},testInfo)=>{
 const {createScreener}=await import('../../api.js')
 const {newAssessment,finaliseAssessment}=await import('../../core/assessment.js')
 const {sealFile}=await import('../../core/vault.js')
 const f=createScreener(),setup=f.createSetup({context:'clinical',topics:Object.fromEntries(f.catalog.map(x=>[x.id,x.id==='depression']))})
 const make=async(start,score)=>finaliseAssessment(newAssessment(f.configuration,setup,{'phq-1':score,'phq-2':0},{reference:'SYNTHETIC-PDF-HISTORY'},{phase:'record',cursor:null},{startedAt:start}),'Synthetic PDF clinician')
 const older=await make('2026-10-01T00:00:00.000Z',0),current=await make('2026-10-20T00:00:00.000Z',1)
 const raw=await sealFile({schemaVersion:1,current,history:[older]},'Synthetic PDF passphrase')
 await page.goto('/interview.html');await page.getByRole('button',{name:'Resume sitting',exact:true}).click()
 await page.getByLabel('Encrypted sitting file',{exact:true}).setInputFiles({name:'synthetic.openscreen',mimeType:'application/octet-stream',buffer:Buffer.from(raw)})
 await page.getByLabel('Passphrase (12+ characters)',{exact:true}).fill('Synthetic PDF passphrase');await page.getByRole('button',{name:'Unlock file'}).click()
 await page.locator('#resume-reference').fill('SYNTHETIC-PDF-HISTORY');await page.locator('#resume-reference').press('Enter')
 await expect(page.getByRole('heading',{name:'Final record',exact:true})).toBeVisible()
 const path=testInfo.outputPath('synthetic-final-history.pdf');await page.pdf({path,format:'A4',printBackground:true})
 let text=execFileSync('pdftotext',[path,'-'],{encoding:'utf8'})
 for(const phrase of ['Final','Synthetic PDF clinician','Assessment history','2026-10-01','2026-10-20','PHQ-2'])expect(text).toContain(phrase)
 await page.getByLabel('Formulation & follow-up',{exact:true}).fill('Synthetic correction after finalisation')
 await page.pdf({path,format:'A4',printBackground:true});text=execFileSync('pdftotext',[path,'-'],{encoding:'utf8'})
 expect(text).toContain('Draft');expect(text).toContain('Synthetic correction after finalisation');expect(text).not.toContain('Final · attested')
})
