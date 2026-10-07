/**
 * Validates the preview alias passed to `preview:deploy` (or
 * `preview:teardown`, named by `script` in the usage line). Wrangler turns the
 * alias into a DNS label (`<alias>-todo-preview.<subdomain>.workers.dev`), so
 * only lowercase letters, digits and dashes, starting with a letter, are let
 * through; anything else would fail late, after the build and migrations.
 */
const ALIAS_PATTERN = /^[a-z][a-z0-9-]*$/;

export function parsePreviewAlias(
  alias: string | undefined,
  script = "preview:deploy",
): string {
  if (alias === undefined) {
    throw new Error(`Usage: npm run ${script} -- <alias>   (e.g. pr-42)`);
  }
  if (!ALIAS_PATTERN.test(alias)) {
    throw new Error(
      `Invalid preview alias ${JSON.stringify(alias)}: use lowercase letters, digits and dashes, starting with a letter`,
    );
  }
  return alias;
}

/** The preview alias of pull request `pr`: 42 gives `pr-42`. */
export function prPreviewAlias(pr: number): string {
  return `pr-${pr}`;
}

const PR_ALIAS_PATTERN = /^pr-([1-9][0-9]*)$/;

/**
 * The pull request number of a PR preview's alias (`pr-42` gives 42), or
 * undefined for any other alias (`spike-2`, `pr-07`), which belongs to no PR.
 */
export function prNumberOfAlias(alias: string): number | undefined {
  const match = PR_ALIAS_PATTERN.exec(alias);
  return match ? Number(match[1]) : undefined;
}
