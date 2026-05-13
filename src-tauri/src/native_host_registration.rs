use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const HOST_NAME: &str = "com.passwall.desktop";
const OFFICIAL_ORIGIN: &str = "chrome-extension://blaiihhmnjllkfnkmkidahhegbmlghmo/";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeHostDiagnostics {
    pub manifest_path: String,
    pub manifest_exists: bool,
    pub host_path: Option<String>,
    pub host_exists: bool,
    pub allowed_origins: Vec<String>,
    pub expected_origins: Vec<String>,
    pub windows_registry: Option<WindowsRegistryDiagnostics>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowsRegistryDiagnostics {
    pub chrome_key_exists: bool,
    pub chrome_value: Option<String>,
    pub chrome_matches_manifest_path: bool,
    pub edge_key_exists: bool,
    pub edge_value: Option<String>,
    pub edge_matches_manifest_path: bool,
}

#[derive(Serialize)]
struct NativeHostManifest<'a> {
    name: &'a str,
    description: &'a str,
    path: String,
    #[serde(rename = "type")]
    host_type: &'a str,
    allowed_origins: Vec<String>,
}

#[derive(Deserialize)]
struct NativeHostManifestFile {
    path: Option<String>,
    allowed_origins: Option<Vec<String>>,
}

fn is_valid_chrome_origin(origin: &str) -> bool {
    if !origin.starts_with("chrome-extension://") || !origin.ends_with('/') {
        return false;
    }
    let id_part = &origin["chrome-extension://".len()..origin.len() - 1];
    id_part.len() == 32 && id_part.chars().all(|c| c.is_ascii_lowercase() && c <= 'p')
}

fn allowed_origins() -> Vec<String> {
    let mut origins = vec![OFFICIAL_ORIGIN.to_string()];
    if let Ok(extra_origin) = std::env::var("PASSWALL_DEV_EXTENSION_ORIGIN") {
        if is_valid_chrome_origin(&extra_origin) && !origins.iter().any(|o| o == &extra_origin) {
            origins.push(extra_origin);
        }
    }
    origins
}

#[cfg(target_os = "windows")]
fn normalize_windows_path_for_compare(path: &str) -> String {
    path.replace('/', "\\").to_ascii_lowercase()
}

fn chrome_manifest_path() -> Result<PathBuf, String> {
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            return Ok(
                PathBuf::from(home)
                    .join("Library/Application Support/Google/Chrome/NativeMessagingHosts")
                    .join(format!("{HOST_NAME}.json")),
            );
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(xdg_config_home) = std::env::var("XDG_CONFIG_HOME") {
            return Ok(PathBuf::from(xdg_config_home)
                .join("google-chrome/NativeMessagingHosts")
                .join(format!("{HOST_NAME}.json")));
        }
        if let Some(home) = std::env::var_os("HOME") {
            return Ok(
                PathBuf::from(home)
                    .join(".config/google-chrome/NativeMessagingHosts")
                    .join(format!("{HOST_NAME}.json")),
            );
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = std::env::var("APPDATA") {
            return Ok(
                PathBuf::from(appdata)
                    .join("Google/Chrome/NativeMessagingHosts")
                    .join(format!("{HOST_NAME}.json")),
            );
        }
        return Err("APPDATA is not set on Windows".to_string());
    }

    #[allow(unreachable_code)]
    Err("Unsupported platform for native host manifest path".to_string())
}

fn write_manifest(path: &Path, host_path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create manifest directory: {e}"))?;
    }

    let manifest = NativeHostManifest {
        name: HOST_NAME,
        description: "Passwall Desktop — secure key storage for the Passwall browser extension",
        path: host_path
            .to_str()
            .ok_or_else(|| "Host executable path is not valid UTF-8".to_string())?
            .to_string(),
        host_type: "stdio",
        allowed_origins: allowed_origins(),
    };

    let content = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize native host manifest: {e}"))?;
    fs::write(path, format!("{content}\n"))
        .map_err(|e| format!("Failed to write native host manifest: {e}"))?;
    Ok(())
}

fn read_manifest_file(path: &Path) -> Result<NativeHostManifestFile, String> {
    let raw = fs::read_to_string(path).map_err(|e| format!("Failed to read native host manifest: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Failed to parse native host manifest: {e}"))
}

