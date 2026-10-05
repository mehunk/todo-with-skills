import { describe, expect, it } from "vitest";
import {
  findPreviewComment,
  PREVIEW_COMMENT_MARKER,
  previewCommentBody,
} from "./preview-comment.ts";

describe("previewCommentBody", () => {
  it("starts with the marker the workflow finds its sticky comment by", () => {
    const body = previewCommentBody({
      commit: "3976059abcdef0123456789abcdef0123456789a",
      links: [
        {
          label: "App",
          url: "https://pr-2-todo-preview.personal-d9e.workers.dev",
        },
      ],
    });

    expect(body.split("\n")[0]).toBe("<!-- preview-deploy -->");
    expect(PREVIEW_COMMENT_MARKER).toBe("<!-- preview-deploy -->");
  });

  it("lists each preview link and the short commit it was built from", () => {
    const body = previewCommentBody({
      commit: "3976059abcdef0123456789abcdef0123456789a",
      links: [
        {
          label: "App",
          url: "https://pr-2-todo-preview.personal-d9e.workers.dev",
        },
        {
          label: "Storybook",
          url: "https://pr-2-todo-preview.personal-d9e.workers.dev/storybook/",
        },
      ],
    });

    expect(body).toBe(
      [
        "<!-- preview-deploy -->",
        "### Preview",
        "",
        "| | |",
        "| --- | --- |",
        "| App | https://pr-2-todo-preview.personal-d9e.workers.dev |",
        "| Storybook | https://pr-2-todo-preview.personal-d9e.workers.dev/storybook/ |",
        "",
        "Built from 3976059.",
      ].join("\n"),
    );
  });
});

describe("findPreviewComment", () => {
  const bot = { login: "github-actions[bot]", type: "Bot" };
  const human = { login: "mehunk", type: "User" };

  it("finds the workflow's earlier preview comment among the PR's comments", () => {
    const comments = [
      { id: 1, user: human, body: "Looks good" },
      { id: 2, user: bot, body: "<!-- other-bot -->\nSomething else" },
      { id: 3, user: bot, body: "<!-- preview-deploy -->\n### Preview" },
    ];

    expect(findPreviewComment(comments)?.id).toBe(3);
  });

  it("finds nothing on a PR that has no preview comment yet", () => {
    expect(findPreviewComment([{ id: 1, user: human, body: "Hi" }])).toBe(
      undefined,
    );
  });

  it("ignores a person's comment that quotes the marker", () => {
    const comments = [
      { id: 4, user: human, body: "<!-- preview-deploy -->\ncopied" },
    ];

    expect(findPreviewComment(comments)).toBe(undefined);
  });
});
