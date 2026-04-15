import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "react-router";
import ItemList from "@/components/layout/ItemList";
import ItemDetail from "@/components/layout/ItemDetail";
import NoteForm from "@/components/items/NoteForm";
import { useVaultStore } from "@/stores/vault-store";
import { ItemType } from "@/types";

export default function Notes() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const allItems = useVaultStore((s) => s.items);
  const itemsLoading = useVaultStore((s) => s.itemsLoading);
  const items = allItems.filter((i) => i.item_type === ItemType.Note);
  const isCreate = location.pathname.endsWith("/create");
  const selectedItem = id ? items.find((i) => String(i.id) === id) : null;

  return (
    <div className="flex h-full">
      <ItemList
        items={items}
        loading={itemsLoading}
        basePath="/notes"
        createLabel={t("NewPrivateNote")}
        renderSubtitle={(item) => {
          const text = (item.notes as string) || (item.note as string) || "";
          return text.substring(0, 60);
        }}
      />

      <div className="flex-1 min-h-0">
        {isCreate ? (
          <div className="p-6 overflow-y-auto h-full">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("NewPrivateNote")}
            </h2>
            <NoteForm />
          </div>
        ) : selectedItem ? (
          <ItemDetail
            item={selectedItem}
            basePath="/notes"
            itemType={ItemType.Note}
            renderEditForm={(onSaved) => (
              <NoteForm
                initial={selectedItem as Record<string, unknown>}
                itemId={selectedItem.id}
                onSaved={onSaved}
              />
            )}
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t("Title")}
                </label>
                <p className="text-sm text-text-primary font-medium">
                  {(selectedItem.title as string) || ""}
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t("Note")}
                </label>
                <p className="text-sm text-text-primary bg-surface-secondary border border-border rounded-lg px-3 py-3 whitespace-pre-wrap min-h-32">
                  {(selectedItem.notes as string) ||
                    (selectedItem.note as string) ||
                    ""}
                </p>
              </div>
            </div>
          </ItemDetail>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            {t("SelectItem")}
          </div>
        )}
      </div>
    </div>
  );
}
