import { useState } from "react";
import { useTranslation } from "react-i18next";
import FormInput from "@/components/common/FormInput";
import Button from "@/components/common/Button";
import { useVaultStore } from "@/stores/vault-store";
import { useUiStore } from "@/stores/ui-store";
import { useNavigate } from "react-router";
import { ItemType } from "@/types";

interface BankAccountFormProps {
  initial?: Record<string, unknown>;
  itemId?: string;
  onSaved?: () => void;
}

export default function BankAccountForm({
  initial,
  itemId,
  onSaved,
}: BankAccountFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createItem = useVaultStore((s) => s.createItem);
  const updateItem = useVaultStore((s) => s.updateItem);
  const addNotification = useUiStore((s) => s.addNotification);

  const [form, setForm] = useState({
    title: (initial?.title as string) || "",
    account_name: (initial?.account_name as string) || "",
    account_number: (initial?.account_number as string) || "",
    iban: (initial?.iban as string) || "",
    bank_code: (initial?.bank_code as string) || "",
    currency: (initial?.currency as string) || "",
    password: (initial?.password as string) || "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (itemId) {
        await updateItem({ id: itemId, form, type: ItemType.Bank });
        onSaved?.();
        navigate(`/bank-accounts/${itemId}`);
      } else {
        const created = await createItem({ type: ItemType.Bank, form });
        onSaved?.();
        navigate(`/bank-accounts/${created?.id ?? ""}`);
      }
    } catch {
      addNotification("error", "Failed to save bank account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <FormInput
        label={t("BankName")}
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        autoFocus
      />
      <FormInput
        label={t("AccountName")}
        value={form.account_name}
        onChange={(e) => set("account_name", e.target.value)}
      />
      <FormInput
        label={t("AccountNumber")}
        value={form.account_number}
        onChange={(e) => set("account_number", e.target.value)}
        copyable
      />
      <FormInput
        label={t("IBAN")}
        value={form.iban}
        onChange={(e) => set("iban", e.target.value)}
        copyable
      />
      <FormInput
        label={t("BankCode")}
        value={form.bank_code}
        onChange={(e) => set("bank_code", e.target.value)}
      />
      <FormInput
        label={t("Currency")}
        value={form.currency}
        onChange={(e) => set("currency", e.target.value)}
      />
      <FormInput
        label={t("Password")}
        value={form.password}
        onChange={(e) => set("password", e.target.value)}
        showToggle
        copyable
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {t("Save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/bank-accounts")}
        >
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
}
