"use client";

import {
  Bookmark,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Flame,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Send,
  Share2,
  Smile,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import { toast } from "@/components/ui/toast";
import { CURRENT_USER } from "./dummy-data";
import { Comment, Post } from "./types";
import { useLanguage } from "@/lib/language-context";

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onSaveToggle?: (postId: string) => void;
  onOpenDialog?: (post: Post) => void;
  onEditPost?: (postId: string, newContent: string) => void;
  onDeletePost?: (postId: string) => void;
  onRepost?: (postId: string) => void;
}

export function PostCard({
  post,
  onLikeToggle,
  onAddComment,
  onSaveToggle,
  onOpenDialog,
  onEditPost,
  onDeletePost,
  onRepost,
}: PostCardProps) {
  const { language, dir } = useLanguage();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLikedLocal, setIsLikedLocal] = useState(post.isLiked ?? false);
  const [likesCountLocal, setLikesCountLocal] = useState(post.likesCount);
  const [isSavedLocal, setIsSavedLocal] = useState(post.isSaved ?? false);

  // 3-Dot Menu & Edit/Delete States
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [localContent, setLocalContent] = useState(post.content);

  // Repost State
  const [isReposted, setIsReposted] = useState(false);
  const [sharesCountLocal, setSharesCountLocal] = useState(post.sharesCount);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showUndoRepostModal, setShowUndoRepostModal] = useState(false);
  const [repostCaption, setRepostCaption] = useState("");

  // Share copied state
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedInMenu, setIsCopiedInMenu] = useState(false);

  const isOwner =
    post.author.id === CURRENT_USER.id ||
    post.author.handle === CURRENT_USER.handle;

  const displayContent = localContent;
  const displayTags = post.tags;
  const displayTimestamp = post.timestamp;

  const handleLike = () => {
    setIsLikedLocal((prev) => !prev);
    setLikesCountLocal((prev) => (isLikedLocal ? prev - 1 : prev + 1));
    onLikeToggle?.(post.id);
  };

  const handleSave = () => {
    const nextSaved = !isSavedLocal;
    setIsSavedLocal(nextSaved);
    onSaveToggle?.(post.id);
  };

  const handleRepost = () => {
    if (isReposted) {
      // Already reposted → show undo/delete confirmation
      setShowUndoRepostModal(true);
      return;
    }
    // Not reposted → show repost confirmation modal
    setRepostCaption("");
    setShowRepostModal(true);
  };

  const handleConfirmUndoRepost = () => {
    setIsReposted(false);
    setSharesCountLocal((prev) => Math.max(0, prev - 1));
    setShowUndoRepostModal(false);
    toast.add({
      title: "دەنگدانەوەکەت لابرا! 🗑️",
      description: "دووبارە بڵاوکردنەوەکەت بەسەرکەوتوویی سڕایەوە.",
      type: "success",
    });
  };

  const handleConfirmRepost = () => {
    setIsReposted(true);
    setSharesCountLocal((prev) => prev + 1);
    setShowRepostModal(false);
    onRepost?.(post.id);
    fetch(`/api/posts/${post.id}/repost`, { method: "POST" }).catch(() => {});
    toast.add({
      title: "پۆستەکە لە پەڕەی تۆ دەنگدانەوەی پەیدا کرد! 🔁",
      description: repostCaption.trim()
        ? `بەگەتی: "${repostCaption.trim()}"`
        : "پۆستەکە بە سەرکەوتوویی لە پڕۆفایلی تۆ دووبارە بڵاوکرایەوە.",
      type: "success",
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/?page=post&id=${post.id}`;
    navigator.clipboard?.writeText?.(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyInMenu = () => {
    const url = `${window.location.origin}/?page=post&id=${post.id}`;
    navigator.clipboard?.writeText?.(url);
    setIsCopiedInMenu(true);
    setTimeout(() => { setIsCopiedInMenu(false); setShowMenu(false); }, 1500);
  };

  const handleSaveEdit = () => {
    if (!editedContent.trim()) return;
    const trimmed = editedContent.trim();
    setLocalContent(trimmed);
    setIsEditing(false);
    setShowMenu(false);
    onEditPost?.(post.id, trimmed);
    fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    }).catch(() => {});
    toast.add({
      title: "پۆست نوێکرایەوە! ✏️",
      description: "دەستکارییەکانی پۆستەکەت بە سەرکەوتوویی پاشەکەوت کران.",
      type: "success",
    });
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDeletePost?.(post.id);
    fetch(`/api/posts/${post.id}`, { method: "DELETE" }).catch(() => {});
    toast.add({
      title: "پۆستەکە سڕایەوە! 🗑️",
      description: "پۆستەکەت لە تۆڕی پۆلا سڕایەوە.",
      type: "success",
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment?.(post.id, commentText.trim());
    setCommentText("");
  };

  return (
    <article className="group w-full rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar10
            name={post.author.name}
            avatar={post.author.avatar}
            size="size-10"
            online={post.author.online}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs md:text-sm text-foreground hover:underline cursor-pointer">
                {post.author.name}
              </span>
              {post.author.verified && (
                <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span dir="ltr" className="font-sans">{post.author.handle}</span>
              <span>·</span>
              <span>{displayTimestamp}</span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            onClick={handleSave}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              isSavedLocal
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            title="پاشەکەوتکردنی پۆست"
          >
            <Bookmark className={`h-4 w-4 ${isSavedLocal ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              showMenu
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            title="هەڵبژاردەی زیاتر"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* 3-Dot Options Dropdown */}
          {showMenu && (
            <div
              className={`absolute top-10 ${
                dir === "rtl" ? "left-0" : "right-0"
              } z-30 min-w-44 rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl space-y-0.5 text-right`}
            >
              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-primary" />
                    <span>دەستکاریکردنی پۆست</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>سڕینەوەی پۆست</span>
                  </button>
                </>
              )}

              <button
                onClick={handleCopyInMenu}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  isCopiedInMenu
                    ? "text-emerald-500 bg-emerald-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {isCopiedInMenu ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{isCopiedInMenu ? "کۆپیکرا!" : "کۆپیکردنی بەستەر"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Text or Inline Edit Mode */}
      <div className={`px-4 pb-3 text-xs md:text-sm text-foreground leading-relaxed ${
        dir === "rtl" ? "text-right" : "text-left"
      }`}>
        {isEditing ? (
          <div className="space-y-2 rounded-xl bg-muted/40 p-3 border border-border/70">
            <textarea
              autoFocus
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-foreground outline-none leading-relaxed text-right"
            />
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
              <button
                onClick={() => {
                  setEditedContent(localContent);
                  setIsEditing(false);
                }}
                className="rounded-lg px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 rounded-lg bg-foreground px-3 py-1 text-xs font-bold text-background hover:opacity-90 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>پاشەکەوتکردن</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-line">{displayContent}</p>

            {displayTags && displayTags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Media Attachment */}
      {post.mediaUrl && (
        <div className="relative mx-3 mb-3 overflow-hidden rounded-xl bg-muted/30 border border-border/50">
          <img
            src={post.mediaUrl}
            alt="Pola attachment"
            className="h-auto max-h-[460px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
          />
        </div>
      )}

      {/* Resonance Engagement Bar */}
      <div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5">
        <div className="flex items-center gap-1">
          {/* Resonance / Flame Boost */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isLikedLocal
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Flame
              className={`h-4 w-4 transition-transform ${
                isLikedLocal ? "fill-amber-500 text-amber-500 scale-110" : ""
              }`}
            />
            <span>{likesCountLocal.toLocaleString()}</span>
          </motion.button>

          {/* Echoes / Comments Dialog Trigger */}
          <button
            onClick={() => {
              if (onOpenDialog) {
                onOpenDialog(post);
              } else {
                setShowComments((prev) => !prev);
              }
            }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
            title="بینینی لێدوانەکان"
          >
            <MessageSquare className="h-4 w-4" />
            <span>
              {post.comments.length > 0 ? post.comments.length : post.commentsCount}
            </span>
          </button>

          {/* Remix / Repost */}
          <button
            onClick={handleRepost}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isReposted
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
            title="دووبارە بڵاوکردنەوە (Repost)"
          >
            <Repeat2 className={`h-4 w-4 ${isReposted ? "text-emerald-500" : ""}`} />
            <span>{sharesCountLocal}</span>
          </button>
        </div>

        {/* Share Button - flips to Check on copy */}
        <button
          onClick={handleShare}
          className={`flex items-center gap-1 rounded-full p-2 transition-all cursor-pointer ${
            isCopied
              ? "text-emerald-500 bg-emerald-500/15"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          }`}
          title={isCopied ? "کۆپیکرا!" : "کۆپیکردنی بەستەر"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isCopied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check className="h-3.5 w-3.5" />
              </motion.span>
            ) : (
              <motion.span
                key="share"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Share2 className="h-3.5 w-3.5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Discussion Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-t border-border/50 bg-muted/20 px-4 py-3 rounded-b-2xl ${
              dir === "rtl" ? "text-right" : "text-left"
            }`}
          >
            {post.comments.length > 0 ? (
              <div className="space-y-2.5 mb-3">
                {post.comments.map((comment: Comment) => (
                  <div key={comment.id} className="flex gap-2.5 text-xs">
                    <Avatar10
                      name={comment.author.name}
                      avatar={comment.author.avatar}
                      size="size-8"
                    />
                    <div className="flex-1 rounded-xl bg-card border border-border/60 p-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {language === "en" && comment.timestampEn ? comment.timestampEn : comment.timestamp}
                        </span>
                      </div>
                      <p className={`mt-1 text-foreground/90 leading-relaxed ${
                        dir === "rtl" ? "text-right" : "text-left"
                      }`}>
                        {language === "en" && comment.contentEn ? comment.contentEn : comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-xs text-muted-foreground text-center py-1">
                {language === "en"
                  ? "No comments yet. Be the first to share your thoughts!"
                  : "هیچ لێدوانێک نییە. یەکەم سەرنج تۆ بنووسە!"}
              </p>
            )}

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
              <Avatar10
                name={CURRENT_USER.name}
                avatar={CURRENT_USER.avatar}
                size="size-8"
              />
              <div className="relative flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={language === "en" ? "Write a comment..." : "بۆچوونێک بنووسە..."}
                  className={`w-full rounded-full border border-border/80 bg-card px-4 py-2 ${
                    dir === "rtl" ? "pl-9 text-right" : "pr-9 text-left"
                  } text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40`}
                />
                <button
                  type="button"
                  className={`absolute ${
                    dir === "rtl" ? "left-3" : "right-3"
                  } top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim()}
                className="rounded-full shrink-0 h-8 px-3"
              >
                <Send className={`h-3.5 w-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Repost Confirmation Modal */}
      <AnimatePresence>
        {showRepostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowRepostModal(false);
            }}
          >
            <motion.div
              dir={dir}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl text-right"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                <button
                  onClick={() => setShowRepostModal(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Repeat2 className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground">دووبارە بڵاوکردنەوە</h3>
                </div>
              </div>

              {/* Optional Caption */}
              <div className="mb-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                    <img src={CURRENT_USER.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-foreground">{CURRENT_USER.name}</span>
                </div>
                <textarea
                  value={repostCaption}
                  onChange={(e) => setRepostCaption(e.target.value)}
                  placeholder="بەگەتێک زیاد بکە... (ئارەزوومەندانە)"
                  rows={2}
                  autoFocus
                  className="w-full resize-none bg-muted/30 rounded-xl border border-border/60 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-right leading-relaxed"
                />
              </div>

              {/* Original Post Preview */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                    <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground">{post.author.name}</span>
                  <span className="text-[10px] text-muted-foreground mr-auto">{post.timestamp}</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3 whitespace-pre-line">
                  {localContent}
                </p>
                {post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="post media"
                    className="w-full h-28 object-cover rounded-lg mt-1"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-start flex-row-reverse">
                <button
                  onClick={handleConfirmRepost}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
                >
                  <Repeat2 className="h-3.5 w-3.5" />
                  دووبارە بڵاوبکەرەوە
                </button>
                <button
                  onClick={() => setShowRepostModal(false)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Repost Confirmation Modal */}
      <AnimatePresence>
        {showUndoRepostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowUndoRepostModal(false);
            }}
          >
            <motion.div
              dir={dir}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl text-right"
            >
              {/* Icon + Title */}
              <div className="flex flex-col items-center gap-2 mb-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30">
                  <Repeat2 className="h-5 w-5 text-rose-500" />
                </div>
                <h3 className="text-sm font-bold text-foreground">لابردنی دەنگدانەوە</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[22ch] mx-auto">
                  دەتەوێت دووبارە بڵاوکردنەوەکەت لە پڕۆفایلت لابدەیت؟
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUndoRepostModal(false)}
                  className="flex-1 rounded-full border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  نەخێر، بمێنێتەوە
                </button>
                <button
                  onClick={handleConfirmUndoRepost}
                  className="flex-1 rounded-full bg-rose-500 hover:bg-rose-600 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
                >
                  بەڵێ، لای بدە
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
