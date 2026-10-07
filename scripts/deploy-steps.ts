/**
 * Steps shared by `preview-deploy.ts`, `preview-teardown.ts` and
 * `production-deploy.ts`. Every tool's output goes to stderr so the scripts'
 * stdout stays machine-readable (a deploy's URL is its only line). Pure
 * helpers live in `wrangler-commands.ts`, `wrangler-output.ts`,
 * `preview-alias.ts`, `preview-database.ts` and `open-pull-requests.ts`,
 * which the unit tests (run in workerd) can load.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export type StepOptions = {
  /**
   * What the step returns as `output`. "none" (the default) streams the
   * command's stdout to stderr and returns nothing; "stdout" returns its
   * stdout (e.g. Wrangler's `--json` output), echoed to stderr only on
   * failure; "all" returns its stdout and stderr together, always echoed to
   * stderr, so a caller can tell one failure from another by its message. The
   * command's stderr streams to stderr unless captured.
   */
  capture?: "none" | "stdout" | "all";
  /**
   * The command's stdin: the terminal ("inherit", the default) or nothing
   * ("ignore"), for an optional step that must never wait on a prompt.
   */
  stdin?: "inherit" | "ignore";
};

export type StepResult = {
  ok: boolean;
  /** What `capture` asked for; empty for "none". */
  output: string;
  /** The command's exit status, or 1 when it never ran or was killed. */
  exitCode: number;
};

/**
 * Runs `command` with `env` as its whole environment, after echoing it to
 * stderr. Never exits: a failure, including a missing command, is reported on
 * stderr and returned as `ok: false`, for steps the caller can skip or handle.
 */
export function runStep(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  { capture = "none", stdin = "inherit" }: StepOptions = {},
): StepResult {
  console.error(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: [
      stdin,
      capture === "none" ? process.stderr : "pipe",
      capture === "all" ? "pipe" : "inherit",
    ],
    env,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const ok = result.status === 0 && result.error === undefined;
  if (capture === "all" || (capture === "stdout" && !ok)) {
    process.stderr.write(output);
  }
  if (!ok) {
    const reason =
      result.error?.message ??
      (result.status === null
        ? `killed by ${result.signal}`
        : `exit ${result.status}`);
    console.error(`\n${command} ${args[0]} failed (${reason})`);
  }
  return { ok, output, exitCode: ok ? 0 : result.status || 1 };
}

/**
 * Runs `command` like `runStep`, but exits the script with the command's
 * status if it fails, so a failed step stops the release. Returns `output`.
 */
export function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  options?: StepOptions,
): string {
  const { ok, output, exitCode } = runStep(command, args, env, options);
  if (!ok) process.exit(exitCode);
  return output;
}

/**
 * Calls `step` with a temporary WRANGLER_OUTPUT_FILE_PATH, then returns the
 * ND-JSON Wrangler wrote there. The temporary directory is always removed.
 */
export function captureWranglerOutput(
  step: (outputEnv: NodeJS.ProcessEnv) => void,
): string {
  const outputDir = mkdtempSync(path.join(tmpdir(), "wrangler-output-"));
  const outputFile = path.join(outputDir, "wrangler-output.ndjson");
  try {
    step({ WRANGLER_OUTPUT_FILE_PATH: outputFile });
    return readFileSync(outputFile, "utf8");
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}
