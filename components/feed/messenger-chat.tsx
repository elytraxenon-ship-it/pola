"use client";

import { Minimize2, MoreHorizontal, Send, Smile, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { CURRENT_USER } from "./dummy-data";
import { User } from "./types";
import { useLanguage } from "@/lib/language-context";

interface ChatMessage {
  id: string;
  sender: User;
  text: string;
  time: string;
  isSelf: boolean;
}

interface MessengerChatProps {
  contact: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MessengerChat({
  contact,
  isOpen,
  onClose,
}: MessengerChatProps) {
  const { language, dir } = useLanguage();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: contact ?? {
        id: "u-1",
        name: "Sarah Chen",
        handle: "@sarahc",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      },
      text: "سڵاو ئالێکس! دیزاینی نوێی پۆلا زۆر سەرنجڕاکێش و ناوازەیە، جووڵەکان زۆر سروشتین!",
      time: "٢:٤١ پ.ن",
      isSelf: false,
    },
    {
      id: "m-2",
      sender: CURRENT_USER,
      text: "سوپاس سارا! بەشی گفتوگۆ و پەنجەرەی نوێمان بۆ دەریای ساتەکان زیاد کرد.",
      time: "٢:٤٤ پ.ن",
      isSelf: true,
    },
    {
      id: "m-3",
      sender: contact ?? {
        id: "u-1",
        name: "Sarah Chen",
        handle: "@sarahc",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      },
      text: "دەستت خۆش بێت! چاوەڕێم لە بەشی دروستکەران تاقی بکەمەوە 🚀",
      time: "٢:٤٦ پ.ن",
      isSelf: false,
    },
  ]);

  if (!isOpen || !contact) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: CURRENT_USER,
      text: inputText.trim(),
      time: "کەمێک لەمەوبەر",
      isSelf: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  return (
    <div className={`fixed bottom-4 ${
      dir === "rtl" ? "left-6 text-right" : "right-6 text-left"
    } z-50 flex w-84 flex-col rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200`} dir={dir}>
      {/* Messenger Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar10
            name={contact.name}
            avatar={contact.avatar}
            size="size-8"
            online={contact.online}
          />
          <div>
            <div className="font-bold text-xs text-foreground leading-tight">
              {contact.name}
            </div>
            <div className="text-[10px] text-emerald-500 font-medium">
              {language === "en" ? "Active in Pola" : "چالاک لە پۆلا"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title={language === "en" ? "Close" : "داخستن"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread using components/ui/message */}
      <div className="h-76 overflow-y-auto p-3 space-y-3 scrollbar-thin bg-background/50">
        <MessageGroup>
          {messages.map((msg) => (
            <Message
              key={msg.id}
              align={msg.isSelf ? "end" : "start"}
              className="gap-2"
            >
              {!msg.isSelf && (
                <MessageAvatar className="size-7 rounded-full bg-transparent overflow-hidden">
                  <Avatar10
                    name={msg.sender.name}
                    avatar={msg.sender.avatar}
                    size="size-7"
                  />
                </MessageAvatar>
              )}

              <div className="flex flex-col max-w-[78%]">
                <MessageContent
                  className={`rounded-2xl px-3 py-2 text-xs leading-relaxed text-right ${
                    msg.isSelf
                      ? "bg-foreground text-background font-medium rounded-bl-xs"
                      : "bg-muted/80 text-foreground border border-border/60 rounded-br-xs"
                  }`}
                >
                  {msg.text}
                </MessageContent>
                <MessageFooter
                  className={`text-[9px] text-muted-foreground/70 mt-0.5 px-1 ${
                    msg.isSelf ? "justify-start" : "justify-end"
                  }`}
                >
                  {msg.time}
                </MessageFooter>
              </div>
            </Message>
          ))}
        </MessageGroup>
      </div>

      {/* Message Input Footer */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-1.5 border-t border-border/60 bg-muted/20 p-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={language === "en" ? "Type a message..." : "پەیامێک بنووسە..."}
            className={`w-full rounded-full border border-border/80 bg-background px-3 py-1.5 ${
              dir === "rtl" ? "pl-8 text-right" : "pr-8 text-left"
            } text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40`}
          />
          <button
            type="button"
            className={`absolute ${
              dir === "rtl" ? "left-2.5" : "right-2.5"
            } top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer`}
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!inputText.trim()}
          className="rounded-full h-7 px-2.5 text-xs font-semibold cursor-pointer"
        >
          <Send className={`h-3 w-3 ${dir === "rtl" ? "rotate-180" : ""}`} />
        </Button>
      </form>
    </div>
  );
}
