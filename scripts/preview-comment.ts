/**
 * Renders the body of the single sticky PR comment the PR workflow keeps up to
 * date with the current preview links. The workflow finds its earlier comment
 * by PREVIEW_COMMENT_MARKER and edits it instead of posting a new one.
 */
export const PREVIEW_COMMENT_MARKER = "<!-- preview-deploy -->";

export type PreviewLink = { label: string; url: string };

export function previewCommentBody(preview: {
  commit: string;
  links: PreviewLink[];
}): string {
  return [
    PREVIEW_COMMENT_MARKER,
    "### Preview",
    "",
    "| | |",
    "| --- | --- |",
    ...preview.links.map(({ label, url }) => `| ${label} | ${url} |`),
    "",
    `Built from ${preview.commit.slice(0, 7)}.`,
  ].join("\n");
}

/** The fields of a GitHub issue comment this module reads. */
export type IssueComment = {
  id: number;
  body?: string | null;
  user: { login: string; type: string } | null;
};

/**
 * The comment a previous run posted, if any: a bot's comment that starts with
 * the marker. People's comments are never edited, even if they quote it.
 */
export function findPreviewComment<C extends IssueComment>(
  comments: C[],
): C | undefined {
  return comments.find(
    (comment) =>
      comment.user?.type === "Bot" &&
      (comment.body ?? "").startsWith(PREVIEW_COMMENT_MARKER),
  );
}
