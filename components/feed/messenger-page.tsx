"use client";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Edit,
  Image as ImageIcon,
  Info,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Play,
  Search,
  Send,
  Smile,
  Sparkles,
  SquarePen,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/motion/button";
import { CURRENT_USER, DUMMY_CONVERSATIONS } from "./dummy-data";
import { ChatMessage, Conversation, User } from "./types";

interface MessengerPageProps {
  onBack: () => void;
  initialContact?: User | null;
}

export function MessengerPage({ onBack, initialContact }: MessengerPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>(DUMMY_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string>(() => {
    if (initialContact) {
      const match = DUMMY_CONVERSATIONS.find(
        (c) => c.contact.id === initialContact.id || c.contact.name === initialContact.name
      );
      if (match) return match.id;
    }
    return DUMMY_CONVERSATIONS[0].id;
  });

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [showInfoSidebar, setShowInfoSidebar] = useState(true);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation =
    conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation.messages]);

  // Mark conversation as read when selected
  const handleSelectConversation = (convId: string) => {
    setSelectedConvId(convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, isUnread: false, unreadCount: 0 } : c))
    );
  };

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: CURRENT_USER.id,
      text: inputMessage.trim(),
      timestamp: "ئێستا",
      isOutgoing: true,
      status: "sent",
    };

    const updatedText = inputMessage.trim();
    setInputMessage("");

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversation.id) {
          return {
            ...conv,
            lastMessage: updatedText,
            timestamp: "ئێستا",
            messages: [...conv.messages, newMsg],
          };
        }
        return conv;
      })
    );

    // Realistic auto-reply simulation
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        senderId: activeConversation.contact.id,
        text: "زۆر سوپاس بۆ پەیامەکەت! بیرۆکەیەکی زۆر نایابە، بەدڵنیاییەوە لەگەڵت دەبم ✨",
        timestamp: "ئێستا",
        isOutgoing: false,
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConversation.id) {
            return {
              ...conv,
              lastMessage: replyMsg.text,
              timestamp: "ئێستا",
              messages: [...conv.messages, replyMsg],
            };
          }
          return conv;
        })
      );
    }, 1500);
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "unread") return conv.isUnread;
    if (activeTab === "groups") return conv.isGroup;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 text-right" dir="rtl">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center pb-2.5 mb-1.5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          <span>گەڕانەوە بۆ دەریای ساتەکان</span>
        </button>
      </div>

      {/* Main 2-to-3 Panel Messenger App Frame */}
      <div className="relative flex h-[calc(100vh-8.5rem)] min-h-[580px] w-full rounded-2xl md:rounded-3xl border border-border/80 bg-card/60 shadow-lg backdrop-blur-md overflow-hidden">
        {/* Panel 1: Conversations List Sidebar */}
        <div className="w-full sm:w-80 md:w-88 shrink-0 flex flex-col border-l border-border/70 bg-card/80">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              وتووێژەکان
            </h2>
            <div className="flex items-center gap-1 text-muted-foreground">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="نامەی نوێ"
              >
                <SquarePen className="size-4.5" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="px-4 pb-3">
            <div className="relative flex items-center">
              <Search className="absolute right-3.5 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="گەڕان لە وتووێژەکاندا..."
                className="h-9 w-full rounded-full border border-border/60 bg-muted/50 pr-9.5 pl-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 px-4 pb-3 border-b border-border/50">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-foreground text-background shadow-xs font-bold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              هەمووی
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "unread"
                  ? "bg-foreground text-background shadow-xs font-bold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              نەخوێندراوە
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "groups"
                  ? "bg-foreground text-background shadow-xs font-bold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              گرووپەکان
            </button>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/20 scrollbar-thin p-1.5">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversation.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary-foreground border border-primary/20"
                      : "hover:bg-muted/60"
                  }`}
                >
                  {/* Contact Avatar */}
                  <div className="relative shrink-0">
                    <div className="size-12 rounded-full overflow-hidden bg-muted border border-border/70">
                      <img
                        src={conv.contact.avatar}
                        alt={conv.contact.name}
                        className="size-full object-cover"
                      />
                    </div>
                    {conv.contact.online && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                    )}
                  </div>

                  {/* Info & Snippet */}
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`truncate text-xs ${
                          isSelected
                            ? "font-bold text-foreground"
                            : conv.isUnread
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

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p
                        className={`truncate text-[11px] flex items-center gap-1 ${
                          conv.isUnread ? "font-semibold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {conv.isVoiceMessage && (
                          <Mic className="size-3 text-primary shrink-0" />
                        )}
                        <span className="truncate">{conv.lastMessage}</span>
                      </p>

                      {conv.isUnread && (
                        <span className="size-2.5 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Main Active Chat Pane */}
        <div className="flex-1 flex flex-col bg-background/50 overflow-hidden">
          {/* Active Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="size-10 rounded-full overflow-hidden bg-muted border border-border/80">
                  <img
                    src={activeConversation.contact.avatar}
                    alt={activeConversation.contact.name}
                    className="size-full object-cover"
                  />
                </div>
                {activeConversation.contact.online && (
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-foreground">
                  {activeConversation.contact.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span dir="ltr" className="font-sans font-medium">
                    {activeConversation.contact.handle}
                  </span>
                  <span>·</span>
                  <span className={activeConversation.contact.online ? "text-emerald-500 font-medium" : ""}>
                    {activeConversation.contact.online ? "چالاکە لە پۆلا" : "ناچالاک"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="پەیوەندیی دەنگی"
              >
                <Phone className="size-4" />
              </button>

              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="پەیوەندیی ڤیدیۆیی"
              >
                <Video className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowInfoSidebar((prev) => !prev)}
                className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                  showInfoSidebar
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted hover:text-foreground"
                }`}
                title="زانیاریی پەیوەندی"
              >
                <Info className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {/* Timestamp Marker */}
            <div className="flex items-center justify-center">
              <span className="rounded-full bg-muted/80 px-3 py-1 text-[10px] font-semibold text-muted-foreground shadow-2xs">
                ئەمڕۆ · نامەکان پارێزراون لە پۆلا
              </span>
            </div>

            {/* Message Bubbles */}
            {activeConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.isOutgoing ? "justify-start flex-row-reverse" : "justify-start flex-row"
                }`}
              >
                {!msg.isOutgoing && (
                  <div className="size-7 rounded-full overflow-hidden bg-muted shrink-0 mb-1 border border-border/70">
                    <img
                      src={activeConversation.contact.avatar}
                      alt={activeConversation.contact.name}
                      className="size-full object-cover"
                    />
                  </div>
                )}

                <div className={`max-w-[78%] sm:max-w-[65%] space-y-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                      msg.isOutgoing
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-muted/90 text-foreground border border-border/60 rounded-bl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div
                    className={`flex items-center gap-1 text-[10px] text-muted-foreground px-1 ${
                      msg.isOutgoing ? "justify-start" : "justify-end"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.isOutgoing && (
                      <CheckCheck className="size-3 text-primary shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Controls Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-border/70 bg-card/70 backdrop-blur-md flex items-center gap-2"
          >
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="وێنە"
              >
                <ImageIcon className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsRecordingVoice((prev) => !prev)}
                className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                  isRecordingVoice
                    ? "bg-rose-500/15 text-rose-500"
                    : "hover:bg-muted hover:text-foreground"
                }`}
                title="تۆماری دەنگی"
              >
                <Mic className="size-4" />
              </button>
            </div>

            {/* Input field */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`نامەیەک بنووسە بۆ ${activeConversation.contact.name}...`}
              className="flex-1 h-9.5 rounded-full border border-border/70 bg-muted/60 px-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none transition-all"
            />

            {/* Send Button */}
            <Button
              type="submit"
              disabled={!inputMessage.trim()}
              size="sm"
              className="rounded-full size-9 p-0 flex items-center justify-center cursor-pointer shrink-0"
              title="ناردن"
            >
              <Send className="size-4 rotate-180" />
            </Button>
          </form>
        </div>

        {/* Panel 3: Contact Info & Media Drawer (Collapsible) */}
        {showInfoSidebar && (
          <div className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border/70 bg-card/60 p-4 overflow-y-auto">
            <div className="flex flex-col items-center text-center pb-4 border-b border-border/60">
              <div className="relative size-20 rounded-full overflow-hidden bg-muted border-2 border-border/80 mb-3 shadow-md">
                <img
                  src={activeConversation.contact.avatar}
                  alt={activeConversation.contact.name}
                  className="size-full object-cover"
                />
              </div>
              <h4 className="font-extrabold text-sm text-foreground">
                {activeConversation.contact.name}
              </h4>
              <span dir="ltr" className="text-xs text-muted-foreground font-sans mt-0.5">
                {activeConversation.contact.handle}
              </span>
              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>چالاکە لە پۆلا</span>
              </div>
            </div>

            {/* Shared Media Highlights */}
            <div className="py-4 border-b border-border/60">
              <div className="flex items-center justify-between text-xs font-bold text-foreground mb-2.5">
                <span>وێنە و مێدیای هاوبەش</span>
                <span className="text-[10px] text-primary cursor-pointer hover:underline">
                  بینینی هەمووی
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80"
                  alt="Media 1"
                  className="h-16 w-full object-cover hover:opacity-85 transition-opacity cursor-pointer"
                />
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80"
                  alt="Media 2"
                  className="h-16 w-full object-cover hover:opacity-85 transition-opacity cursor-pointer"
                />
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80"
                  alt="Media 3"
                  className="h-16 w-full object-cover hover:opacity-85 transition-opacity cursor-pointer"
                />
              </div>
            </div>

            {/* Privacy & Settings */}
            <div className="pt-3 space-y-2 text-xs">
              <button
                type="button"
                className="w-full text-right p-2 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                بێدەنگکردنی ئاگادارکردنەوەکان
              </button>

              <button
                type="button"
                className="w-full text-right p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
              >
                بلۆککردن یان ڕاپۆرتکردن
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
