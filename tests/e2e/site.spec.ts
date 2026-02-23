import { expect, test } from "@playwright/test";

test("landing page loads and navigation works", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "A global bank account you actually own." })).toBeVisible();

  await page.getByRole("link", { name: "Pricing" }).first().click();
  await expect(page).toHaveURL(/\/pricing/);
  await expect(page.getByRole("heading", { name: "Plans for personal and global finance." })).toBeVisible();
});

test("sign in flow deploys and opens dashboard", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Sign in" }).first().click();
  await expect(page.getByRole("heading", { name: "Connect to begin" })).toBeVisible();

  await page.getByRole("button", { name: /Connect Passkey/i }).click();
  await expect(page.getByText("Connected")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Review and deploy" })).toBeVisible();
  await page.getByRole("button", { name: "Deploy account" }).click();

  await expect(page.getByRole("heading", { name: "Account deployed" })).toBeVisible();
  await page.getByRole("link", { name: "Open dashboard" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /command center/i })).toBeVisible();
});

test("contact form submits successfully", async ({ page }) => {
  await page.goto("/company");

  await page.getByLabel("Name").fill("Alexis");
  await page.getByLabel("Email").fill("alexis@example.com");
  await page.getByLabel("Message").fill("I want to discuss enterprise rollout and partnerships.");

  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Thanks. Your message was sent.")).toBeVisible();
});

test.describe("responsive and motion", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile navigation opens and routes", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
    await page.getByRole("link", { name: "Pricing" }).click();

    await expect(page).toHaveURL(/\/pricing/);
  });

  test("reduced motion preference keeps experience accessible", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator(".hero-light").first()).toBeHidden();
    await page.getByRole("button", { name: "Sign in" }).first().click();
    await expect(page.getByRole("heading", { name: "Connect to begin" })).toBeVisible();
  });
});
