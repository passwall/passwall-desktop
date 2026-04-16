import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AUTO_UPDATE_CHECKS_KEY,
  checkForAvailableUpdate,
  installUpdate,
  isAutoUpdateChecksEnabled,
  setAutoUpdateChecksEnabled,
} from "./updater";

const mockCheck = vi.fn();
const mockDownloadAndInstall = vi.fn();
const mockRelaunch = vi.fn();

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: () => mockCheck(),
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: () => mockRelaunch(),
}));

describe("updater helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    mockCheck.mockReset();
    mockDownloadAndInstall.mockReset();
    mockRelaunch.mockReset();
  });

  it("isAutoUpdateChecksEnabled defaults true when unset", () => {
    expect(isAutoUpdateChecksEnabled()).toBe(true);
  });

  it("isAutoUpdateChecksEnabled false when localStorage is false", () => {
    localStorage.setItem(AUTO_UPDATE_CHECKS_KEY, "false");
    expect(isAutoUpdateChecksEnabled()).toBe(false);
  });

  it("setAutoUpdateChecksEnabled persists string", () => {
    setAutoUpdateChecksEnabled(false);
    expect(localStorage.getItem(AUTO_UPDATE_CHECKS_KEY)).toBe("false");
    expect(isAutoUpdateChecksEnabled()).toBe(false);
  });

  it("checkForAvailableUpdate returns null when no update", async () => {
    mockCheck.mockResolvedValue(null);
    await expect(checkForAvailableUpdate()).resolves.toBeNull();
  });

  it("checkForAvailableUpdate returns wrapped update", async () => {
    const fake = {
      version: "9.9.9",
      downloadAndInstall: mockDownloadAndInstall,
    };
    mockCheck.mockResolvedValue(fake);
    const u = await checkForAvailableUpdate();
    expect(u?.version).toBe("9.9.9");
  });

  it("installUpdate downloads then relaunches", async () => {
    mockDownloadAndInstall.mockResolvedValue(undefined);
    mockRelaunch.mockResolvedValue(undefined);
    await installUpdate({
      version: "1.0.0",
      downloadAndInstall: mockDownloadAndInstall,
    });
    expect(mockDownloadAndInstall).toHaveBeenCalledTimes(1);
    expect(mockRelaunch).toHaveBeenCalledTimes(1);
  });

  it("installUpdate forwards progress callback", async () => {
    const onEvent = vi.fn();
    mockDownloadAndInstall.mockImplementation(async (cb?: (e: unknown) => void) => {
      cb?.({ event: "Finished", data: {} });
    });
    await installUpdate(
      { version: "1", downloadAndInstall: mockDownloadAndInstall },
      onEvent
    );
    expect(onEvent).toHaveBeenCalled();
  });
});
