import { describe, expect, test } from "bun:test";

import "./test-markdown-runtime.js";
import {
  formatCountdownRemaining,
  resolveActivityMode,
  shouldShowPendingResponseActivity,
  shouldRenderTranscriptActivity,
} from "./render.js";

describe("render activity helpers", () => {
  test("authoritative standby and sleeping states override stale working spinners", () => {
    expect(resolveActivityMode(true, { mode: "standby" })).toBe("standby");
    expect(resolveActivityMode(true, { mode: "sleeping" })).toBe("sleeping");
    expect(resolveActivityMode(true, null)).toBe("working");
    expect(resolveActivityMode(false, null)).toBe("idle");
  });

  test("formats countdowns compactly", () => {
    expect(formatCountdownRemaining(35_000, 0)).toBe("35s");
    expect(formatCountdownRemaining(185_000, 0)).toBe("3m 5s");
    expect(formatCountdownRemaining(3_900_000, 0)).toBe("1h 5m");
    expect(formatCountdownRemaining(null, 0)).toBe("");
  });

  test("does not render transcript activity rows for working state", () => {
    expect(shouldRenderTranscriptActivity("working")).toBe(false);
    expect(shouldRenderTranscriptActivity("standby")).toBe(false);
    expect(shouldRenderTranscriptActivity("sleeping")).toBe(false);
    expect(shouldRenderTranscriptActivity("idle")).toBe(false);
  });

  test("shows pending response activity only while waiting for first assistant text", () => {
    expect(shouldShowPendingResponseActivity("working", true)).toBe(true);
    expect(shouldShowPendingResponseActivity("working", false)).toBe(false);
    expect(shouldShowPendingResponseActivity("standby", true)).toBe(false);
    expect(shouldShowPendingResponseActivity("idle", true)).toBe(false);
  });
});
