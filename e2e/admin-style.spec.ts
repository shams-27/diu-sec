import { expect, test } from "@playwright/test";
import { createStyleTestMember, deleteJoinTestMembers, superAdminCookie } from "./helpers";

async function signIn(page: import("@playwright/test").Page) {
  const cookie = await superAdminCookie();
  await page.context().addCookies([{ name: "authjs.session-token", value: cookie, domain: "localhost", path: "/" }]);
}

test("admin style matches public typography without breaking small screens", async ({ page }) => {
  await signIn(page);
  await createStyleTestMember();
  try {
    for (const viewport of [{ width: 360, height: 780 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
      expect(await page.locator("h1").first().evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/Bebas/i);
      expect(
        await page.locator("section[aria-labelledby='distribution-heading']").evaluate((el) => getComputedStyle(el).borderRadius),
      ).toBe("0px");
      expect(await page.locator("[data-slot='card']").first().evaluate((el) => getComputedStyle(el).boxShadow)).toContain("6px 6px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      await page.goto("/admin/members");
      const tableHeader = page.locator(".admin-surface thead th").first();
      await expect(tableHeader).toBeVisible();
      expect(await tableHeader.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/Geist[_ ]Mono/i);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }

    const accent = page.locator("aside nav a[aria-current='page'] span[class*='bg-primary']");
    await expect(accent).toBeVisible();
    expect(await accent.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
    expect(await accent.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");

    const [roleColor, destructiveColor] = await page.evaluate(() => {
      const surface = document.querySelector(".admin-surface")!;
      const destructive = document.createElement("span");
      destructive.className = "pill text-destructive";
      surface.append(destructive);
      const color = getComputedStyle(destructive).color;
      destructive.remove();
      return [getComputedStyle(surface.querySelector(".pill")!).color, color];
    });
    expect(destructiveColor).not.toBe(roleColor);

    const button = page.getByRole("link", { name: "Export CSV" });
    expect(await button.evaluate((el) => getComputedStyle(el).borderRadius)).toBe("0px");
    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    expect(await button.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
  } finally {
    await deleteJoinTestMembers();
  }
});

test("uses the club logo instead of text branding in the admin shell", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin");
  const logos = [page.locator("header img"), page.locator("aside img")];
  for (const logo of logos) {
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/sec_logo.png");
    await expect(logo).toHaveAttribute("alt", "DIU SEC");
    await expect(logo).toHaveAttribute("width", "82");
    await expect(logo).toHaveAttribute("height", "40");
    expect(await logo.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(82);
  }
  await expect(page.getByText("DIU SEC", { exact: true })).toHaveCount(0);

  await page.evaluate(() => document.documentElement.classList.add("dark"));
  for (const logo of logos) {
    expect(await logo.evaluate((el) => getComputedStyle(el.parentElement!).backgroundColor)).toBe("rgb(255, 255, 255)");
  }
});

test("keeps reduced-motion opt-outs inside admin", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page);
  await page.goto("/admin");
  const activeLink = page.getByRole("link", { name: "A-01 Dashboard" });
  expect(await activeLink.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
});
