import { defineConfig, devices, chromium } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3003",
    trace: "on-first-retry",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? chromium.executablePath(),
      args: ["--no-sandbox"],
    },
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "pnpm start --port 3003",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
