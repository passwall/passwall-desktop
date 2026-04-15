interface CompanyLogoProps {
  url?: string;
  name?: string;
  size?: number;
}

export default function CompanyLogo({
  url,
  name = "",
  size = 32,
}: CompanyLogoProps) {
  const initial = name.charAt(0).toUpperCase() || "?";
  const hostname = url
    ? (() => {
        try {
          const parsed = url.includes("://")
            ? new URL(url)
            : new URL(`https://${url}`);
          return parsed.hostname;
        } catch {
          return "";
        }
      })()
    : "";
  const faviconUrl = hostname
    ? `https://icons.duckduckgo.com/ip3/${hostname}.ico`
    : "";

  if (faviconUrl) {
    return (
      <img
        src={faviconUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove(
            "hidden"
          );
        }}
      />
    );
  }

  return (
    <div
      className="bg-primary/10 text-primary rounded flex items-center justify-center font-semibold text-sm"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
