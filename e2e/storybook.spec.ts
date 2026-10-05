import { expect, test } from "@playwright/test";

// Only previews ship Storybook (built by scripts/preview-deploy.ts), so this
// runs when the target is a preview deployment: the PR workflow sets
// E2E_STORYBOOK=1 next to BASE_URL. The dev server and production have none.
test.skip(
  !process.env.E2E_STORYBOOK,
  "set E2E_STORYBOOK=1 when BASE_URL is a preview deployment",
);

test("the preview serves Storybook at /storybook/ with the Foundations page", async ({
  page,
}) => {
  await page.goto("/storybook/?path=/story/foundations--tokens");

  const story = page.frameLocator("#storybook-preview-iframe");
  await expect(
    story.getByRole("heading", { level: 1, name: "Foundations" }),
  ).toBeVisible();
});

test("/storybook redirects to /storybook/ so relative asset paths resolve", async ({
  page,
}) => {
  await page.goto("/storybook");

  expect(new URL(page.url()).pathname).toBe("/storybook/");
});
