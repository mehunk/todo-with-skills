/**
 * Posts the sticky preview comment on a pull request, or edits the one an
 * earlier run posted, so the PR always shows exactly one, current, comment:
 *
 *   node scripts/post-preview-comment.ts <pr-number> <commit-sha> <label>=<url>...
 *   node scripts/post-preview-comment.ts 2 "$GITHUB_SHA" "App=$PREVIEW_URL"
 *
 * Talks to GitHub through the `gh` CLI, which needs GH_TOKEN (a token allowed
 * to write pull request comments) and GH_REPO (owner/name) in CI.
 */
import { spawnSync } from "node:child_process";
import {
  findPreviewComment,
  type IssueComment,
  type PreviewLink,
  previewCommentBody,
} from "./preview-comment.ts";

const [pr, commit, ...linkArgs] = process.argv.slice(2);
if (!pr || !/^\d+$/.test(pr) || !commit || linkArgs.length === 0) {
  console.error(
    "Usage: node scripts/post-preview-comment.ts <pr-number> <commit-sha> <label>=<url>...",
  );
  process.exit(1);
}

const links: PreviewLink[] = linkArgs.map((arg) => {
  const separator = arg.indexOf("=");
  if (separator <= 0) {
    console.error(`Expected <label>=<url>, got: ${arg}`);
    process.exit(1);
  }
  return { label: arg.slice(0, separator), url: arg.slice(separator + 1) };
});

function gh(args: string[], input?: string): string {
  const result = spawnSync("gh", args, {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
  if (result.status !== 0) {
    console.error(`gh ${args.join(" ")} failed (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const pages = JSON.parse(
  gh([
    "api",
    "--paginate",
    "--slurp",
    `repos/{owner}/{repo}/issues/${pr}/comments`,
  ]),
) as IssueComment[][];
const existing = findPreviewComment(pages.flat());
const payload = JSON.stringify({ body: previewCommentBody({ commit, links }) });

if (existing) {
  gh(
    [
      "api",
      "--method",
      "PATCH",
      `repos/{owner}/{repo}/issues/comments/${existing.id}`,
      "--input",
      "-",
    ],
    payload,
  );
  console.error(`Updated preview comment ${existing.id} on #${pr}`);
} else {
  gh(
    [
      "api",
      "--method",
      "POST",
      `repos/{owner}/{repo}/issues/${pr}/comments`,
      "--input",
      "-",
    ],
    payload,
  );
  console.error(`Posted preview comment on #${pr}`);
}
