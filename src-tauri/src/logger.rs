use serde::Deserialize;
use serde_json::json;
use std::env::consts::{ARCH, OS};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

const ERROR_LOG_FILENAME: &str = "errors.log";
const MAX_LOG_FILE_SIZE_BYTES: u64 = 5 * 1024 * 1024;
const MAX_ROTATED_FILES: usize = 5;

#[derive(Deserialize)]
pub struct ErrorLogEntry {
    pub source: String,
    pub message: String,
    pub details: Option<String>,
}

fn resolve_log_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_log_dir()
        .map_err(|e| format!("Failed to resolve app log dir: {e}"))
}

fn rotate_logs_if_needed(log_file_path: &Path) -> Result<(), String> {
    let metadata = match fs::metadata(log_file_path) {
        Ok(metadata) => metadata,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(err) => return Err(format!("Failed to read log file metadata: {err}")),
    };

    if metadata.len() < MAX_LOG_FILE_SIZE_BYTES {
        return Ok(());
    }

    for index in (1..=MAX_ROTATED_FILES).rev() {
        let current = if index == 1 {
            log_file_path.to_path_buf()
        } else {
            PathBuf::from(format!("{}.{}", log_file_path.display(), index - 1))
        };
        let next = PathBuf::from(format!("{}.{}", log_file_path.display(), index));

        if current.exists() {
            if next.exists() {
                fs::remove_file(&next)
                    .map_err(|e| format!("Failed to remove rotated log file: {e}"))?;
            }
            fs::rename(&current, &next).map_err(|e| format!("Failed to rotate log file: {e}"))?;
        }
    }

    Ok(())
}

pub fn append_error_log(
    app: &tauri::AppHandle,
    source: &str,
    message: &str,
    details: Option<&str>,
) -> Result<(), String> {
    let log_dir = resolve_log_dir(app)?;
    fs::create_dir_all(&log_dir).map_err(|e| format!("Failed to create app log dir: {e}"))?;

    let log_file_path = log_dir.join(ERROR_LOG_FILENAME);
    rotate_logs_if_needed(&log_file_path)?;

    let ts_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0);

    let app_version = app.package_info().version.to_string();
    let platform = format!("{OS}-{ARCH}");

    let line = json!({
        "ts_ms": ts_ms,
        "level": "error",
        "app_version": app_version,
        "platform": platform,
        "source": source,
        "message": message,
        "details": details,
    });

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
        .map_err(|e| format!("Failed to open log file: {e}"))?;

    writeln!(file, "{line}").map_err(|e| format!("Failed to write log entry: {e}"))
}

pub fn read_error_logs(app: &tauri::AppHandle) -> Result<String, String> {
    let log_dir = resolve_log_dir(app)?;
    let log_file_path = log_dir.join(ERROR_LOG_FILENAME);
    match fs::read_to_string(log_file_path) {
        Ok(content) => Ok(content),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(err) => Err(format!("Failed to read error log file: {err}")),
    }
}

pub fn get_error_log_path(app: &tauri::AppHandle) -> Result<String, String> {
    let log_dir = resolve_log_dir(app)?;
    Ok(log_dir.join(ERROR_LOG_FILENAME).display().to_string())
}

pub fn export_error_logs_to_path(app: &tauri::AppHandle, target_path: &str) -> Result<(), String> {
    if target_path.trim().is_empty() {
        return Err("Export path cannot be empty".into());
    }

    let logs = read_error_logs(app)?;
    if logs.trim().is_empty() {
        return Err("No logs available".into());
    }

    let target = PathBuf::from(target_path);
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create export directory: {e}"))?;
    }

    fs::write(&target, logs).map_err(|e| format!("Failed to export logs: {e}"))
}
