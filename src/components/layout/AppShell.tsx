import SearchBar from "@/components/common/SearchBar";
import Notifications from "@/components/common/Notifications";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="h-12 bg-header-bg border-b border-border flex items-center px-4 gap-4 shrink-0" data-tauri-drag-region>
        <SearchBar />
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden">{children}</div>
      <Notifications />
    </div>
  );
}
