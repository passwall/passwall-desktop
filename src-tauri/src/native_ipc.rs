//! ECDH P-256 + HKDF + AES-256-GCM for extension ↔ desktop native messaging (mirrors extension `ipc-crypto.js`).

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use hkdf::Hkdf;
use p256::ecdh::EphemeralSecret;
use p256::elliptic_curve::sec1::ToEncodedPoint;
use p256::PublicKey;
use rand_core::OsRng;
use serde_json::json;
use sha2::Sha256;
use std::sync::{Mutex, OnceLock};

const HKDF_INFO: &[u8] = b"passwall-ipc-v1";

struct NmCryptoState {
    aes_key: [u8; 32],
    send_nonce: u64,
}

fn session_cell() -> &'static Mutex<Option<NmCryptoState>> {
    static S: OnceLock<Mutex<Option<NmCryptoState>>> = OnceLock::new();
    S.get_or_init(|| Mutex::new(None))
}

fn nonce_to_iv(n: u64) -> [u8; 12] {
    let mut iv = [0u8; 12];
    iv[4..12].copy_from_slice(&n.to_be_bytes());
    iv
}

/// Returns `(success, payload)` where payload is either `{ desktopPublicKey }` or `{ message }`.
pub fn handshake(_id: Option<String>, payload: &Option<serde_json::Value>) -> (bool, serde_json::Value) {
    let ext_b64 = match payload
        .as_ref()
        .and_then(|p| p.get("extensionPublicKey"))
        .and_then(|v| v.as_str())
    {
        Some(s) if !s.is_empty() => s,
        _ => {
            return (
                false,
                json!({"message": "extensionPublicKey is required"}),
            );
        }
    };

    let ext_raw = match B64.decode(ext_b64.as_bytes()) {
        Ok(b) => b,
        Err(_) => return (false, json!({"message": "Invalid extensionPublicKey base64"})),
    };

    let peer = match PublicKey::from_sec1_bytes(ext_raw.as_slice()) {
        Ok(pk) => pk,
        Err(_) => return (false, json!({"message": "Invalid extension public key (SEC1)"})),
    };

    let ephemeral = EphemeralSecret::random(&mut OsRng);
    let local_pk = PublicKey::from(&ephemeral);
    let shared = ephemeral.diffie_hellman(&peer.into());

    let hk = Hkdf::<Sha256>::new(None, shared.raw_secret_bytes().as_slice());
    let mut aes_key = [0u8; 32];
    if hk.expand(HKDF_INFO, &mut aes_key).is_err() {
        return (false, json!({"message": "HKDF expand failed"}));
    }

    let enc_point = local_pk.to_encoded_point(false);
    let desktop_pub_b64 = B64.encode(enc_point.as_bytes());

    if let Ok(mut g) = session_cell().lock() {
        *g = Some(NmCryptoState {
            aes_key,
            send_nonce: 0,
        });
    }

    (true, json!({ "desktopPublicKey": desktop_pub_b64 }))
}

/// Encrypt `{ "userKey": ... }` for the extension when a session exists.
pub fn encrypt_user_key_payload_if_session(user_key_b64: &str) -> Option<serde_json::Value> {
    let mut guard = session_cell().lock().ok()?;
    let st = guard.as_mut()?;

    let n = st.send_nonce;
    st.send_nonce = st.send_nonce.saturating_add(1);

    let plaintext = serde_json::to_vec(&json!({ "userKey": user_key_b64 })).ok()?;
    let key = Key::<Aes256Gcm>::from_slice(&st.aes_key);
    let cipher = Aes256Gcm::new(key);
    let iv = nonce_to_iv(n);
    let nonce = Nonce::from_slice(&iv);
    let ciphertext = cipher.encrypt(nonce, plaintext.as_ref()).ok()?;

    Some(json!({
        "ciphertext": B64.encode(ciphertext),
        "nonce": n,
    }))
}
