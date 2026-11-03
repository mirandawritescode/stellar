import { describe, it, expect } from "vitest";
import { isAppStorageKey } from "@/lib/storage/reset";

describe("isAppStorageKey", () => {
  it("matches keys with the ap: prefix", () => {
    expect(isAppStorageKey("ap:birthData")).toBe(true);
    expect(isAppStorageKey("ap:tasks")).toBe(true);
    expect(isAppStorageKey("ap:reading:2026-11-02")).toBe(true);
  });

  it("does not match unrelated keys", () => {
    expect(isAppStorageKey("other:thing")).toBe(false);
    expect(isAppStorageKey("")).toBe(false);
  });

  it("requires the prefix at the start, not just present anywhere", () => {
    expect(isAppStorageKey("notap:birthData")).toBe(false);
  });
});
