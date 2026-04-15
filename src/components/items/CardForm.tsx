import { useState } from "react";
import { useTranslation } from "react-i18next";
import FormInput from "@/components/common/FormInput";
import Button from "@/components/common/Button";
import { useVaultStore } from "@/stores/vault-store";
import { useUiStore } from "@/stores/ui-store";
import { useNavigate } from "react-router";
import { ItemType } from "@/types";

interface CardFormProps {
  initial?: Record<string, unknown>;
  itemId?: string;
  onSaved?: () => void;
}

export default function CardForm({ initial, itemId, onSaved }: CardFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createItem = useVaultStore((s) => s.createItem);
  const updateItem = useVaultStore((s) => s.updateItem);
  const addNotification = useUiStore((s) => s.addNotification);

  const [form, setForm] = useState({
    title: (initial?.title as string) || "",
    cardholder_name: (initial?.cardholder_name as string) || "",
    type: (initial?.type as string) || "",
    number: (initial?.number as string) || "",
    expiry_date: (initial?.expiry_date as string) || "",
    verification_number: (initial?.verification_number as string) || "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (itemId) {
        await updateItem({ id: itemId, form, type: ItemType.Card });
        onSaved?.();
        navigate(`/credit-cards/${itemId}`);
      } else {
        const created = await createItem({ type: ItemType.Card, form });
        onSaved?.();
        navigate(`/credit-cards/${created?.id ?? ""}`);
      }
    } catch {
      addNotification("error", "Failed to save card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <FormInput
        label={t("CardName")}
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        autoFocus
      />
      <FormInput
        label={t("CardholderName")}
        value={form.cardholder_name}
        onChange={(e) => set("cardholder_name", e.target.value)}
      />
      <FormInput
        label={t("Type")}
        value={form.type}
        onChange={(e) => set("type", e.target.value)}
        placeholder="Visa, Mastercard..."
      />
      <FormInput
        label={t("Number")}
        value={form.number}
        onChange={(e) => set("number", e.target.value)}
        showToggle
        copyable
      />
      <FormInput
        label={t("ExpiryDate")}
        value={form.expiry_date}
        onChange={(e) => set("expiry_date", e.target.value)}
        placeholder="MM/YY"
      />
      <FormInput
        label={t("VerificationNumber")}
        value={form.verification_number}
        onChange={(e) => set("verification_number", e.target.value)}
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
          onClick={() => navigate("/credit-cards")}
        >
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
}
