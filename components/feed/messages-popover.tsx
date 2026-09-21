"use client";

import {
  ChevronLeft,
  CheckCheck,
  Maximize2,
  Mic,
  MoreHorizontal,
  Search,
  SquarePen,
  MessageCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DUMMY_CONVERSATIONS } from "./dummy-data";
import { Conversation } from "./types";

interface MessagesPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAll: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export function MessagesPopover({
  isOpen,
  onClose,
  onViewAll,
  onSelectConversation,
}: MessagesPopoverProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups" | "communities">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(DUMMY_CONVERSATIONS);

  // Filter conversations based on tab and search
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "unread") return conv.isUnread;
    if (activeTab === "groups") return conv.isGroup;
    return true;
  });

  const unreadCount = conversations.filter((c) => c.isUnread).length;

  const handleMarkAllRead = () => {
    setConversations((prev) =>
      prev.map((c) => ({ ...c, isUnread: false, unreadCount: 0 }))
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Messages Dropdown Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 mt-2 z-50 w-84 sm:w-92 rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-xl overflow-hidden text-right"
            dir="rtl"
          >
            {/* Header: Title & Action Tools */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-foreground">
                  نامەکان
                </h3>
                {unreadCount > 0 && (
                  <span className="flex h-5 items-center justify-center rounded-full bg-primary/15 px-2 text-[11px] font-bold text-primary">
                    {unreadCount} نوێ
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-muted-foreground">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex size-7.5 items-center justify-center rounded-full hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="هەمووی وەک خوێندراوە نیشان بدە"
                >
                  <MoreHorizontal className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onViewAll();
                    onClose();
                  }}
                  className="flex size-7.5 items-center justify-center rounded-full hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="گەورەکردن بۆ پەڕەی تەواو"
                >
                  <Maximize2 className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onViewAll();
                    onClose();
                  }}
                  className="flex size-7.5 items-center justify-center rounded-full hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="نامەی نوێ"
                >
                  <SquarePen className="size-4" />
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="px-3 pb-2.5">
              <div className="relative flex items-center">
                <Search className="absolute right-3 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="گەڕان لە نامەکاندا..."
                  className="h-8.5 w-full rounded-full border border-border/60 bg-muted/60 pr-8.5 pl-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Filter Tabs Chips */}
            <div className="flex items-center gap-1.5 px-3 pb-2 border-b border-border/50 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === "all"
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                هەمووی
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("unread")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === "unread"
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                نەخوێندراوە
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("groups")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === "groups"
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                گرووپەکان
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("communities")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === "communities"
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                کۆمەڵگەکان
              </button>
            </div>

            {/* Conversation List Body (Scrollable with max height) */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-border/30 scrollbar-thin">
              {/* Message Request Row (Like reference image) */}
              <div
                onClick={() => {
                  onViewAll();
                  onClose();
                }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer group"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted border border-border/80 text-foreground group-hover:scale-105 transition-transform">
                  <MessageCircle className="size-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground truncate">
                      داواکاری نوێی نامە
                    </span>
                    <ChevronLeft className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    لە عەبدوڵڵا جافەوە
                  </p>
                </div>
              </div>

              {/* Individual Conversations */}
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  هیچ نامەیەک نەدۆزرایەوە
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv);
                      onClose();
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer group ${
                      conv.isUnread ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Contact Avatar */}
                    <div className="relative shrink-0">
                      <div className="size-11 rounded-full overflow-hidden bg-muted border border-border/60">
                        <img
                          src={conv.contact.avatar}
                          alt={conv.contact.name}
                          className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      {conv.contact.online && (
                        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 overflow-hidden min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`truncate text-xs ${
                            conv.isUnread
                              ? "font-bold text-foreground"
                              : "font-semibold text-foreground/90"
                          }`}
                        >
                          {conv.contact.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {conv.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className={`truncate text-[11px] flex items-center gap-1 ${
                            conv.isUnread
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {conv.isVoiceMessage && (
                            <Mic className="size-3 text-primary shrink-0" />
                          )}
                          <span className="truncate">{conv.lastMessage}</span>
                        </p>

                        {/* Unread indicator dot */}
                        {conv.isUnread && (
                          <span className="size-2.5 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer: "See all in Messenger" */}
            <div className="border-t border-border/60 p-2.5 bg-muted/20 text-center">
              <button
                type="button"
                onClick={() => {
                  onViewAll();
                  onClose();
                }}
                className="w-full py-1 text-xs font-bold text-primary hover:text-primary/80 hover:underline transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>بینینی هەموو لە پەیامبەردا</span>
                <ChevronLeft className="size-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
