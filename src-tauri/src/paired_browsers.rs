use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const MAX_PAIRED_BROWSERS: usize = 20;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairedBrowser {
    pub origin: String,
    #[serde(default, rename = "connectedAt")]
    pub connected_at: u64,
}

fn is_valid_chrome_origin(origin: &str) -> bool {
    if !origin.starts_with("chrome-extension://") || !origin.ends_with('/') {
        return false;
    }
    let id_part = &origin["chrome-extension://".len()..origin.len() - 1];
    id_part.len() == 32 && id_part.chars().all(|c| c.is_ascii_lowercase() && c <= 'p')
}

fn pairings_path() -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            return PathBuf::from(home)
                .join("Library/Application Support/passwall/paired-browsers.json");
        }
    }
    #[cfg(target_os = "linux")]
    {
        if let Ok(xdg) = std::env::var("XDG_DATA_HOME") {
            return PathBuf::from(xdg).join("passwall/paired-browsers.json");
        }
        if let Some(home) = std::env::var_os("HOME") {
            return PathBuf::from(home).join(".local/share/passwall/paired-browsers.json");
        }
    }
    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = std::env::var("APPDATA") {
            return PathBuf::from(appdata).join("passwall/paired-browsers.json");
        }
    }
    PathBuf::from("paired-browsers.json")
}

pub fn read_pairings() -> Vec<PairedBrowser> {
    let path = pairings_path();
    let data = match fs::read_to_string(&path) {
        Ok(d) => d,
        Err(_) => return Vec::new(),
    };
    let parsed: Vec<PairedBrowser> = match serde_json::from_str(&data) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };
    parsed
        .into_iter()
        .filter(|p| is_valid_chrome_origin(&p.origin))
        .collect()
}

fn save_pairings(list: &[PairedBrowser]) {
    let path = pairings_path();
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let safe: Vec<&PairedBrowser> = list
        .iter()
        .filter(|p| is_valid_chrome_origin(&p.origin))
        .rev()
        .take(MAX_PAIRED_BROWSERS)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();
    if let Ok(json) = serde_json::to_string_pretty(&safe) {
        let _ = fs::write(&path, json);
    }
}

pub fn add_pairing(origin: &str) {
    if !is_valid_chrome_origin(origin) {
        return;
    }
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let mut list: Vec<PairedBrowser> = read_pairings()
        .into_iter()
        .filter(|p| p.origin != origin)
        .collect();
    list.push(PairedBrowser {
        origin: origin.to_string(),
        connected_at: ts,
    });
    save_pairings(&list);
}

pub fn remove_pairing(origin: &str) {
    let list: Vec<PairedBrowser> = read_pairings()
        .into_iter()
        .filter(|p| p.origin != origin)
        .collect();
    save_pairings(&list);
}
