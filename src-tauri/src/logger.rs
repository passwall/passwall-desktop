use chrono::{SecondsFormat, Utc};
use flate2::write::GzEncoder;
use flate2::read::GzDecoder;
use flate2::Compression;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env::consts::{ARCH, OS};
use std::fs::{self, File, OpenOptions};
use std::io::{Read as _, Write};
use std::path::{Path, PathBuf};
use tauri::Manager;
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

const APP_LOG_FILENAME: &str = "passwall.ndjson";
const PLUGIN_LOG_FILENAME: &str = "passwall-plugin";
const MAX_LOG_FILE_SIZE_BYTES: u64 = 30 * 1024 * 1024;
const MAX_ROTATED_FILES: usize = 10;

#[derive(Deserialize)]
pub struct AppLogEntry {
    pub level: Option<String>,
    pub event: String,
    pub message: String,
    pub source: Option<String>,
    pub fields: Option<Value>,
    pub context: Option<Value>,
}

#[derive(Serialize)]
struct RuntimeInfo {
    os: &'static str,
    arch: &'static str,
    tauri: bool,
    release: bool,
}

fn resolve_log_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_log_dir()
        .map_err(|e| format!("Failed to resolve app log dir: {e}"))
}

fn rotated_gz_path(log_file_path: &Path, index: usize) -> PathBuf {
    PathBuf::from(format!("{}.{}.gz", log_file_path.display(), index))
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

    // Remove the oldest archive if it exists
    let oldest = rotated_gz_path(log_file_path, MAX_ROTATED_FILES);
    if oldest.exists() {
        fs::remove_file(&oldest)
            .map_err(|e| format!("Failed to remove oldest rotated log: {e}"))?;
    }

    // Shift existing archives: N-1 → N, N-2 → N-1, ..., 1 → 2
    for index in (1..MAX_ROTATED_FILES).rev() {
        let current = rotated_gz_path(log_file_path, index);
        let next = rotated_gz_path(log_file_path, index + 1);
        if current.exists() {
            fs::rename(&current, &next)
                .map_err(|e| format!("Failed to shift rotated log file: {e}"))?;
        }
    }

    // Compress the current log file into slot 1
    let content = fs::read(log_file_path)
        .map_err(|e| format!("Failed to read log file for compression: {e}"))?;

    let gz_dest = rotated_gz_path(log_file_path, 1);
    let gz_file = File::create(&gz_dest)
        .map_err(|e| format!("Failed to create gzip archive: {e}"))?;
    let mut encoder = GzEncoder::new(gz_file, Compression::default());
    encoder
        .write_all(&content)
        .map_err(|e| format!("Failed to write gzip archive: {e}"))?;
    encoder
        .finish()
        .map_err(|e| format!("Failed to finalize gzip archive: {e}"))?;

    // Truncate the active log file
    File::create(log_file_path)
        .map_err(|e| format!("Failed to truncate log file after rotation: {e}"))?;

    Ok(())
}

fn append_json_line(app: &tauri::AppHandle, line: Value) -> Result<(), String> {
    let log_dir = resolve_log_dir(app)?;
    fs::create_dir_all(&log_dir).map_err(|e| format!("Failed to create app log dir: {e}"))?;

    let log_file_path = log_dir.join(APP_LOG_FILENAME);
    rotate_logs_if_needed(&log_file_path)?;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
        .map_err(|e| format!("Failed to open log file: {e}"))?;

    writeln!(file, "{line}").map_err(|e| format!("Failed to write log entry: {e}"))
}

fn normalize_level(level: Option<&str>) -> &'static str {
    match level.unwrap_or("info").to_ascii_lowercase().as_str() {
        "trace" => "trace",
        "debug" => "debug",
        "warn" | "warning" => "warn",
        "error" => "error",
        _ => "info",
    }
}

fn app_log_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(resolve_log_dir(app)?.join(APP_LOG_FILENAME))
}

fn read_gz_to_string(path: &Path) -> Option<String> {
    let file = File::open(path).ok()?;
    let mut decoder = GzDecoder::new(file);
    let mut content = String::new();
    decoder.read_to_string(&mut content).ok()?;
    Some(content)
}

pub fn tauri_log_plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri_plugin_log::Builder::new()
        .format(|out, message, record| {
            let line = json!({
                "schema_version": 1,
                "timestamp": Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true),
                "level": record.level().as_str().to_ascii_lowercase(),
                "event": "runtime.log",
                "message": message.to_string(),
                "app": {
                    "name": "Passwall",
                    "version": env!("CARGO_PKG_VERSION"),
                    "identifier": "io.passwall.desktop",
                },
                "runtime": {
                    "os": OS,
                    "arch": ARCH,
                    "tauri": true,
                    "release": !cfg!(debug_assertions),
                },
                "source": record.target(),
                "context": {},
                "fields": {
                    "file": record.file(),
                    "line": record.line(),
                },
            });
            out.finish(format_args!("{line}"));
        })
        .target(Target::new(TargetKind::LogDir {
            file_name: Some(PLUGIN_LOG_FILENAME.to_string()),
        }))
        .max_file_size(MAX_LOG_FILE_SIZE_BYTES as u128)
        .rotation_strategy(RotationStrategy::KeepSome(MAX_ROTATED_FILES))
        .level(log::LevelFilter::Info)
        .build()
}

pub fn append_app_log(app: &tauri::AppHandle, entry: AppLogEntry) -> Result<(), String> {
    let level = normalize_level(entry.level.as_deref());
    let package_info = app.package_info();
    let timestamp = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
    let runtime = RuntimeInfo {
        os: OS,
        arch: ARCH,
        tauri: true,
        release: !cfg!(debug_assertions),
    };

    let line = json!({
        "schema_version": 1,
        "timestamp": timestamp,
        "level": level,
        "event": entry.event,
        "message": entry.message,
        "app": {
            "name": package_info.name.clone(),
            "version": package_info.version.to_string(),
            "identifier": app.config().identifier.clone(),
        },
        "runtime": runtime,
        "source": entry.source,
        "context": entry.context.unwrap_or_else(|| json!({})),
        "fields": entry.fields.unwrap_or_else(|| json!({})),
    });

    append_json_line(app, line)
}

pub fn read_app_logs(app: &tauri::AppHandle) -> Result<String, String> {
    let log_file_path = app_log_path(app)?;
    let mut logs = String::new();

    // Read rotated gzip archives from oldest to newest
    for index in (1..=MAX_ROTATED_FILES).rev() {
        let rotated = rotated_gz_path(&log_file_path, index);
        if let Some(content) = read_gz_to_string(&rotated) {
            logs.push_str(&content);
            if !content.ends_with('\n') {
                logs.push('\n');
            }
        }
    }

    // Read the current active log file
    match fs::read_to_string(log_file_path) {
        Ok(content) => {
            logs.push_str(&content);
            Ok(logs)
        }
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(logs),
        Err(err) => Err(format!("Failed to read app log file: {err}")),
    }
}

pub fn get_app_log_path(app: &tauri::AppHandle) -> Result<String, String> {
    Ok(app_log_path(app)?.display().to_string())
}

pub fn export_app_logs_to_path(app: &tauri::AppHandle, target_path: &str) -> Result<(), String> {
    if target_path.trim().is_empty() {
        return Err("Export path cannot be empty".into());
    }

    let logs = read_app_logs(app)?;
    if logs.trim().is_empty() {
        return Err("No logs available".into());
    }

    let target = PathBuf::from(target_path);
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create export directory: {e}"))?;
    }

    fs::write(&target, logs).map_err(|e| format!("Failed to export logs: {e}"))
}
