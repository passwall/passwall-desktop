import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "@/stores/ui-store";

export default function SearchBar() {
  const { t } = useTranslation();
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);

  return (
    <div className="relative w-72 shrink-0">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        size={16}
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t("SearchPlaceholder")}
        className="w-full pl-9 pr-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}
