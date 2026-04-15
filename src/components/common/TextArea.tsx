import type { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export default function TextArea({
  label,
  className = "",
  ...props
}: TextAreaProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
        {label}
      </label>
      <textarea
        className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y min-h-20"
        {...props}
      />
    </div>
  );
}
