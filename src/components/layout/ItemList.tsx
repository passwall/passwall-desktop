import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useUiStore } from "@/stores/ui-store";
import CompanyLogo from "@/components/common/CompanyLogo";
import type { VaultItem } from "@/types";

interface ItemListProps {
  items: VaultItem[];
  loading: boolean;
  basePath: string;
  createLabel: string;
  renderSubtitle?: (item: VaultItem) => string;
}

export default function ItemList({
  items,
  loading,
  basePath,
  createLabel,
  renderSubtitle,
}: ItemListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const searchQuery = useUiStore((s) => s.searchQuery);

  const filteredItems = searchQuery
    ? items.filter((item) => {
        const title = ((item.title as string) || "").toLowerCase();
        const subtitle = renderSubtitle
          ? renderSubtitle(item).toLowerCase()
          : "";
        const q = searchQuery.toLowerCase();
        return title.includes(q) || subtitle.includes(q);
      })
    : items;

  return (
    <div className="w-72 border-r border-border flex flex-col h-full bg-surface shrink-0">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          {filteredItems.length} {t("AllItems").toLowerCase()}
        </span>
        <button
          onClick={() => navigate(`${basePath}/create`)}
          className="p-1.5 rounded-lg hover:bg-surface-secondary text-primary transition-colors"
          title={createLabel}
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-text-muted">{t("NothingHere")}</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`${basePath}/${item.id}`)}
              className={`w-full text-left px-3 py-3 border-b border-border/50 flex items-center gap-3 transition-colors ${
                id === String(item.id)
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : "hover:bg-surface-secondary"
              }`}
            >
              <CompanyLogo
                url={(item.url as string) || ""}
                name={(item.title as string) || ""}
                size={28}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {(item.title as string) || "Untitled"}
                </p>
                {renderSubtitle && (
                  <p className="text-xs text-text-muted truncate">
                    {renderSubtitle(item)}
                  </p>
                )}
              </div>
              {item.is_favorite && (
                <span className="text-warning text-xs">&#9733;</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
