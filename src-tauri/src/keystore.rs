use keyring::Entry;

const SERVICE_NAME: &str = "io.passwall.desktop";
const MAX_ACCOUNT_LEN: usize = 512;
const MAX_SECRET_LEN: usize = 8192;

pub struct KeyStore;

impl KeyStore {
    pub fn new() -> Self {
        Self
    }

    fn validate_account(account: &str) -> Result<(), String> {
        if account.is_empty() {
            return Err("Account cannot be empty".into());
        }
        if account.len() > MAX_ACCOUNT_LEN {
            return Err("Account too long".into());
        }
        Ok(())
    }

    fn validate_secret(secret: &str) -> Result<(), String> {
        if secret.is_empty() {
            return Err("Secret cannot be empty".into());
        }
        if secret.len() > MAX_SECRET_LEN {
            return Err("Secret too large".into());
        }
        Ok(())
    }

    fn entry_for(account: &str) -> Result<Entry, String> {
        Entry::new(SERVICE_NAME, account).map_err(|e| format!("Keyring error: {}", e))
    }

    pub fn store(&self, account: &str, secret: &str) -> Result<(), String> {
        Self::validate_account(account)?;
        Self::validate_secret(secret)?;
        let entry = Self::entry_for(account)?;
        entry
            .set_password(secret)
            .map_err(|_| "Failed to store secret in keychain".into())
    }

    pub fn retrieve(&self, account: &str) -> Result<Option<String>, String> {
        Self::validate_account(account)?;
        let entry = Self::entry_for(account)?;
        match entry.get_password() {
            Ok(secret) => Ok(Some(secret)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(_) => Err("Failed to retrieve secret from keychain".into()),
        }
    }

    pub fn remove(&self, account: &str) -> Result<(), String> {
        Self::validate_account(account)?;
        let entry = Self::entry_for(account)?;
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(_) => Err("Failed to remove secret from keychain".into()),
        }
    }

    pub fn is_available() -> bool {
        Entry::new(SERVICE_NAME, "__passwall_availability_check__").is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::{KeyStore, MAX_SECRET_LEN};

    #[test]
    fn validate_account_rejects_empty() {
        assert!(KeyStore::validate_account("").is_err());
    }

    #[test]
    fn validate_account_accepts_arbitrary() {
        assert!(KeyStore::validate_account("access_token:user@example.com").is_ok());
    }

    #[test]
    fn validate_secret_rejects_empty() {
        assert!(KeyStore::validate_secret("").is_err());
    }

    #[test]
    fn validate_secret_rejects_too_large() {
        let huge = "a".repeat(MAX_SECRET_LEN + 1);
        assert!(KeyStore::validate_secret(&huge).is_err());
    }

    #[test]
    fn validate_secret_accepts_jwt_like() {
        assert!(KeyStore::validate_secret("eyJhbGciOi.ab_cd-ef.signature").is_ok());
    }
}
