import { defineConfig, devices } from "@playwright/test"

/** Real HTTP + browser coverage; never reuse a developer's running sitting. */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 8000 },
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:8791",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
    acceptDownloads: true,
  },
  webServer: {
    command: "python3 serve.py --port 8791",
    url: "http://127.0.0.1:8791/index.html",
    reuseExistingServer: false,
    timeout: 15000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testIgnore: "**/*.chromium.spec.mjs" },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testIgnore: "**/*.chromium.spec.mjs" },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] }, testIgnore: "**/*.chromium.spec.mjs" },
  ],
})
