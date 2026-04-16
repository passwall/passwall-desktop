import { useEffect } from "react";
import { Outlet } from "react-router";
import Sidebar from "@/components/layout/Sidebar";
import AppShell from "@/components/layout/AppShell";
import { useVaultStore } from "@/stores/vault-store";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const fetchItems = useVaultStore((s) => s.fetchItems);
  const authenticated = useAuthStore((s) => s.authenticated);
  const organizationsLength = useAuthStore((s) => s.organizations.length);
  const hasUserKey = useAuthStore((s) => !!s.userKey);

  useEffect(() => {
    if (!authenticated || !hasUserKey || organizationsLength === 0) {
      return;
    }

    void fetchItems();
  }, [fetchItems, authenticated, hasUserKey, organizationsLength]);

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
