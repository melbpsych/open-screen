import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/demo',
  outputDir: './.demo-test-results',
  workers: 2,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:8792', reducedMotion: 'reduce' },
  webServer: {
    command: 'python3 -m http.server 8792 --bind 127.0.0.1 --directory .demo-site',
    url: 'http://127.0.0.1:8792/',
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'ignore',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'mobile-chromium', use: devices['Pixel 7'] },
    { name: 'mobile-webkit', use: devices['iPhone 13'] },
  ],
})
