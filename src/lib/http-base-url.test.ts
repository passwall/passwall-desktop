import { describe, it, expect } from "vitest";
import { normalizeHttpClientBaseURL } from "./http-base-url";

describe("normalizeHttpClientBaseURL", () => {
  const def = "https://api.passwall.io";

  it("uses default when input is empty or whitespace", () => {
    expect(
      normalizeHttpClientBaseURL("", {
        isBrowserDevMode: false,
        defaultWhenEmpty: def,
      })
    ).toBe(def);
    expect(
      normalizeHttpClientBaseURL("  ", {
        isBrowserDevMode: true,
        defaultWhenEmpty: "",
      })
    ).toBe("");
  });

  it("strips trailing slashes when not in browser dev api.passwall special-case", () => {
    expect(
      normalizeHttpClientBaseURL("https://custom.example/api/", {
        isBrowserDevMode: false,
        defaultWhenEmpty: def,
      })
    ).toBe("https://custom.example/api");
  });

  it("in browser dev: api.passwall.io maps to empty string (Vite proxy)", () => {
    expect(
      normalizeHttpClientBaseURL("https://api.passwall.io/", {
        isBrowserDevMode: true,
        defaultWhenEmpty: def,
      })
    ).toBe("");
  });

  it("in browser dev: invalid URL still yields trimmed value without slashes", () => {
    expect(
      normalizeHttpClientBaseURL("not-a-url///", {
        isBrowserDevMode: true,
        defaultWhenEmpty: def,
      })
    ).toBe("not-a-url");
  });

  it("when not browser dev: api.passwall.io is kept as normalized URL", () => {
    expect(
      normalizeHttpClientBaseURL("https://api.passwall.io/", {
        isBrowserDevMode: false,
        defaultWhenEmpty: def,
      })
    ).toBe("https://api.passwall.io");
  });
});
