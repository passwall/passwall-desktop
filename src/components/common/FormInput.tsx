import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Copy, Shuffle } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  showToggle?: boolean;
  copyable?: boolean;
  error?: string;
  onGenerate?: () => void;
}

export default function FormInput({
  label,
  showToggle = false,
  copyable = false,
  error,
  type = "text",
  className = "",
  value,
  onGenerate,
  ...props
}: FormInputProps) {
  const [visible, setVisible] = useState(false);
  const { copy } = useClipboard();

  const inputType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type={inputType}
          value={value}
          className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary pr-20"
          {...props}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              className="p-1 text-text-muted hover:text-primary rounded"
              title="Generate"
            >
              <Shuffle size={14} />
            </button>
          )}
          {showToggle && (
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="p-1 text-text-muted hover:text-text-secondary rounded"
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          {copyable && value && (
            <button
              type="button"
              onClick={() => copy(String(value))}
              className="p-1 text-text-muted hover:text-text-secondary rounded"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
