import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "react-router";
import ItemList from "@/components/layout/ItemList";
import ItemDetail from "@/components/layout/ItemDetail";
import PasswordForm from "@/components/items/PasswordForm";
import FormInput from "@/components/common/FormInput";
import TotpDisplay from "@/components/common/TotpDisplay";
import { useVaultStore } from "@/stores/vault-store";
import { ItemType } from "@/types";

export default function Passwords() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const allItems = useVaultStore((s) => s.items);
  const itemsLoading = useVaultStore((s) => s.itemsLoading);
  const items = allItems.filter((i) => i.item_type === ItemType.Password);
  const isCreate = location.pathname.endsWith("/create");
  const selectedItem = id ? items.find((i) => String(i.id) === id) : null;

  return (
    <div className="flex h-full">
      <ItemList
        items={items}
        loading={itemsLoading}
        basePath="/passwords"
        createLabel={t("New Password")}
        renderSubtitle={(item) => (item.username as string) || (item.url as string) || ""}
      />

      <div className="flex-1 min-h-0">
        {isCreate ? (
          <div className="p-6 overflow-y-auto h-full">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              {t("New Password")}
            </h2>
            <PasswordForm />
          </div>
        ) : selectedItem ? (
          <ItemDetail
            item={selectedItem}
            basePath="/passwords"
            itemType={ItemType.Password}
            renderEditForm={(onSaved) => (
              <PasswordForm
                initial={selectedItem as Record<string, unknown>}
                itemId={selectedItem.id}
                onSaved={onSaved}
              />
            )}
          >
            <div className="space-y-4">
              <FormInput
                label={t("Name")}
                value={(selectedItem.title as string) || ""}
                readOnly
              />
              <FormInput
                label={t("Username")}
                value={(selectedItem.username as string) || ""}
                readOnly
                copyable
              />
              <FormInput
                label={t("Password")}
                value={(selectedItem.password as string) || ""}
                readOnly
                showToggle
                copyable
              />
              <FormInput
                label={t("URL")}
                value={(selectedItem.url as string) || ""}
                readOnly
                copyable
              />
              {(selectedItem.totp_secret as string) && (
                <TotpDisplay secret={selectedItem.totp_secret as string} />
              )}
              {(selectedItem.notes as string) && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                    {t("Note")}
                  </label>
                  <p className="text-sm text-text-primary bg-surface-secondary border border-border rounded-lg px-3 py-2 whitespace-pre-wrap">
                    {(selectedItem.notes as string) || ""}
                  </p>
                </div>
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
