import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "react-router";
import ItemList from "@/components/layout/ItemList";
import ItemDetail from "@/components/layout/ItemDetail";
import BankAccountForm from "@/components/items/BankAccountForm";
import FormInput from "@/components/common/FormInput";
import { useVaultStore } from "@/stores/vault-store";
import { ItemType } from "@/types";

export default function BankAccounts() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const allItems = useVaultStore((s) => s.items);
  const itemsLoading = useVaultStore((s) => s.itemsLoading);
  const items = allItems.filter((i) => i.item_type === ItemType.Bank);
  const isCreate = location.pathname.endsWith("/create");
  const selectedItem = id ? items.find((i) => String(i.id) === id) : null;

  return (
    <div className="flex h-full">
      <ItemList
        items={items}
        loading={itemsLoading}
        basePath="/bank-accounts"
        createLabel={t("NewBankAccount")}
        renderSubtitle={(item) => (item.account_name as string) || ""}
      />

      <div className="flex-1 min-h-0">
        {isCreate ? (
          <div className="p-6 overflow-y-auto h-full">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("NewBankAccount")}
            </h2>
            <BankAccountForm />
          </div>
        ) : selectedItem ? (
          <ItemDetail
            item={selectedItem}
            basePath="/bank-accounts"
            itemType={ItemType.Bank}
            renderEditForm={(onSaved) => (
              <BankAccountForm
                initial={selectedItem as Record<string, unknown>}
                itemId={selectedItem.id}
                onSaved={onSaved}
              />
            )}
          >
            <div className="space-y-3">
              {[
                ["AccountName", "account_name"],
                ["AccountNumber", "account_number"],
                ["IBAN", "iban"],
                ["BankCode", "bank_code"],
                ["Currency", "currency"],
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
              {(selectedItem.password as string) && (
                <FormInput
                  label={t("Password")}
                  value={(selectedItem.password as string) || ""}
                  readOnly
                  showToggle
                  copyable
                />
              )}
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
