import { pathToFileURL } from "node:url"
import AxeBuilder from "@axe-core/playwright"
import { test, expect, setupSitting, answer, complete, openReview, more, noOverflow } from "./helpers.mjs"

test("question transitions focus the heading and describe the published timeframe", async ({ page }) => {
  await setupSitting(page)
  await expect(page.locator("#question-title")).toBeFocused()
  await expect(page.getByRole("radiogroup")).toHaveAccessibleDescription(/Over the previous 2 weeks/)
  await expect(page.getByRole("radiogroup")).toHaveAccessibleDescription(/Selecting an answer moves to the next question/)
  await page.getByRole("radio").first().click()
  await expect(page.locator("#main")).toHaveAttribute("data-step", "phq-2")
  await expect(page.locator("#question-title")).toBeFocused()
  await page.getByRole("radio").first().focus()
  await page.keyboard.press("End")
  await expect(page.locator("#main")).toHaveAttribute("data-step", "gad-1")
  await expect(page.locator("#question-title")).toBeFocused()
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await expect(page.getByRole("radio").last()).toHaveAttribute("aria-checked", "true")
  await page.getByRole("radio").last().focus()
  await page.keyboard.press("Home")
  await expect(page.locator("#main")).toHaveAttribute("data-step", "gad-1")
  await expect(page.locator("#question-title")).toBeFocused()
  await expect(page.locator("#question-title")).toHaveAccessibleDescription(/Over the last two weeks/)
  await page.locator(".skip").focus()
  await page.keyboard.press("Enter")
  await expect(page.locator("#main")).toBeFocused()
})

test("expanded administration settings have accessible controls and generous targets", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto("/interview.html")
  await page.getByRole("radio", { name: "Forensic", exact: true }).click()
  await expect(page.locator('[data-focus-key="validity"]')).toHaveAttribute("aria-pressed", "true")
  await page.locator('[data-focus-key="alcohol"]').click()
  await page.locator('[data-focus-key="irritability"]').click()
  await expect(page.getByRole("textbox", { name: "Reference (optional)" })).toHaveCSS("font-size", "16px")
  await noOverflow(page)
  const targets = page.locator(".top-nav a, summary, .setup-condition label, .context-options button")
  for (const node of await targets.all()) {
    if (await node.isVisible()) expect((await node.boundingBox()).height).toBeGreaterThanOrEqual(43.9)
  }
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
  expect(scan.violations.map((row) => ({ id: row.id, nodes: row.nodes.map((node) => node.target) }))).toEqual([])
})

test("200 percent text remains usable at 320px across the library, assessment, profile and offline report", async ({ page, context }, testInfo) => {
  await context.addInitScript(() => { document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.fontSize = "200%" }, { once: true }) })
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto("/index.html")
  // bootstrap.js imports the library asynchronously after the HTML load event.
  await expect(page.getByRole("heading", { name: "Start an assessment", exact: true })).toBeVisible()
  await noOverflow(page)
  await setupSitting(page)
  await expect(page.locator(".stem")).toHaveCSS("font-size", "34px")
  await noOverflow(page)
  // Focus the last answer at enlarged phone size. Back/Continue must not cover it.
  const lastAnswer = page.getByRole("radio").last()
  await lastAnswer.focus()
  await expect.poll(() => lastAnswer.evaluate(node => {
    const rect = node.getBoundingClientRect()
    const top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom)
    return bottom > top && node.contains(document.elementFromPoint((rect.left + rect.right) / 2, (top + bottom) / 2))
  })).toBe(true)
  await complete(page)
  await openReview(page)
  await noOverflow(page)
  await expect(page.locator(".review-toolbar")).not.toHaveCSS("position", "sticky")
  await expect(page.getByRole("textbox", { name: "Formulation & follow-up" })).toHaveCSS("font-size", "32px")
  await page.getByRole("textbox", { name: "Formulation & follow-up" }).fill("Synthetic enlarged-text review")
  const pending = page.waitForEvent("download")
  await more(page)
  await page.getByRole("button", { name: "Save report", exact: true }).click()
  const path = testInfo.outputPath("enlarged-report.html")
  await (await pending).saveAs(path)
  const report = await context.newPage()
  await report.setViewportSize({ width: 320, height: 700 })
  await report.goto(pathToFileURL(path).href)
  await noOverflow(report)
  await expect(report.locator(".report-notes")).toContainText("Synthetic enlarged-text review")
  const profile = await context.newPage()
  await profile.setViewportSize({ width: 320, height: 700 })
  await profile.goto("/index.html#/personality-5")
  await expect(profile.getByRole("radiogroup")).toHaveCount(5)
  for (const group of await profile.getByRole("radiogroup").all()) await group.getByRole("radio").first().click()
  await expect(profile.locator("#profile-status")).toHaveText("Your personality profile is ready below the questions.")
  await expect(profile.getByRole("radiogroup").last().getByRole("radio").first()).toBeFocused()
  await noOverflow(profile)
  for (const [name, tab] of [["enlarged-clinical-review", page], ["enlarged-personality", profile]]) {
    await tab.locator("#main").focus()
    await tab.evaluate(() => scrollTo(0, 0))
    // Keep long enlarged-text captures below WebKit’s device-pixel image limit.
    await tab.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true, scale: "css" })
  }
})

test("the export disclosure dismisses predictably and keyboard focus stays visible in the review", async ({ page }) => {
  await setupSitting(page)
  await complete(page)
  await openReview(page)
  await more(page)
  await more(page)
  await page.getByRole("button", { name: "Save structured JSON", exact: true }).focus()
  await page.keyboard.press("Escape")
  await expect(page.locator(".export-menu")).not.toHaveAttribute("open", "")
  await expect(page.locator(".export-menu > summary")).toBeFocused()
  await page.keyboard.press("Enter")
  await page.getByRole("button", { name: "New assessment", exact: true }).focus()
  // Leave the menu using actual keyboard focus rather than assuming a fixed
  // number of native Tab stops across browsers.
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press('Tab')
    if (await page.locator('.export-menu').evaluate(menu => !menu.open || !menu.contains(document.activeElement))) break
  }
  await expect(page.locator(".export-menu")).not.toHaveAttribute("open", "")
  await more(page)
  // The non-modal phone panel leaves a gutter for outside dismissal.
  await page.mouse.click(5, 5)
  await expect(page.locator(".export-menu")).not.toHaveAttribute("open", "")
  await page.locator(".review-checks > summary").click()
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 700 })
    await more(page)
    await page.locator("#copy-record").focus()
    for (let index = 0; index < 45; index++) {
      await page.keyboard.press("Tab")
      // WebKit completes native keyboard scrolling after the key event returns.
      // Observe the settled position; never scroll a test target into view here.
      await expect.poll(() => page.evaluate(() => {
        const node = document.activeElement
        if (node === document.body) return true
        const rect = node.getBoundingClientRect()
        const left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right)
        const top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom)
        const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
        return right > left && bottom > top && node.contains(hit)
      }), { timeout: 2000, intervals: [16, 50, 100], message: "Keyboard focus is obscured after native scrolling" }).toBe(true)
    }
  }
})
