import { useState } from "react";
import { useTranslation } from "react-i18next";
import FormInput from "@/components/common/FormInput";
import TextArea from "@/components/common/TextArea";
import Button from "@/components/common/Button";
import { useVaultStore } from "@/stores/vault-store";
import { useUiStore } from "@/stores/ui-store";
import { useNavigate } from "react-router";
import { ItemType } from "@/types";

interface AddressFormProps {
  initial?: Record<string, unknown>;
  itemId?: string;
  onSaved?: () => void;
}

export default function AddressForm({ initial, itemId, onSaved }: AddressFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createItem = useVaultStore((s) => s.createItem);
  const updateItem = useVaultStore((s) => s.updateItem);
  const addNotification = useUiStore((s) => s.addNotification);

  const [form, setForm] = useState({
    title: (initial?.title as string) || "",
    first_name: (initial?.first_name as string) || "",
    middle_name: (initial?.middle_name as string) || "",
    last_name: (initial?.last_name as string) || "",
    company: (initial?.company as string) || "",
    address1: (initial?.address1 as string) || "",
    address2: (initial?.address2 as string) || "",
    city: (initial?.city as string) || "",
    state: (initial?.state as string) || "",
    zip: (initial?.zip as string) || "",
    country: (initial?.country as string) || "",
    phone: (initial?.phone as string) || "",
    email: (initial?.email as string) || "",
    notes: (initial?.notes as string) || "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (itemId) {
        await updateItem({ id: itemId, form, type: ItemType.Address });
        onSaved?.();
        navigate(`/addresses/${itemId}`);
      } else {
        const created = await createItem({ type: ItemType.Address, form });
        onSaved?.();
        navigate(`/addresses/${created?.id ?? ""}`);
      }
    } catch {
      addNotification("error", "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <FormInput
        label={t("Title")}
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        autoFocus
      />
      <div className="grid grid-cols-3 gap-3">
        <FormInput
          label={t("FirstName")}
          value={form.first_name}
          onChange={(e) => set("first_name", e.target.value)}
        />
        <FormInput
          label={t("MiddleName")}
          value={form.middle_name}
          onChange={(e) => set("middle_name", e.target.value)}
        />
        <FormInput
          label={t("LastName")}
          value={form.last_name}
          onChange={(e) => set("last_name", e.target.value)}
        />
      </div>
      <FormInput
        label={t("Company")}
        value={form.company}
        onChange={(e) => set("company", e.target.value)}
      />
      <FormInput
        label={t("AddressLine1")}
        value={form.address1}
        onChange={(e) => set("address1", e.target.value)}
      />
      <FormInput
        label={t("AddressLine2")}
        value={form.address2}
        onChange={(e) => set("address2", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormInput
          label={t("City")}
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <FormInput
          label={t("State")}
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput
          label={t("ZIP")}
          value={form.zip}
          onChange={(e) => set("zip", e.target.value)}
        />
        <FormInput
          label={t("Country")}
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
        />
      </div>
      <FormInput
        label={t("Phone")}
        value={form.phone}
        onChange={(e) => set("phone", e.target.value)}
      />
      <FormInput
        label={t("Email")}
        type="email"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
      />
      <TextArea
        label={t("Note")}
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        rows={3}
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {t("Save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/addresses")}
        >
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
}
