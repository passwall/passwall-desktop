use chrono::{SecondsFormat, Utc};
use flate2::write::GzEncoder;
use flate2::Compression;
use serde_json::{json, Value};
use std::env;
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

const APP_IDENTIFIER: &str = "io.passwall.desktop";
const APP_NAME: &str = "Passwall";
const APP_LOG_FILENAME: &str = "passwall.ndjson";
const MAX_LOG_FILE_SIZE_BYTES: u64 = 30 * 1024 * 1024;
const MAX_ROTATED_FILES: usize = 10;

fn native_host_log_dir() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        let home = env::var_os("HOME")?;
        return Some(PathBuf::from(home).join("Library/Logs").join(APP_IDENTIFIER));
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(xdg_state_home) = env::var_os("XDG_STATE_HOME") {
            return Some(PathBuf::from(xdg_state_home).join(APP_IDENTIFIER));
        }
        let home = env::var_os("HOME")?;
        return Some(PathBuf::from(home).join(".local/state").join(APP_IDENTIFIER));
    }

    #[cfg(target_os = "windows")]
    {
        let local_app_data = env::var_os("LOCALAPPDATA")?;
        return Some(PathBuf::from(local_app_data).join(APP_IDENTIFIER).join("logs"));
    }

    #[allow(unreachable_code)]
    None
}

fn rotated_gz_path(log_file_path: &Path, index: usize) -> PathBuf {
    PathBuf::from(format!("{}.{}.gz", log_file_path.display(), index))
}

fn rotate_if_needed(log_file_path: &Path) {
    let metadata = match fs::metadata(log_file_path) {
        Ok(m) => m,
        Err(_) => return,
    };

    if metadata.len() < MAX_LOG_FILE_SIZE_BYTES {
        return;
    }

    let oldest = rotated_gz_path(log_file_path, MAX_ROTATED_FILES);
    let _ = fs::remove_file(&oldest);

    for index in (1..MAX_ROTATED_FILES).rev() {
        let current = rotated_gz_path(log_file_path, index);
        let next = rotated_gz_path(log_file_path, index + 1);
        if current.exists() {
            let _ = fs::rename(&current, &next);
        }
    }

    if let Ok(content) = fs::read(log_file_path) {
        let gz_dest = rotated_gz_path(log_file_path, 1);
        if let Ok(gz_file) = File::create(&gz_dest) {
            let mut encoder = GzEncoder::new(gz_file, Compression::default());
            if encoder.write_all(&content).is_ok() {
                let _ = encoder.finish();
                let _ = File::create(log_file_path);
            }
        }
    }
}

fn write(level: &str, event: &str, message: &str, fields: Value) {
    let Some(log_dir) = native_host_log_dir() else {
        return;
    };

    if fs::create_dir_all(&log_dir).is_err() {
        return;
    }

    let log_file_path = log_dir.join(APP_LOG_FILENAME);
    rotate_if_needed(&log_file_path);

    let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
    else {
        return;
    };

    let line = json!({
        "schema_version": 1,
        "timestamp": Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true),
        "level": level,
        "event": event,
        "message": message,
        "app": {
            "name": APP_NAME,
            "version": env!("CARGO_PKG_VERSION"),
            "identifier": APP_IDENTIFIER,
        },
        "runtime": {
            "os": env::consts::OS,
            "arch": env::consts::ARCH,
            "tauri": false,
            "release": !cfg!(debug_assertions),
        },
        "source": "native_messaging_host",
        "context": {},
        "fields": fields,
    });

    let _ = writeln!(file, "{line}");
}

pub fn info(event: &str, message: &str, fields: Value) {
    write("info", event, message, fields);
}

pub fn warn(event: &str, message: &str, fields: Value) {
    write("warn", event, message, fields);
}
