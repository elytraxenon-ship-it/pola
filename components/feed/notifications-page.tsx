"use client";

import {
  ArrowRight,
  Bell,
  CheckCheck,
  Flame,
  MessageSquare,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { ALL_NOTIFICATIONS, NotificationItem } from "@/components/feed/notifications-popover";
import { useLanguage } from "@/lib/language-context";

// Extend with more items for the full page
const FULL_NOTIFICATIONS: NotificationItem[] = [
  ...ALL_NOTIFICATIONS,
  {
    id: "n5",
    type: "flame",
    actor: {
      name: "Ava Zhou",
      handle: "@avaz",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    },
    text: "دەنگدانەوەی بۆ وێنەی نوێی پڕۆفایلەکەت دەربڕی",
    textEn: "liked your new profile picture",
    time: "٥ کاتژمێر",
    timeEn: "5h ago",
    read: true,
  },
  {
    id: "n6",
    type: "comment",
    actor: {
      name: "Marcus Vance",
      handle: "@marcusv",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    text: "وەڵامی لێدوانت دایەوە",
    textEn: "replied to your comment",
    time: "دیرۆ",
    timeEn: "Yesterday",
    read: true,
  },
  {
    id: "n7",
    type: "spark",
    actor: {
      name: "Pola Creative Lab",
      handle: "@polalab",
      avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=200&q=80",
    },
    text: "بڵاوکراوەکەت ٥٠٠ دەنگدانەوەی بەدەستهێنا",
    textEn: "your moment reached 500 sparks",
    time: "دیرۆ",
    timeEn: "Yesterday",
    read: true,
  },
  {
    id: "n8",
    type: "invite",
    actor: {
      name: "Elena Rostova",
      handle: "@elena",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80",
    },
    text: "تۆ بانگهێشت کرایت بۆ بوارێکی نوێ",
    textEn: "invited you to join a new sphere",
    time: "٢ ڕۆژ",
    timeEn: "2d ago",
    read: true,
  },
];

const ICON: Record<NotificationItem["type"], React.ReactNode> = {
  flame:   <Flame className="h-3 w-3 fill-current" />,
  comment: <MessageSquare className="h-3 w-3" />,
  invite:  <UserCheck className="h-3 w-3" />,
  spark:   <Sparkles className="h-3 w-3" />,
};

const BG: Record<NotificationItem["type"], string> = {
  flame:   "bg-amber-500",
  comment: "bg-blue-500",
  invite:  "bg-emerald-500",
  spark:   "bg-purple-500",
};

interface NotificationsPageProps {
  onBack: () => void;
}

export function NotificationsPage({ onBack }: NotificationsPageProps) {
  const { language, dir } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>(FULL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unread = notifications.filter((n) => !n.read).length;
  const displayed = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAllRead = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  const toggle = (id: string) =>
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));

  const typeLabel: Record<NotificationItem["type"], string> = {
    flame:   language === "en" ? "Flame" : "دەنگدانەوە",
    comment: language === "en" ? "Comment" : "لێدوان",
    invite:  language === "en" ? "Invite" : "بانگهێشت",
    spark:   language === "en" ? "Spark" : "چەخماخە",
  };

  return (
    <div
      dir={dir}
      className={`w-full max-w-2xl mx-auto pb-16 px-2 sm:px-4 pt-6 ${
        dir === "rtl" ? "text-right" : "text-left"
      }`}
    >
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowRight className={`h-3.5 w-3.5 ${dir === "ltr" ? "rotate-180" : ""}`} />
          <span>{language === "en" ? "Back" : "گەڕانەوە"}</span>
        </button>

        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-extrabold text-foreground">
            {language === "en" ? "Notifications" : "ئاگادارکردنەوەکان"}
          </h1>
          {unread > 0 && (
            <span className="rounded-full bg-rose-500/15 text-rose-500 px-2 py-0.5 text-[10px] font-extrabold">
              {unread} {language === "en" ? "new" : "نوێ"}
            </span>
          )}
        </div>
      </div>

      {/* Filter + Mark All */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {(["all", "unread"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                filter === t
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t === "all"
                ? language === "en"
                  ? `All (${notifications.length})`
                  : `هەمووی (${notifications.length})`
                : language === "en"
                ? `Unread (${unread})`
                : `نەخوێندراوەکان (${unread})`}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {language === "en" ? "Mark all read" : "هەمووی خوێندراوە"}
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden divide-y divide-border/40 shadow-xs">
        <AnimatePresence initial={false}>
          {displayed.length > 0 ? (
            displayed.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => toggle(n.id)}
                className={`relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/30 ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                {/* unread stripe — always on the inline-end side */}
                {!n.read && (
                  <div
                    className={`absolute top-3 bottom-3 w-0.5 bg-primary rounded-full ${
                      dir === "rtl" ? "right-0" : "left-0"
                    }`}
                  />
                )}

                {/* avatar + type badge */}
                <div className="relative shrink-0">
                  <Avatar10
                    name={n.actor.name}
                    avatar={n.actor.avatar}
                    size="size-10"
                  />
                  <div
                    className={`absolute -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-white shadow-xs ${BG[n.type]} ${
                      dir === "rtl" ? "-left-1" : "-right-1"
                    }`}
                  >
                    {ICON[n.type]}
                  </div>
                </div>

                {/* content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs leading-snug text-foreground">
                    <span className="font-bold">{n.actor.name}</span>{" "}
                    <span className="text-foreground/85">
                      {language === "en" && n.textEn ? n.textEn : n.text}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="rounded-full bg-muted/60 px-1.5 py-0.5 font-medium">
                      {typeLabel[n.type]}
                    </span>
                    <span>{language === "en" && n.timeEn ? n.timeEn : n.time}</span>
                    {!n.read && (
                      <span className="font-bold text-primary">
                        · {language === "en" ? "New" : "نوێ"}
                      </span>
                    )}
                  </div>
                </div>

                {/* unread dot */}
                {!n.read && (
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
                )}
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center space-y-2"
            >
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">
                {language === "en" ? "No notifications yet" : "هیچ ئاگادارکردنەوەیەک نییە"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "en"
                  ? "Your sparks and engagement will show up here."
                  : "چەخماخە و بەشداریکردنەکانت ئێرە دەبینیت."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
