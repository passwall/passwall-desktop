import { useEffect } from "react";
import { Outlet } from "react-router";
import Sidebar from "@/components/layout/Sidebar";
import AppShell from "@/components/layout/AppShell";
import { useVaultStore } from "@/stores/vault-store";

export default function Home() {
  const fetchItems = useVaultStore((s) => s.fetchItems);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppShell>
          <Outlet />
        </AppShell>
      </div>
    </div>
  );
}
