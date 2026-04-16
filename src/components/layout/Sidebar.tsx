import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  KeyRound,
  StickyNote,
  MapPin,
  CreditCard,
  Landmark,
  Shuffle,
  Globe,
  Settings as SettingsIcon,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { to: "/passwords", icon: KeyRound, labelKey: "Passwords" },
  { to: "/notes", icon: StickyNote, labelKey: "PrivateNotes" },
  { to: "/addresses", icon: MapPin, labelKey: "Addresses" },
  { to: "/credit-cards", icon: CreditCard, labelKey: "CreditCards" },
  { to: "/bank-accounts", icon: Landmark, labelKey: "BankAccounts" },
];

const bottomItems = [
  { to: "/password-generator", icon: Shuffle, labelKey: "PasswordGenerator" },
  { to: "/connected-browsers", icon: Globe, labelKey: "ConnectedBrowsers" },
  { to: "/settings", icon: SettingsIcon, labelKey: "Settings" },
];

const FEEDBACK_URL = "https://passwall.typeform.com/to/GAv1h2";

export default function Sidebar() {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const hasProPlan = useAuthStore((s) => s.hasProPlan());
  const [version, setVersion] = useState("");

  useEffect(() => {
    import("@tauri-apps/api/app")
      .then((mod) => mod.getVersion())
      .then(setVersion)
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-56 bg-sidebar-bg text-white flex flex-col h-full shrink-0 border-r border-white/[0.04]">
      {/* User avatar + plan */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/20">
            {user?.email?.charAt(0).toUpperCase() || "P"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate">
              {user?.name || user?.email || "Passwall"}
            </p>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                hasProPlan
                  ? "bg-gradient-to-r from-primary/30 to-primary-light/30 text-primary-light"
                  : "bg-white/[0.06] text-white/40"
              }`}
            >
              {hasProPlan ? "PRO" : "FREE"}
            </span>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-4 mb-2">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.1em]">
            {t("Categories")}
          </p>
        </div>
        <div className="px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-lg transition-all duration-150 ${
                  isActive
                    ? "bg-primary/15 text-white font-medium"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/90"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-primary/20 text-primary-light"
                        : "bg-white/[0.04] text-white/40"
                    }`}
                  >
                    <item.icon size={15} />
                  </div>
                  <span>{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-white/[0.06] py-2 px-2">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-[13px] rounded-lg transition-colors ${
                isActive
                  ? "bg-white/[0.06] text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
              }`
            }
          >
            <item.icon size={16} />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}

        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 text-[13px] text-white/50 hover:bg-white/[0.04] hover:text-white/80 rounded-lg transition-colors"
        >
          <MessageSquare size={16} />
          <span>{t("GiveFeedback")}</span>
        </a>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-[13px] text-white/50 hover:bg-red-500/10 hover:text-red-400 w-full rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>{t("Logout")}</span>
        </button>
      </div>

      {/* Version */}
      {version && (
        <div className="px-4 py-2.5 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/20 font-medium">
            {t("Version")} {version}
          </p>
        </div>
      )}
    </aside>
  );
}
