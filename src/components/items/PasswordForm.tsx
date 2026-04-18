import { useState } from "react";
import { useTranslation } from "react-i18next";
import FormInput from "@/components/common/FormInput";
import TextArea from "@/components/common/TextArea";
import Button from "@/components/common/Button";
import { useVaultStore } from "@/stores/vault-store";
import { useUiStore } from "@/stores/ui-store";
import { useNavigate } from "react-router";
import { ItemType } from "@/types";

interface PasswordFormProps {
  initial?: Record<string, unknown>;
  itemId?: string;
  onSaved?: () => void;
}

export default function PasswordForm({ initial, itemId, onSaved }: PasswordFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createItem = useVaultStore((s) => s.createItem);
  const updateItem = useVaultStore((s) => s.updateItem);
  const addNotification = useUiStore((s) => s.addNotification);

  const [form, setForm] = useState({
    title: (initial?.title as string) || (initial?.name as string) || "",
    username: (initial?.username as string) || "",
    password: (initial?.password as string) || "",
    url: (initial?.url as string) || "",
    totp_secret: (initial?.totp_secret as string) || "",
    notes: (initial?.notes as string) || (initial?.note as string) || "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const generatePassword = () => {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
    const values = new Uint32Array(20);
    crypto.getRandomValues(values);
    const pw = Array.from(values)
      .map((v) => charset[v % charset.length])
      .join("");
    set("password", pw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title && !form.username) {
      addNotification("warning", t("Please fill all the necessary fields"));
      return;
    }
    setLoading(true);
    try {
      if (itemId) {
        await updateItem({
          id: itemId,
          form: { ...form, name: form.title },
          type: ItemType.Password,
        });
        onSaved?.();
        navigate(`/passwords/${itemId}`);
      } else {
        const created = await createItem({
          type: ItemType.Password,
          form: { ...form, name: form.title },
        });
        onSaved?.();
        navigate(`/passwords/${created?.id ?? ""}`);
      }
    } catch {
      addNotification("error", "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <FormInput
        label={t("Name")}
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        autoFocus
      />
      <FormInput
        label={t("Username")}
        value={form.username}
        onChange={(e) => set("username", e.target.value)}
        copyable
      />
      <FormInput
        label={t("Password")}
        value={form.password}
        onChange={(e) => set("password", e.target.value)}
        showToggle
        copyable
        onGenerate={generatePassword}
      />
      <FormInput
        label={t("URL")}
        value={form.url}
        onChange={(e) => set("url", e.target.value)}
      />
      <FormInput
        label={t("TOTPSecret")}
        value={form.totp_secret}
        onChange={(e) => set("totp_secret", e.target.value)}
        showToggle
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
          onClick={() => navigate("/passwords")}
        >
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
}
