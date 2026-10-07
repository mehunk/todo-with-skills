/**
 * The repository's open pull requests, read through the `gh` CLI in one call.
 * The preview deploy deletes the databases of PRs not in this set (ADR-0004),
 * so a listing that might be incomplete is rejected rather than trusted.
 */

/** More open PRs than this and the listing could be cut off. */
export const OPEN_PR_LIST_LIMIT = 1000;

/** `gh` args listing the numbers of the repository's open PRs as JSON. */
export function openPrListArgs(): string[] {
  return [
    "pr",
    "list",
    "--state",
    "open",
    "--json",
    "number",
    "--limit",
    String(OPEN_PR_LIST_LIMIT),
  ];
}

/**
 * The open PR numbers in `gh pr list --json number` output. Throws when the
 * output is not that shape, or when it holds `OPEN_PR_LIST_LIMIT` entries
 * (more may exist), so the caller never mistakes an open PR for a closed one.
 */
export function openPrNumbers(output: string): Set<number> {
  const entries = JSON.parse(output) as unknown;
  if (
    !Array.isArray(entries) ||
    !entries.every(
      (entry) => typeof (entry as { number?: unknown })?.number === "number",
    )
  ) {
    throw new Error(`Unexpected gh pr list output: ${output.slice(0, 200)}`);
  }
  if (entries.length >= OPEN_PR_LIST_LIMIT) {
    throw new Error(
      `gh listed ${entries.length} open PRs, the most it asks for: the listing may be incomplete`,
    );
  }
  return new Set(entries.map((entry: { number: number }) => entry.number));
}
