"use client";

import {
  Bell,
  Download,
  LogOut,
  Plus,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useAppInstall } from "@/components/app-install";
import { useCallback, useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import { CURRENT_USER } from "./dummy-data";
import { NotificationsPopover } from "./notifications-popover";
import { SearchDropdown } from "./search-dropdown";
import { User } from "./types";
import { useLanguage } from "@/lib/language-context";

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  onOpenCreateModal?: () => void;
  onOpenChat?: () => void;
  onViewProfile?: () => void;
  onOpenSettings?: () => void;
  onViewNotifications?: () => void;
  onViewNotificationPost?: (id: string) => void;
  onViewNotificationProfile?: (id: string) => void;
  onSearchProfile?: (id: string) => void;
  onSearchPost?: (id: string) => void;
  currentUser?: User;
}

export function Navbar({
  activeTab = "pulse",
  onTabChange,
  onLogout,
  onOpenCreateModal,
  onOpenChat,
  onViewProfile,
  onOpenSettings,
  onViewNotifications,
  onViewNotificationPost,
  onViewNotificationProfile,
  onSearchProfile,
  onSearchPost,
  currentUser,
}: NavbarProps) {
  const user = currentUser ?? CURRENT_USER;
  const { dir, language, t } = useLanguage();
  const openInstall = useAppInstall();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const handleUpdateUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  const channels = [
    { id: "pulse", label: t("feed") },
    { id: "spaces", label: t("spheresTab") },
  ];

  return (
    <header dir={dir} className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 px-3 py-2 backdrop-blur-xl sm:px-4 sm:py-2.5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-2 gap-y-2 md:flex-nowrap md:gap-4">
        {/* Right (in RTL): Distinctive Pola Brand & Search */}
        <div className="order-1 flex min-w-0 items-center gap-2 md:order-none md:gap-5">
          <button
            type="button"
            onClick={() => onTabChange?.("pulse")}
            aria-label="Pola home"
            className="group flex shrink-0 items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-background shadow-sm transition-all duration-300 group-hover:scale-105">
              <img src="/flags/kurdistan.svg" alt="کوردستان" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground leading-none font-sans">
              POLA
            </span>
          </button>

          {/* Facebook-style In-place Search Dropdown */}
          <SearchDropdown onViewProfile={onSearchProfile} onOpenPost={onSearchPost} />
        </div>

        {/* Center: Pola 2-Channel Segmented Switch */}
        <nav className="order-3 mx-auto flex w-fit items-center rounded-full border border-border/80 bg-muted/40 p-1 shadow-2xs backdrop-blur-md md:order-none md:mx-0 md:w-auto">
          {channels.map((channel) => {
            const isActive = activeTab === channel.id;
            return (
              <button
                key={channel.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onTabChange?.(channel.id)}
                className={`relative flex min-h-9 items-center rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer sm:px-5 ${
                  isActive
                    ? "text-primary-foreground font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="pola-channel-bubble"
                    className="absolute inset-0 rounded-full bg-foreground shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? "text-background" : ""}`}>
                  {channel.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Left (in RTL): Studio Button, Signals & Avatar10 */}
        <div className="order-2 flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:order-none">
          <Button
            size="sm"
            onClick={onOpenCreateModal}
            className="size-9 rounded-full bg-foreground p-0 text-background shadow-sm hover:opacity-90 sm:h-8.5 sm:w-auto sm:gap-1.5 sm:px-3.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t("newMoment")}</span>
          </Button>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowProfileMenu(false);
              }}
              aria-label="ئاگادارکردنەوەکان"
              className={`flex size-10 items-center justify-center rounded-full border bg-card transition-colors sm:size-8.5 ${
                showNotifications
                  ? "border-primary/60 text-primary bg-primary/10"
                  : "border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="ئاگادارکردنەوەکان"
            >
              <Bell className="h-4 w-4" />
            </button>

            {/* Animated unread badge */}
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 1.6 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 ring-2 ring-background text-white font-bold"
                style={{ fontSize: "8px" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}

            <NotificationsPopover
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onViewAll={() => {
                setShowNotifications(false);
                onViewNotifications?.();
              }}
              onUpdateUnreadCount={handleUpdateUnreadCount}
              onOpenPost={(id) => {
                setShowNotifications(false);
                onViewNotificationPost?.(id);
              }}
              onViewProfile={(id) => {
                setShowNotifications(false);
                onViewNotificationProfile?.(id);
              }}
            />
          </div>



          {/* Pola Avatar10 Component */}
          <div className={`relative ${dir === "rtl" ? "mr-1" : "ml-1"}`}>
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center rounded-full focus:outline-none cursor-pointer"
            >
              <Avatar10
                name={user.name}
                avatar={user.avatar}
                size="size-8.5"
                online={true}
              />
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`absolute ${
                    dir === "rtl" ? "left-0 text-right" : "right-0 text-left"
                  } mt-2.5 w-60 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl z-50 text-card-foreground`}
                >
                <div className="flex items-center gap-3 p-2.5 border-b border-border/60">
                  <Avatar10
                    name={user.name}
                    avatar={user.avatar}
                    size="size-10"
                  />
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-foreground truncate">
                      {user.name}
                    </div>
                    <div className={`text-[11px] text-muted-foreground truncate ${dir === "rtl" ? "text-right" : "text-left"}`}>
                      <span dir="ltr">{user.handle}</span>
                    </div>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onViewProfile?.();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-primary" />
                    <span>{t("viewProfile")}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenSettings?.();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t("settings")}</span>
                  </button>

                  {openInstall && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        openInstall();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{language === "en" ? "Install Pola" : "دامەزراندنی پۆلا"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout?.();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t("logout")}</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
