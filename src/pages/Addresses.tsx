import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "react-router";
import ItemList from "@/components/layout/ItemList";
import ItemDetail from "@/components/layout/ItemDetail";
import AddressForm from "@/components/items/AddressForm";
import FormInput from "@/components/common/FormInput";
import { useVaultStore } from "@/stores/vault-store";
import { ItemType } from "@/types";

export default function Addresses() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const allItems = useVaultStore((s) => s.items);
  const itemsLoading = useVaultStore((s) => s.itemsLoading);
  const items = allItems.filter((i) => i.item_type === ItemType.Address);
  const isCreate = location.pathname.endsWith("/create");
  const selectedItem = id ? items.find((i) => String(i.id) === id) : null;

  return (
    <div className="flex h-full">
      <ItemList
        items={items}
        loading={itemsLoading}
        basePath="/addresses"
        createLabel={t("NewAddress")}
        renderSubtitle={(item) => (item.address as string) || ""}
      />

      <div className="flex-1 min-h-0">
        {isCreate ? (
          <div className="p-6 overflow-y-auto h-full">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("NewAddress")}
            </h2>
            <AddressForm />
          </div>
        ) : selectedItem ? (
          <ItemDetail
            item={selectedItem}
            basePath="/addresses"
            itemType={ItemType.Address}
            renderEditForm={(onSaved) => (
              <AddressForm
                initial={selectedItem as Record<string, unknown>}
                itemId={selectedItem.id}
                onSaved={onSaved}
              />
            )}
          >
            <div className="space-y-3">
              {[
                ["FirstName", "first_name"],
                ["MiddleName", "middle_name"],
                ["LastName", "last_name"],
                ["Company", "company"],
                ["AddressLine1", "address1"],
                ["AddressLine2", "address2"],
                ["City", "city"],
                ["State", "state"],
                ["ZIP", "zip"],
                ["Country", "country"],
                ["Phone", "phone"],
                ["Email", "email"],
              ]
                .filter(([, key]) => selectedItem[key])
                .map(([label, key]) => (
                  <FormInput
                    key={key}
                    label={t(label)}
                    value={(selectedItem[key] as string) || ""}
                    readOnly
                    copyable
                  />
                ))}
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
