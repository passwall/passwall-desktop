import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Star, StarOff } from "lucide-react";
import Button from "@/components/common/Button";
import { useVaultStore } from "@/stores/vault-store";
import { useUiStore } from "@/stores/ui-store";
import { useNavigate } from "react-router";
import type { VaultItem, ItemType } from "@/types";

interface ItemDetailProps {
  item: VaultItem;
  basePath: string;
  children: React.ReactNode;
  renderEditForm: (onSaved: () => void) => React.ReactNode;
  itemType: ItemType;
}

export default function ItemDetail({
  item,
  basePath,
  children,
  renderEditForm,
  itemType,
}: ItemDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deleteItem = useVaultStore((s) => s.deleteItem);
  const updateItem = useVaultStore((s) => s.updateItem);
  const addNotification = useUiStore((s) => s.addNotification);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t("Delete") + "?")) return;
    setDeleting(true);
    try {
      await deleteItem(item.id);
      navigate(basePath);
    } catch {
      addNotification("error", "Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await updateItem({
        id: item.id,
        form: { ...item, is_favorite: !item.is_favorite } as Record<string, unknown>,
        type: itemType,
      });
    } catch {
      addNotification("error", "Failed to update item");
    }
  };

  if (editing) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("Edit")}
          </h2>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            {t("Cancel")}
          </Button>
        </div>
        {renderEditForm(() => setEditing(false))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {(item.title as string) || "Untitled"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className="p-2 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-warning transition-colors"
          >
            {item.is_favorite ? (
              <Star size={18} fill="currentColor" className="text-warning" />
            ) : (
              <StarOff size={18} />
            )}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-primary transition-colors"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
