import { useState, useCallback, useEffect } from "react";

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "lI1O0|";

export const LENGTH_CHIPS = [16, 20, 24, 32] as const;

function removeAmbiguous(chars: string): string {
  return chars
    .split("")
    .filter((c) => !AMBIGUOUS.includes(c))
    .join("");
}

function secureRandomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const arr = new Uint32Array(1);
  let val: number;
  do {
    crypto.getRandomValues(arr);
    val = arr[0];
  } while (val >= limit);
  return val % max;
}

function calculateEntropy(length: number, poolSize: number): number {
  if (poolSize <= 0 || length <= 0) return 0;
  return Math.round(length * Math.log2(poolSize));
}

export function getStrengthLabel(entropy: number): string {
  if (entropy >= 128) return "VeryStrong";
  if (entropy >= 80) return "Strong";
  if (entropy >= 60) return "Good";
  if (entropy >= 40) return "Fair";
  return "Weak";
}

export function usePasswordGenerator() {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [password, setPassword] = useState("");
  const [entropy, setEntropy] = useState(0);
  const [strength, setStrength] = useState("Strong");

  const generate = useCallback(() => {
    const sets: { enabled: boolean; chars: string }[] = [
      { enabled: options.uppercase, chars: UPPERCASE },
      { enabled: options.lowercase, chars: LOWERCASE },
      { enabled: options.numbers, chars: NUMBERS },
      { enabled: options.symbols, chars: SYMBOLS },
    ];

    const activeSets = sets.filter((s) => s.enabled);

    if (activeSets.length === 0) {
      activeSets.push({ enabled: true, chars: LOWERCASE });
    }

    let pool = activeSets.map((s) => s.chars).join("");
    if (options.excludeAmbiguous) {
      pool = removeAmbiguous(pool);
    }

    if (pool.length === 0) {
      pool = LOWERCASE;
    }

    const chars: string[] = [];

    // Guarantee at least one character from each active set
    for (const s of activeSets) {
      let setChars = s.chars;
      if (options.excludeAmbiguous) setChars = removeAmbiguous(setChars);
      if (setChars.length > 0) {
        chars.push(setChars[secureRandomIndex(setChars.length)]);
      }
    }

    // Fill the rest randomly from the full pool
    while (chars.length < options.length) {
      chars.push(pool[secureRandomIndex(pool.length)]);
    }

    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = secureRandomIndex(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const result = chars.join("");
    setPassword(result);
    const ent = calculateEntropy(options.length, pool.length);
    setEntropy(ent);
    setStrength(getStrengthLabel(ent));
  }, [options]);

  useEffect(() => {
    generate();
  }, [generate]);

  return {
    password,
    options,
    entropy,
    strength,
    setOptions,
    generate,
  };
}
