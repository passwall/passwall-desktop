//! Passwall Native Messaging Host for Chrome/Firefox Extension
//!
//! Listens on stdin/stdout for JSON messages from the browser extension.
//! Handles requests for keychain operations and secure handshake.

use std::io::{self, Read, Write};
mod keystore;
use keystore::KeyStore;
use serde::{Deserialize, Serialize};
use base64::{engine::general_purpose, Engine as _};

#[derive(Deserialize)]
struct Request {
    v: u8,
    #[serde(rename = "type")]
    req_type: String,
    id: Option<String>,
    payload: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct Response {
    v: u8,
    #[serde(rename = "type")]
    resp_type: String,
    id: Option<String>,
    payload: Option<serde_json::Value>,
}

fn read_message() -> Option<Request> {
    let mut len_buf = [0u8; 4];
    if io::stdin().read_exact(&mut len_buf).is_err() {
        return None;
    }
    let len = u32::from_le_bytes(len_buf) as usize;
    let mut buf = vec![0u8; len];
    if io::stdin().read_exact(&mut buf).is_err() {
        return None;
    }
    serde_json::from_slice(&buf).ok()
}

fn write_message<T: Serialize>(msg: &T) {
    if let Ok(json) = serde_json::to_vec(msg) {
        let len = (json.len() as u32).to_le_bytes();
        let _ = io::stdout().write_all(&len);
        let _ = io::stdout().write_all(&json);
        let _ = io::stdout().flush();
    }
}

fn handle_request(req: Request) -> Response {
    match req.req_type.as_str() {
        "PING" => Response {
            v: 1,
            resp_type: "response".to_string(),
            id: req.id,
            payload: Some(serde_json::json!({"status": "ok"})),
        },
        "GET_USER_KEY" => {
            let email = req.payload.as_ref().and_then(|p| p.get("email")).and_then(|v| v.as_str());
            let ks = KeyStore::new();
            match email {
                Some(email) => match ks.retrieve(email) {
                    Ok(Some(key)) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"userKey": key})),
                    },
                    Ok(None) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"userKey": null})),
                    },
                    Err(e) => Response {
                        v: 1,
                        resp_type: "error".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"message": e})),
                    },
                },
                None => Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(serde_json::json!({"message": "Missing email"})),
                },
            }
        },
        "HAS_USER_KEY" => {
            let email = req.payload.as_ref().and_then(|p| p.get("email")).and_then(|v| v.as_str());
            let ks = KeyStore::new();
            match email {
                Some(email) => match ks.retrieve(email) {
                    Ok(Some(_)) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"exists": true})),
                    },
                    Ok(None) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"exists": false})),
                    },
                    Err(e) => Response {
                        v: 1,
                        resp_type: "error".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"message": e})),
                    },
                },
                None => Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(serde_json::json!({"message": "Missing email"})),
                },
            }
        },
        "STORE_USER_KEY" => {
            let (email, key_b64) = (
                req.payload.as_ref().and_then(|p| p.get("email")).and_then(|v| v.as_str()),
                req.payload.as_ref().and_then(|p| p.get("userKey")).and_then(|v| v.as_str()),
            );
            let ks = KeyStore::new();
            match (email, key_b64) {
                (Some(email), Some(key_b64)) => match ks.store(email, key_b64) {
                    Ok(()) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"status": "ok"})),
                    },
                    Err(e) => Response {
                        v: 1,
                        resp_type: "error".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"message": e})),
                    },
                },
                _ => Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(serde_json::json!({"message": "Missing email or userKey"})),
                },
            }
        },
        "REMOVE_USER_KEY" => {
            let email = req.payload.as_ref().and_then(|p| p.get("email")).and_then(|v| v.as_str());
            let ks = KeyStore::new();
            match email {
                Some(email) => match ks.remove(email) {
                    Ok(()) => Response {
                        v: 1,
                        resp_type: "response".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"status": "ok"})),
                    },
                    Err(e) => Response {
                        v: 1,
                        resp_type: "error".to_string(),
                        id: req.id,
                        payload: Some(serde_json::json!({"message": e})),
                    },
                },
                None => Response {
                    v: 1,
                    resp_type: "error".to_string(),
                    id: req.id,
                    payload: Some(serde_json::json!({"message": "Missing email"})),
                },
            }
        },
        _ => Response {
            v: 1,
            resp_type: "error".to_string(),
            id: req.id,
            payload: Some(serde_json::json!({"message": "Unknown request type"})),
        },
    }
}

fn main() {
    loop {
        if let Some(req) = read_message() {
            let resp = handle_request(req);
            write_message(&resp);
        } else {
            break;
        }
    }
}
