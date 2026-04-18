import { useTranslation } from "react-i18next";
import { RefreshCw, Copy } from "lucide-react";
import {
  usePasswordGenerator,
  LENGTH_CHIPS,
} from "@/hooks/usePasswordGenerator";
import { useClipboard } from "@/hooks/useClipboard";

export default function PasswordGenerator() {
  const { t } = useTranslation();
  const { password, options, entropy, strength, setOptions, generate } =
    usePasswordGenerator();
  const { copy } = useClipboard();

  const strengthColors: Record<string, string> = {
    VeryStrong: "bg-green-500",
    Strong: "bg-green-400",
    Good: "bg-yellow-400",
    Fair: "bg-orange-400",
    Weak: "bg-red-400",
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          {t("PasswordGenerator")}
        </h2>
        <p className="text-sm text-text-muted mb-6">
          {t("PasswordGeneratorDesc")}
        </p>

        <div className="bg-surface-secondary border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-text-primary break-all select-text">
              {password}
            </code>
            <button
              onClick={() => copy(password)}
              className="p-2 hover:bg-border rounded-lg text-text-muted hover:text-text-primary transition-colors"
              title={t("Copy")}
            >
              <Copy size={16} />
            </button>
            <button
              onClick={generate}
              className="p-2 hover:bg-border rounded-lg text-text-muted hover:text-text-primary transition-colors"
              title={t("Generate")}
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${strengthColors[strength] || "bg-gray-400"}`}
                style={{
                  width: `${Math.min(100, (entropy / 128) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap">
              {t(strength)} ({entropy} bits)
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center justify-between text-sm text-text-primary mb-2">
              <span>{t("Length")}</span>
              <span className="font-mono text-text-muted">{options.length}</span>
            </label>
            <input
              type="range"
              min="8"
              max="64"
              value={options.length}
              onChange={(e) =>
                setOptions({ ...options, length: parseInt(e.target.value) })
              }
              className="w-full accent-primary"
            />
            <div className="flex gap-2 mt-2">
              {LENGTH_CHIPS.map((len) => (
                <button
                  key={len}
                  onClick={() => setOptions({ ...options, length: len })}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    options.length === len
                      ? "bg-primary text-white border-primary"
                      : "border-border text-text-secondary hover:border-primary hover:text-primary"
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {(
            [
              ["uppercase", "UppercaseLetters"],
              ["lowercase", "LowercaseLetters"],
              ["numbers", "Numbers"],
              ["symbols", "Symbols"],
              ["excludeAmbiguous", "ExcludeAmbiguous"],
            ] as const
          ).map(([key, labelKey]) => (
            <label
              key={key}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm text-text-primary">{t(labelKey)}</span>
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) =>
                  setOptions({ ...options, [key]: e.target.checked })
                }
                className="w-4 h-4 accent-primary rounded"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
