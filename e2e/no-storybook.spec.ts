import { expect, test } from "@playwright/test";

// Storybook ships with previews only (scripts/preview-deploy.ts). The
// production workflow sets E2E_NO_STORYBOOK=1 next to BASE_URL so the release
// fails if a deploy ever carries it to production.
test.skip(
  !process.env.E2E_NO_STORYBOOK,
  "set E2E_NO_STORYBOOK=1 when BASE_URL is the production deployment",
);

test("production does not serve Storybook at /storybook/", async ({
  request,
}) => {
  const root = await request.get("/storybook/");
  expect(await root.text(), "/storybook/ serves Storybook").not.toContain(
    "storybook-root",
  );

  // Storybook's story index, a static asset of every Storybook build.
  const index = await request.get("/storybook/index.json");
  expect(
    index.headers()["content-type"] ?? "",
    "/storybook/index.json is served",
  ).not.toContain("application/json");
});
