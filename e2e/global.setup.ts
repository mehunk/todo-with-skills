import { clerkSetup } from "@clerk/testing/playwright";

// Runs once in the main Playwright process, so the Testing Token it puts in
// process.env reaches every worker.
export default async function globalSetup() {
  await clerkSetup();
}
