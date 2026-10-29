import AxeBuilder from "@axe-core/playwright"
import { readFile } from "node:fs/promises"
import { test, expect, configure, noOverflow } from "./helpers.mjs"

test("screening logic is discoverable and preserves assessment setup in its original tab", async ({ page, context }) => {
  await page.goto("/index.html")
  await page.getByRole("link", { name: "View screening logic" }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Screening logic")
  await expect(page.getByRole("list", { name: "Assessment order" }).getByRole("listitem")).toHaveCount(4)
  await expect(page.locator('[data-pathway="depression"]')).toContainText("Score ≥2")
  await expect(page.locator('[data-pathway="trauma"]')).toContainText("No exposure → stop")
  await expect(page.getByRole("heading", { name: "Safety pause" })).toBeVisible()
  await page.getByRole("link", { name: "Assessment", exact: true }).click()
  await page.getByRole("radio", { name: "Forensic", exact: true }).click()
  await page.getByRole("textbox", { name: "Reference (optional)" }).fill("Synthetic retained setup")
  const popupReady = context.waitForEvent("page")
  await page.getByRole("link", { name: /View screening logic/ }).click()
  const popup = await popupReady
  await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Screening logic")
  await expect(page.getByRole("radio", { name: "Forensic", exact: true })).toHaveAttribute("aria-checked", "true")
  await expect(page.getByRole("textbox", { name: "Reference (optional)" })).toHaveValue("Synthetic retained setup")
  await popup.close()
})

test("logic reflects changed gates and registered questionnaires", async ({ page }) => {
  const definition = JSON.parse(await readFile(new URL("../../examples/questionnaire.json", import.meta.url)))
  await configure(page, (policy) => {
    policy.thresholds.depression.gate = 3
    policy.thresholds.anxiety.gate = 4
    policy.thresholds.trauma.gate = 4
    policy.thresholds.alcohol.allowed = [4]
    policy.personality.followUpBands = ["low"]
  }, definition)
  await page.goto("/logic.html")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  for (const [id, threshold] of [["depression", "Score ≥3"], ["anxiety", "Score ≥4"], ["trauma", "Yes count ≥4"], ["alcohol", "≥4"], [definition.id, "Score ≥1"]]) {
    await expect(page.locator(`[data-pathway="${id}"] .logic-decision`)).toContainText(threshold)
  }
  await expect(page.locator(`[data-pathway="${definition.id}"]`)).toContainText("+2 items · 3 total")
  await page.getByText("Optional measures", { exact: true }).click()
  await expect(page.locator(".logic-optional")).toContainText("low bands")
  await expect(page.locator(".logic-optional")).not.toContainText("high bands")
})

test("logic diagram reflows with enlarged text and is accessible with optional content open", async ({ page }) => {
  await page.goto("/logic.html")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  const summary = page.locator(".logic-optional summary")
  await summary.focus()
  await page.keyboard.press("Enter")
  await expect(page.locator(".logic-optional")).toHaveAttribute("open", "")
  await page.locator(".logic-notes > summary").click()
  await expect(page.locator(".logic-notes")).toContainText("A low brief score does not exclude a disorder")
  await expect(page.locator(".logic-notes")).toContainText("no sale of the scale")
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await noOverflow(page)
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%" })
  await noOverflow(page)
  await expect(page.locator('.logic-safety')).toContainText("the flag stays in the record")
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  expect(scan.violations).toEqual([])
})
