import { expect, test } from "@playwright/test";
import { adminCookie, webWingId } from "./helpers";

test("denies a wing lead access to committee management", async ({ page }) => {
  const wingId = await webWingId();
  const cookie = await adminCookie("lead.web@diu.edu.bd", "WING_LEAD", wingId);
  await page.context().addCookies([{ name: "authjs.session-token", value: cookie, domain: "localhost", path: "/" }]);

  const response = await page.goto("/admin/committee");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Admin data unavailable" })).toBeVisible();
});
