import AxeBuilder from "@axe-core/playwright"
import { test, expect, setupSitting, complete, allPositive, openReview, noOverflow } from "./helpers.mjs"

async function accessible(page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
  expect(results.violations.map((violation) => ({ rule: violation.id, impact: violation.impact, nodes: violation.nodes.map((node) => ({ target: node.target, failure: node.failureSummary })) }))).toEqual([])
}

test("library, patient question and four-domain clinical review pass automated accessibility checks", async ({ page }) => {
  await page.goto("/index.html")
  await accessible(page)
  await setupSitting(page, { topics: ["depression", "anxiety", "alcohol", "trauma"] })
  await accessible(page)
  await complete(page, allPositive)
  await openReview(page)
  for (const row of await page.locator(".result-detail").all()) { if (!await row.evaluate(node => node.open)) await row.locator(":scope > summary").click() }
  await accessible(page)
})

test("personality selections, reverse key, graph updates and clearing work through real controls", async ({ page }) => {
  await page.goto("/index.html#/personality-5")
  const pattern = [4, 5, 1, 2, 3]
  for (let index = 0; index < pattern.length; index++) await page.getByRole("radiogroup").nth(index).getByRole("radio").nth(pattern[index] - 1).click()
  await expect(page.locator("#results")).toHaveAttribute("data-ready", "true")
  expect(await page.locator(".distribution-label .cat").allTextContents()).toEqual(["High", "Low", "High", "High", "Middle"])
  await page.getByRole("radiogroup").nth(1).getByRole("radio").nth(4).focus()
  await page.keyboard.press("ArrowLeft")
  expect(await page.locator(".distribution-label .cat").allTextContents()).toEqual(["High", "Middle", "High", "High", "Middle"])
  await accessible(page)
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await noOverflow(page)
  }
  await page.getByRole("button", { name: "Clear", exact: true }).click()
  await expect(page.locator('[role="radio"][aria-checked="true"]')).toHaveCount(0)
  await expect(page.locator("#results")).not.toHaveAttribute("data-ready", "true")
})

test("personality navigation can be cancelled without losing answers and confirmed navigation clears them", async ({ page }) => {
  await page.goto("/index.html#/personality-5")
  const selected = page.getByRole("radiogroup").first().getByRole("radio").first()
  await selected.click()
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("link", { name: "All tools", exact: true }).click()
  await expect(page).toHaveURL(/#\/personality-5$/)
  await expect(selected).toHaveAttribute("aria-checked", "true")
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("link", { name: "All tools", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Start an assessment", exact: true })).toBeVisible()
  await page.getByText('More tools', { exact: true }).click()
  await page.locator('a.measure-link[href="#/personality-5"]').click()
  await expect(page.locator('[role="radio"][aria-checked="true"]')).toHaveCount(0)
})
