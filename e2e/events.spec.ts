import { expect, test } from "@playwright/test";
import { openEvent, superAdminCookie, uniqueId } from "./helpers";

test("reserves a seat and checks in with the generated QR token", async ({ page, browser }) => {
  const event = await openEvent();
  test.skip(!event, "No published event has open seats");
  if (!event) return;

  const email = `e2e-event-${uniqueId()}@example.com`;
  await page.goto(`/events/${event!.slug}`);
  await page.getByRole("textbox", { name: "Full name" }).fill("E2E Attendee");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: /reserve seat/i }).click();

  await expect(page.getByText("Seat reserved")).toBeVisible();
  const token = (await page.locator("p.font-mono").textContent())?.trim() ?? "";
  expect(token).toMatch(/^DIU-SEC-EVT-/);

  const admin = await browser.newContext();
  const cookie = await superAdminCookie();
  await admin.addCookies([{ name: "authjs.session-token", value: cookie, domain: "localhost", path: "/" }]);
  const adminPage = await admin.newPage();
  await adminPage.goto(`/admin/events/${event!.id}/checkin`);
  await adminPage.getByRole("textbox", { name: "QR token" }).fill(token);
  await adminPage.getByRole("button", { name: "Check in" }).click();

  await expect(adminPage.getByText("Checked in: E2E Attendee")).toBeVisible();
  await adminPage.getByRole("button", { name: "Check in" }).click();
  await expect(adminPage.getByText("Already checked in.")).toBeVisible();
  await admin.close();
});
