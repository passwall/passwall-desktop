import { useState } from "react";
import { useTranslation } from "react-i18next";
import FormInput from "@/components/common/FormInput";
import TextArea from "@/components/common/TextArea";
import Button from "@/components/common/Button";
import { useVaultStore } from "@/stores/vault-store";
import { useUiStore } from "@/stores/ui-store";
import { useNavigate } from "react-router";
import { ItemType } from "@/types";

interface NoteFormProps {
  initial?: Record<string, unknown>;
  itemId?: string;
  onSaved?: () => void;
}

export default function NoteForm({ initial, itemId, onSaved }: NoteFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createItem = useVaultStore((s) => s.createItem);
  const updateItem = useVaultStore((s) => s.updateItem);
  const addNotification = useUiStore((s) => s.addNotification);

  const [form, setForm] = useState({
    title: (initial?.title as string) || (initial?.name as string) || "",
    notes: (initial?.notes as string) || (initial?.note as string) || "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (itemId) {
        await updateItem({ id: itemId, form, type: ItemType.Note });
        onSaved?.();
        navigate(`/notes/${itemId}`);
      } else {
        const created = await createItem({ type: ItemType.Note, form });
        onSaved?.();
        navigate(`/notes/${created?.id ?? ""}`);
      }
    } catch {
      addNotification("error", "Failed to save note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <FormInput
        label={t("Title")}
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        autoFocus
      />
      <TextArea
        label={t("Note")}
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        rows={8}
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {t("Save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/notes")}
        >
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
}
