import { version } from "../../package.json";

/**
 * The app version shown in the UI: `package.json`'s `version` with a leading
 * "v". Resolved at build time (the bundler inlines the JSON import), so a
 * version bump needs no UI edit.
 */
export const APP_VERSION = `v${version}`;
