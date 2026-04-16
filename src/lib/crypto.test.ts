import { describe, it, expect } from "vitest";
import { SymmetricKey } from "./crypto";

describe("SymmetricKey", () => {
  it("round-trips 64-byte blob", () => {
    const enc = new Uint8Array(32).fill(1);
    const mac = new Uint8Array(32).fill(2);
    const sk = new SymmetricKey(enc, mac);
    const bytes = sk.toBytes();
    const back = SymmetricKey.fromBytes(bytes);
    expect([...back.encKey]).toEqual([...enc]);
    expect([...back.macKey]).toEqual([...mac]);
  });

  it("rejects wrong combined length", () => {
    expect(() => SymmetricKey.fromBytes(new Uint8Array(63))).toThrow(
      /expected 64 bytes/
    );
  });

  it("rejects wrong component lengths in constructor", () => {
    expect(
      () => new SymmetricKey(new Uint8Array(31), new Uint8Array(32))
    ).toThrow(/Invalid key size/);
  });
});