#[cfg(target_os = "windows")]
fn query_windows_registry_default_value(key: &str) -> Result<Option<String>, String> {
    let output = std::process::Command::new("reg")
        .args(["query", key, "/ve"])
        .output()
        .map_err(|e| format!("Failed to query registry key {key}: {e}"))?;

    if !output.status.success() {
        return Ok(None);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        if let Some((_, value)) = line.split_once("REG_SZ") {
            let trimmed = value.trim();
            return Ok(if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            });
        }
    }

    Ok(None)
}

#[cfg(target_os = "windows")]
fn windows_registry_diagnostics(manifest_path: &Path) -> Result<WindowsRegistryDiagnostics, String> {
    let manifest_path_str = manifest_path
        .to_str()
        .ok_or_else(|| "Manifest path is not valid UTF-8".to_string())?;
    let manifest_norm = normalize_windows_path_for_compare(manifest_path_str);

    let chrome_key = r"HKCU\Software\Google\Chrome\NativeMessagingHosts\com.passwall.desktop";
    let edge_key = r"HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.passwall.desktop";

    let chrome_value = query_windows_registry_default_value(chrome_key)?;
    let edge_value = query_windows_registry_default_value(edge_key)?;

    let chrome_matches_manifest_path = chrome_value
        .as_ref()
        .map(|v| normalize_windows_path_for_compare(v) == manifest_norm)
        .unwrap_or(false);
    let edge_matches_manifest_path = edge_value
        .as_ref()
        .map(|v| normalize_windows_path_for_compare(v) == manifest_norm)
        .unwrap_or(false);

    Ok(WindowsRegistryDiagnostics {
        chrome_key_exists: chrome_value.is_some(),
        chrome_value,
        chrome_matches_manifest_path,
        edge_key_exists: edge_value.is_some(),
        edge_value,
        edge_matches_manifest_path,
    })
}

#[cfg(not(target_os = "windows"))]
fn windows_registry_diagnostics(_manifest_path: &Path) -> Result<WindowsRegistryDiagnostics, String> {
    Err("Windows registry diagnostics are only available on Windows".to_string())
}

pub fn collect_diagnostics() -> Result<NativeHostDiagnostics, String> {
    let manifest_path = chrome_manifest_path()?;
    let manifest_exists = manifest_path.exists();

    let mut host_path = None;
    let mut host_exists = false;
    let mut manifest_allowed_origins = Vec::new();

    if manifest_exists {
        let manifest = read_manifest_file(&manifest_path)?;
        host_path = manifest.path;
        manifest_allowed_origins = manifest.allowed_origins.unwrap_or_default();
        host_exists = host_path
            .as_ref()
            .map(|p| PathBuf::from(p).exists())
            .unwrap_or(false);
    }

    let windows_registry = windows_registry_diagnostics(&manifest_path).ok();

    Ok(NativeHostDiagnostics {
        manifest_path: manifest_path.display().to_string(),
        manifest_exists,
        host_path,
        host_exists,
        allowed_origins: manifest_allowed_origins,
        expected_origins: allowed_origins(),
        windows_registry,
    })
}

#[cfg(target_os = "windows")]
fn register_windows_browser_key(registry_root: &str, manifest_path: &Path) -> Result<(), String> {
    let key = format!(r"{registry_root}\{HOST_NAME}");
    let status = std::process::Command::new("reg")
        .args([
            "add",
            &key,
            "/ve",
            "/t",
            "REG_SZ",
            "/d",
            manifest_path
                .to_str()
                .ok_or_else(|| "Manifest path is not valid UTF-8".to_string())?,
            "/f",
        ])
        .status()
        .map_err(|e| format!("Failed to launch reg.exe for {registry_root}: {e}"))?;

    if !status.success() {
        return Err(format!(
            "reg.exe failed while registering native host key {registry_root} (exit: {status})"
        ));
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn register_windows_native_host(manifest_path: &Path) -> Result<(), String> {
    register_windows_browser_key(
        r"HKCU\Software\Google\Chrome\NativeMessagingHosts",
        manifest_path,
    )?;
    register_windows_browser_key(
        r"HKCU\Software\Microsoft\Edge\NativeMessagingHosts",
        manifest_path,
    )?;
    Ok(())
}

pub fn ensure_registered() -> Result<(), String> {
    let host_executable = std::env::current_exe()
        .map_err(|e| format!("Failed to resolve current executable for native host: {e}"))?;
    let manifest_path = chrome_manifest_path()?;
    write_manifest(&manifest_path, &host_executable)?;

    #[cfg(target_os = "windows")]
    register_windows_native_host(&manifest_path)?;

    Ok(())
}
