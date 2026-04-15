import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "react-router";
import ItemList from "@/components/layout/ItemList";
import ItemDetail from "@/components/layout/ItemDetail";
import CardForm from "@/components/items/CardForm";
import FormInput from "@/components/common/FormInput";
import { useVaultStore } from "@/stores/vault-store";
import { ItemType } from "@/types";

export default function CreditCards() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const allItems = useVaultStore((s) => s.items);
  const itemsLoading = useVaultStore((s) => s.itemsLoading);
  const items = allItems.filter((i) => i.item_type === ItemType.Card);
  const isCreate = location.pathname.endsWith("/create");
  const selectedItem = id ? items.find((i) => String(i.id) === id) : null;

  return (
    <div className="flex h-full">
      <ItemList
        items={items}
        loading={itemsLoading}
        basePath="/credit-cards"
        createLabel={t("NewCreditCard")}
        renderSubtitle={(item) => {
          const num = (item.number as string) || "";
          return num ? `****${num.slice(-4)}` : "";
        }}
      />

      <div className="flex-1 min-h-0">
        {isCreate ? (
          <div className="p-6 overflow-y-auto h-full">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("NewCreditCard")}
            </h2>
            <CardForm />
          </div>
        ) : selectedItem ? (
          <ItemDetail
            item={selectedItem}
            basePath="/credit-cards"
            itemType={ItemType.Card}
            renderEditForm={(onSaved) => (
              <CardForm
                initial={selectedItem as Record<string, unknown>}
                itemId={selectedItem.id}
                onSaved={onSaved}
              />
            )}
          >
            <div className="space-y-3">
              <FormInput
                label={t("CardholderName")}
                value={(selectedItem.cardholder_name as string) || ""}
                readOnly
                copyable
              />
              <FormInput
                label={t("Type")}
                value={(selectedItem.type as string) || ""}
                readOnly
              />
              <FormInput
                label={t("Number")}
                value={(selectedItem.number as string) || ""}
                readOnly
                showToggle
                copyable
              />
              <FormInput
                label={t("ExpiryDate")}
                value={(selectedItem.expiry_date as string) || ""}
                readOnly
              />
              <FormInput
                label={t("VerificationNumber")}
                value={(selectedItem.verification_number as string) || ""}
                readOnly
                showToggle
                copyable
              />
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
