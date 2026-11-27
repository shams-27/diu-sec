import { expect, test } from "@playwright/test";
import { deleteJoinTestMembers, uniqueId } from "./helpers";

test.beforeEach(deleteJoinTestMembers);
test.afterEach(deleteJoinTestMembers);

test("applies for membership and shows a pending digital ID card", async ({ page }) => {
  const stamp = uniqueId();
  const last3 = Number(stamp.slice(-3));
  const studentId = `${String(last3).padStart(3, "0")}-35-${(last3 % 900) + 100}`;
  const email = `e2e-join-${stamp}@diu.edu.bd`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${(last3 % 200) + 1}` });

  await page.goto("/join");
  await page.getByLabel("Full name").fill("E2E Applicant");
  await page.getByLabel("DIU SWE student ID").fill(studentId);
  await page.getByLabel("Institutional email").fill(email);
  await page.getByRole("button", { name: /apply and get my id card/i }).click();

  await expect(page).toHaveURL(/\/join\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Your club card" })).toBeVisible();
  await expect(page.getByText(/pending approval/i)).toBeVisible();
  expect(await page.locator("canvas[role='img']").getAttribute("aria-label")).toContain(email);
});
