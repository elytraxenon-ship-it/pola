"use client";

import {
  Bell,
  CheckCheck,
  ChevronLeft,
  Flame,
  MessageSquare,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";

export interface NotificationItem {
  id: string;
  type: "flame" | "comment" | "invite" | "spark";
  actor: { name: string; avatar: string; handle: string };
  text: string;
  time: string;
  read: boolean;
}

export const ALL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "flame",
    actor: {
      name: "Sophia Martinez",
      handle: "@sophiadesigns",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    },
    text: "دەنگدانەوەی گەرمی بۆ ساتەکەت تۆمار کرد",
    time: "٥ خولەک",
    read: false,
  },
  {
    id: "n2",
    type: "comment",
    actor: {
      name: "Liam O'Connor",
      handle: "@liamoc",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    },
    text: "لێدوانێکی نوێی لەسەر ساتەکەت نووسی",
    time: "١٥ خولەک",
    read: false,
  },
  {
    id: "n3",
    type: "invite",
    actor: {
      name: "Daniel Rivera",
      handle: "@drivera",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    },
    text: "داواکاری بەشداربوون لە بازنەکەتدا نارد",
    time: "١ کاتژمێر",
    read: false,
  },
  {
    id: "n4",
    type: "spark",
    actor: {
      name: "Pola Creative Lab",
      handle: "@polalab",
      avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=200&q=80",
    },
    text: "بڵاوکراوەکەت چووە ڕیزی گەرمترینەکان",
    time: "٣ کاتژمێر",
    read: true,
  },
];

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAll?: () => void;
  onUpdateUnreadCount?: (count: number) => void;
}

const ICON: Record<NotificationItem["type"], React.ReactNode> = {
  flame:   <Flame className="h-2.5 w-2.5 fill-current" />,
  comment: <MessageSquare className="h-2.5 w-2.5" />,
  invite:  <UserCheck className="h-2.5 w-2.5" />,
  spark:   <Sparkles className="h-2.5 w-2.5" />,
};

const BG: Record<NotificationItem["type"], string> = {
  flame:   "bg-amber-500",
  comment: "bg-blue-500",
  invite:  "bg-emerald-500",
  spark:   "bg-purple-500",
};

export function NotificationsPopover({
  isOpen,
  onClose,
  onViewAll,
  onUpdateUnreadCount,
}: NotificationsPopoverProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(ALL_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    onUpdateUnreadCount?.(unread);
  }, [unread, onUpdateUnreadCount]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [isOpen, onClose]);

  const markAllRead = () =>
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  const toggle = (id: string) =>
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );

  // Show only first 4 in the dropdown
  const preview = notifications.slice(0, 4);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-border/80 bg-card/96 shadow-2xl backdrop-blur-xl z-50 overflow-hidden text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/50 bg-muted/10">
            <div className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">ئاگادارکردنەوەکان</span>
              {unread > 0 && (
                <motion.span
                  key={unread}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-rose-500/15 text-rose-500 px-1.5 py-0.5 text-[9px] font-extrabold"
                >
                  {unread}
                </motion.span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer font-semibold"
              >
                <CheckCheck className="h-3 w-3" />
                هەمووی
              </button>
            )}
          </div>

          {/* Items – compact */}
          <div className="divide-y divide-border/30">
            {preview.map((n) => (
              <motion.div
                key={n.id}
                layout
                onClick={() => toggle(n.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-muted/40 relative ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                {/* unread stripe */}
                {!n.read && (
                  <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" />
                )}

                {/* avatar + badge */}
                <div className="relative shrink-0">
                  <Avatar10
                    name={n.actor.name}
                    avatar={n.actor.avatar}
                    size="size-8"
                  />
                  <div
                    className={`absolute -bottom-0.5 -left-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-card text-white ${BG[n.type]}`}
                  >
                    {ICON[n.type]}
                  </div>
                </div>

                {/* text */}
                <div className="flex-1 min-w-0 space-y-0.5 text-right">
                  <p className="text-[11px] leading-snug text-foreground line-clamp-2">
                    <span className="font-bold">{n.actor.name}</span>{" "}
                    <span className="text-foreground/80">{n.text}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>

                {/* dot */}
                {!n.read && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer → View All */}
          <button
            onClick={() => { onClose(); onViewAll?.(); }}
            className="flex w-full items-center justify-center gap-1.5 px-3.5 py-2.5 border-t border-border/50 bg-muted/20 text-[11px] font-semibold text-primary hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <span>بینینی هەموو ئاگادارکردنەوەکان</span>
            <ChevronLeft className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
