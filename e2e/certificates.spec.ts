import { expect, test } from "@playwright/test";
import { openEvent, superAdminCookie, uniqueId } from "./helpers";

test("issues a certificate and verifies it publicly", async ({ page, browser }) => {
  const event = await openEvent();
  test.skip(!event, "No published event available for issuance");
  if (!event) return;

  const email = `e2e-cert-${uniqueId()}@diu.edu.bd`;
  const cookie = await superAdminCookie();
  await page.context().addCookies([{ name: "authjs.session-token", value: cookie, domain: "localhost", path: "/" }]);

  await page.goto("/admin/certificates");
  await page.getByLabel("Type").selectOption("PARTICIPANT");
  await page.getByLabel("Event").selectOption(event!.id);
  await page.getByLabel("Recipients").fill(`E2E Recipient, ${email}`);
  await page.getByRole("button", { name: "Issue certificates" }).click();

  const row = page.locator("tr", { hasText: email });
  await expect(row).toBeVisible();
  const certId = (await row.locator("a[href^='/verify/']").textContent())?.trim() ?? "";
  expect(certId).toMatch(/^DIU-SEC-CERT-/);

  const publicPage = await (await browser.newContext()).newPage();
  await publicPage.goto(`/verify/${certId}`);
  await expect(publicPage.getByRole("heading", { name: "This certificate is valid" })).toBeVisible();
  await expect(publicPage.getByText("VALID", { exact: true })).toBeVisible();
  await expect(publicPage.getByText("E2E Recipient")).toBeVisible();

  await page.goto("/admin/certificates");
  await page.locator("tr", { hasText: certId }).getByRole("button", { name: "Revoke" }).click();
  await publicPage.reload();
  await expect(publicPage.getByText("This certificate is revoked")).toBeVisible();
  await expect(publicPage.getByRole("link", { name: /Download PDF/ })).toHaveCount(0);
});
