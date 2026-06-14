mod biometric_keystore;
mod keystore;
mod logger;
mod native_host_registration;
mod paired_browsers;

use keystore::KeyStore;
use logger::AppLogEntry;
use serde::Deserialize;
use std::{fs, path::PathBuf};

#[derive(Deserialize)]
struct ExportFile {
    filename: String,
    content: String,
}

fn log_native_error(app: &tauri::AppHandle, event: &str, message: &str, error: &str) {
    let _ = logger::append_app_log(
        app,
        AppLogEntry {
            level: Some("error".to_string()),
            event: event.to_string(),
            message: message.to_string(),
            source: Some("tauri.command".to_string()),
            fields: Some(serde_json::json!({ "error": error })),
            context: None,
        },
    );
}

#[tauri::command]
fn store_secret(app: tauri::AppHandle, account: &str, secret: &str) -> Result<(), String> {
    let ks = KeyStore::new();
    ks.store(account, secret).inspect_err(|err| {
        log_native_error(&app, "native.keychain_store_failed", "Keychain store failed", err);
    })
}

#[tauri::command]
fn get_secret(app: tauri::AppHandle, account: &str) -> Result<Option<String>, String> {
    let ks = KeyStore::new();
    ks.retrieve(account).inspect_err(|err| {
        log_native_error(&app, "native.keychain_read_failed", "Keychain read failed", err);
    })
}

#[tauri::command]
fn remove_secret(app: tauri::AppHandle, account: &str) -> Result<(), String> {
    let ks = KeyStore::new();
    ks.remove(account).inspect_err(|err| {
        log_native_error(&app, "native.keychain_remove_failed", "Keychain remove failed", err);
    })
}

#[tauri::command]
fn is_keystore_available() -> bool {
    KeyStore::is_available()
}

#[tauri::command]
fn is_biometric_unlock_available() -> bool {
    biometric_keystore::is_available()
}

#[tauri::command]
fn store_biometric_unlock_key(
    app: tauri::AppHandle,
    email: &str,
    user_key_b64: &str,
) -> Result<(), String> {
    biometric_keystore::store(email, user_key_b64).inspect_err(|err| {
        log_native_error(
            &app,
            "native.biometric_store_failed",
            "Biometric unlock key store failed",
            err,
        );
    })
}

#[tauri::command]
fn get_biometric_unlock_key(
    app: tauri::AppHandle,
    email: &str,
) -> Result<Option<String>, String> {
    biometric_keystore::get(email).inspect_err(|err| {
        log_native_error(
            &app,
            "native.biometric_read_failed",
            "Biometric unlock key read failed",
            err,
        );
    })
}

#[tauri::command]
fn remove_biometric_unlock_key(app: tauri::AppHandle, email: &str) -> Result<(), String> {
    biometric_keystore::remove(email).inspect_err(|err| {
        log_native_error(
            &app,
            "native.biometric_remove_failed",
            "Biometric unlock key remove failed",
            err,
        );
    })
}

#[tauri::command]
fn has_biometric_unlock_key(email: &str) -> bool {
    biometric_keystore::has_key(email)
}

#[tauri::command]
fn get_connected_browsers() -> Vec<paired_browsers::PairedBrowser> {
    paired_browsers::read_pairings()
}

#[tauri::command]
fn remove_browser(origin: &str) {
    paired_browsers::remove_pairing(origin);
}

#[tauri::command]
fn append_app_log(app: tauri::AppHandle, entry: AppLogEntry) -> Result<(), String> {
    logger::append_app_log(&app, entry)
}

#[tauri::command]
fn read_app_logs(app: tauri::AppHandle) -> Result<String, String> {
    logger::read_app_logs(&app)
}

#[tauri::command]
fn get_app_log_path(app: tauri::AppHandle) -> Result<String, String> {
    logger::get_app_log_path(&app)
}

#[tauri::command]
fn export_app_logs_to_path(app: tauri::AppHandle, target_path: String) -> Result<(), String> {
    logger::export_app_logs_to_path(&app, &target_path)
}

#[tauri::command]
fn write_export_files(target_dir: String, files: Vec<ExportFile>) -> Result<Vec<String>, String> {
    let target = PathBuf::from(target_dir);
    if !target.is_dir() {
        return Err("Target directory does not exist".to_string());
    }

    let mut written = Vec::new();
    for file in files {
        let safe_name = file
            .filename
            .chars()
            .filter(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '.' | '-' | '_'))
            .collect::<String>();
        if safe_name.is_empty() {
            return Err("Invalid export filename".to_string());
        }

        let path = target.join(safe_name);
        fs::write(&path, file.content).map_err(|err| err.to_string())?;
        written.push(path.to_string_lossy().to_string());
    }

    Ok(written)
}

#[tauri::command]
fn get_native_host_diagnostics() -> Result<native_host_registration::NativeHostDiagnostics, String> {
    native_host_registration::collect_diagnostics()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(logger::tauri_log_plugin())
        .setup(|app| {
            let app_handle = app.handle().clone();
            let panic_handle = app_handle.clone();
            std::panic::set_hook(Box::new(move |panic_info| {
                let message = panic_info
                    .payload()
                    .downcast_ref::<&str>()
                    .map(|s| s.to_string())
                    .or_else(|| panic_info.payload().downcast_ref::<String>().cloned())
                    .unwrap_or_else(|| "Rust panic".to_string());
                let location = panic_info
                    .location()
                    .map(|loc| format!("{}:{}:{}", loc.file(), loc.line(), loc.column()));
                let _ = logger::append_app_log(
                    &panic_handle,
                    AppLogEntry {
                        level: Some("error".to_string()),
                        event: "rust.panic".to_string(),
                        message,
                        source: Some("rust.panic".to_string()),
                        fields: Some(serde_json::json!({ "location": location })),
                        context: None,
                    },
                );
            }));

            if let Err(err) = native_host_registration::ensure_registered() {
                let _ = logger::append_app_log(
                    &app_handle,
                    AppLogEntry {
                        level: Some("warn".to_string()),
                        event: "native_host.registration_failed".to_string(),
                        message: "Native host registration failed".to_string(),
                        source: Some("native_host.registration".to_string()),
                        fields: Some(serde_json::json!({ "error": err })),
                        context: None,
                    },
                );
            }
            Ok(())
        })
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            store_secret,
            get_secret,
            remove_secret,
            is_keystore_available,
            is_biometric_unlock_available,
            store_biometric_unlock_key,
            get_biometric_unlock_key,
            remove_biometric_unlock_key,
            has_biometric_unlock_key,
            get_connected_browsers,
            remove_browser,
            append_app_log,
            read_app_logs,
            get_app_log_path,
            export_app_logs_to_path,
            write_export_files,
            get_native_host_diagnostics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
