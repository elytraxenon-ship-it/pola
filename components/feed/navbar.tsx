"use client";

import {
  Bell,
  Compass,
  Flame,
  Globe2,
  LogOut,
  MessageSquare,
  Orbit,
  Plus,
  Radio,
  Search,
  Settings,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import { CURRENT_USER } from "./dummy-data";
import { MessagesPopover } from "./messages-popover";
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
  onViewMessages?: () => void;
  onSelectChatContact?: (contact: User) => void;
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
  onViewMessages,
  onSelectChatContact,
}: NavbarProps) {
  const { language, dir, t } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(2);

  const handleUpdateUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  const channels = [
    { id: "pulse", label: language === "en" ? "Pulse" : "لێدان", icon: Flame },
    { id: "foryou", label: language === "en" ? "For You" : "بۆ تۆ", icon: Sparkles },
    { id: "following", label: language === "en" ? "Spheres" : "بازنەکان", icon: Globe2 },
    { id: "spaces", label: language === "en" ? "Spaces" : "بوارەکان", icon: Radio },
  ];

  return (
    <header dir={dir} className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 px-4 py-2.5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Right (in RTL): Distinctive Pola Brand & Search */}
        <div className="flex items-center gap-3 md:gap-5">
          <div
            onClick={() => onTabChange?.("pulse")}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-primary to-indigo-500 text-white shadow-md shadow-primary/25 transition-all duration-300 group-hover:scale-105 group-hover:rotate-6">
              <Orbit className="size-5 transition-transform duration-300 group-hover:rotate-45" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground leading-none font-sans">
              POLA
            </span>
          </div>

          {/* Facebook-style In-place Search Dropdown */}
          <SearchDropdown />
        </div>

        {/* Center: Pola Fluid Channels (not standard Facebook tabs) */}
        <nav className="flex items-center rounded-full border border-border/80 bg-muted/30 p-1 backdrop-blur-md">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const isActive = activeTab === channel.id;
            return (
              <button
                key={channel.id}
                onClick={() => onTabChange?.(channel.id)}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="pola-channel-bubble"
                    className="absolute inset-0 rounded-full bg-foreground shadow-xs"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon className={`relative z-10 h-3.5 w-3.5 ${isActive ? "text-background" : ""}`} />
                <span className={`relative z-10 hidden sm:inline ${isActive ? "text-background" : ""}`}>
                  {channel.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Left (in RTL): Studio Button, Signals & Avatar10 */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={onOpenCreateModal}
            className="rounded-full gap-1.5 bg-foreground text-background hover:opacity-90 shadow-sm text-xs font-semibold px-3.5 h-8.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("newMoment")}</span>
          </Button>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowProfileMenu(false);
              }}
              className={`flex h-8.5 w-8.5 items-center justify-center rounded-full border bg-card transition-colors cursor-pointer ${
                showNotifications
                  ? "border-primary/60 text-primary bg-primary/10"
                  : "border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={language === "en" ? "Notifications" : "ئاگادارکردنەوەکان"}
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
            />
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowMessages((prev) => !prev);
                setShowNotifications(false);
                setShowProfileMenu(false);
              }}
              className={`flex h-8.5 w-8.5 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                showMessages
                  ? "border-primary/60 text-primary bg-primary/10"
                  : "border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              title={language === "en" ? "Messages" : "وتووێژ و نامەکان"}
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            {/* Animated unread messages badge */}
            {unreadMessagesCount > 0 && (
              <motion.span
                key={unreadMessagesCount}
                initial={{ scale: 1.6 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-2 ring-background text-primary-foreground font-bold"
                style={{ fontSize: "8px" }}
              >
                {unreadMessagesCount}
              </motion.span>
            )}

            <MessagesPopover
              isOpen={showMessages}
              onClose={() => setShowMessages(false)}
              onViewAll={() => {
                setShowMessages(false);
                onViewMessages?.();
              }}
              onSelectConversation={(conv) => {
                setShowMessages(false);
                onSelectChatContact?.(conv.contact);
                onViewMessages?.();
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
                name={CURRENT_USER.name}
                avatar={CURRENT_USER.avatar}
                size="size-8.5"
                online={true}
              />
            </button>

            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`absolute ${
                  dir === "rtl" ? "left-0 text-right" : "right-0 text-left"
                } mt-2.5 w-60 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl z-50 text-card-foreground`}
              >
                <div className="flex items-center gap-3 p-2.5 border-b border-border/60">
                  <Avatar10
                    name={CURRENT_USER.name}
                    avatar={CURRENT_USER.avatar}
                    size="size-10"
                  />
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-foreground truncate">
                      {CURRENT_USER.name}
                    </div>
                    <div className={`text-[11px] text-muted-foreground truncate ${dir === "rtl" ? "text-right" : "text-left"}`}>
                      <span dir="ltr">{CURRENT_USER.handle}</span>
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
