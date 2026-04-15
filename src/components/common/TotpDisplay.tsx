import { useState, useEffect, useCallback } from "react";
import { Copy } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";

interface TotpDisplayProps {
  secret: string;
}

async function generateTOTP(secret: string): Promise<string> {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanSecret = secret.replace(/[\s\-=]/g, "").toUpperCase();

  for (const c of cleanSecret) {
    if (base32Chars.indexOf(c) === -1) {
      throw new Error("Invalid base32 character in TOTP secret");
    }
  }

  let bits = "";
  for (const c of cleanSecret) {
    bits += base32Chars.indexOf(c).toString(2).padStart(5, "0");
  }
  const keyBytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < keyBytes.length; i++) {
    keyBytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }

  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  const counterBytes = new Uint8Array(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, counterBytes);
  const hmac = new Uint8Array(sig);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1000000;

  return code.toString().padStart(6, "0");
}

export default function TotpDisplay({ secret }: TotpDisplayProps) {
  const [code, setCode] = useState("------");
  const [remaining, setRemaining] = useState(30);
  const { copy } = useClipboard();

  const refresh = useCallback(async () => {
    try {
      const totp = await generateTOTP(secret);
      setCode(totp);
    } catch {
      setCode("------");
    }
  }, [secret]);

  useEffect(() => {
    refresh();

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const rem = 30 - (now % 30);
      setRemaining(rem);

      if (rem === 30) {
        refresh();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const formatted = `${code.slice(0, 3)} ${code.slice(3)}`;
  const progress = (remaining / 30) * 100;
  const isLow = remaining <= 5;

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
        TOTP
      </label>
      <div className="flex items-center gap-3 bg-surface-secondary border border-border rounded-lg px-3 py-2">
        <span className="text-xl font-mono font-bold text-text-primary tracking-widest flex-1">
          {formatted}
        </span>
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-border"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className={isLow ? "stroke-danger" : "stroke-primary"}
                strokeWidth="3"
                strokeDasharray={`${progress} 100`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s linear" }}
              />
            </svg>
            <span
              className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${isLow ? "text-danger" : "text-text-secondary"}`}
            >
              {remaining}
            </span>
          </div>
          <button
            onClick={() => copy(code)}
            className="p-1 text-text-muted hover:text-text-secondary rounded"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
