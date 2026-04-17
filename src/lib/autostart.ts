async function getAutostartApi() {
  try {
    return await import("@tauri-apps/plugin-autostart");
  } catch {
    return null;
  }
}

export async function isStartOnLoginSupported(): Promise<boolean> {
  const autostart = await getAutostartApi();
  return !!autostart;
}

export async function isStartOnLoginEnabled(): Promise<boolean> {
  const autostart = await getAutostartApi();
  if (!autostart) return false;
  try {
    return await autostart.isEnabled();
  } catch {
    return false;
  }
}

export async function setStartOnLoginEnabled(enabled: boolean): Promise<void> {
  const autostart = await getAutostartApi();
  if (!autostart) {
    throw new Error("Autostart plugin is unavailable");
  }

  if (enabled) {
    await autostart.enable();
    return;
  }

  await autostart.disable();
}
