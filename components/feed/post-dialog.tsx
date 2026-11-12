"use client";

import {
  Heart,
  Globe2,
  MessageSquare,
  Reply,
  Send,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CURRENT_USER } from "./dummy-data";
import { Comment, Post, User } from "./types";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/components/ui/toast";
import { EmojiPicker } from "./emoji-picker";
import { getPostTopic } from "@/lib/post-topics";

interface PostDialogProps {
  post: Post | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddComment?: (postId: string, commentText: string, parentId?: string) => Promise<Comment | void> | Comment | void;
  onLikeToggle?: (postId: string, isLiked: boolean) => void;
  currentUser?: User;
  onViewProfile?: (userId: string) => void;
}

export function PostDialog({
  post,
  isOpen,
  onOpenChange,
  onAddComment,
  onLikeToggle,
  currentUser,
  onViewProfile,
}: PostDialogProps) {
  const { language, dir } = useLanguage();
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsPostId, setCommentsPostId] = useState("");
  const [isLoadingOlderComments, setIsLoadingOlderComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const postId = post?.id;
  const visibleComments = commentsPostId === postId ? comments : [];
  const isLoadingComments = isOpen && Boolean(postId) && commentsPostId !== postId;
  const commenter = currentUser ?? CURRENT_USER;

  useEffect(() => {
    if (!isOpen || !postId) return;
    const controller = new AbortController();
    fetch(`/api/posts/${encodeURIComponent(postId)}/comments?limit=30`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) throw new Error("Could not load comments");
        setComments(data.reverse());
        setCommentsPostId(postId);
        setHasMoreComments(data.length === 30);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Could not load post comments:", error);
        if (error.name !== "AbortError") {
          setComments([]);
          setCommentsPostId(postId);
          setHasMoreComments(false);
        }
      });
    return () => controller.abort();
  }, [isOpen, postId]);

  const loadOlderComments = async () => {
    const cursor = visibleComments[0]?.createdAt;
    if (!post || !cursor || isLoadingOlderComments) return;
    setIsLoadingOlderComments(true);
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments?limit=30&before=${encodeURIComponent(cursor)}`);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error("Could not load older comments");
      setComments((previous) => [...data.reverse(), ...previous]);
      setHasMoreComments(data.length === 30);
    } catch (error) {
      console.error("Could not load older comments:", error);
    } finally {
      setIsLoadingOlderComments(false);
    }
  };

  if (!post) return null;

  const handleShare = async () => {
    const url = `${window.location.origin}/?page=post&id=${post.id}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
    toast.add({
      title: "بەستەری پۆست کۆپیکرا! 🔗",
      description: url,
      type: "success",
    });
  };

  const displayContent = language === "en" && post.contentEn ? post.contentEn : post.content;
  const displayTags = language === "en" && post.tagsEn ? post.tagsEn : post.tags;
  const displayTimestamp = language === "en" && post.timestampEn ? post.timestampEn : post.timestamp;

  const topLevelComments = visibleComments.filter((comment) =>
    !comment.parentId || !visibleComments.some((parent) => parent.id === comment.parentId)
  );

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isPostingComment) return;

    const content = commentText.trim();
    const pendingId = `pending-${Date.now()}`;
    const pendingComment: Comment = {
      id: pendingId,
      author: commenter,
      content,
      parentId: replyingTo?.id,
      timestamp: language === "en" ? "Just now" : "ئێستا",
      likes: 0,
    };
    setComments((previous) => [...previous, pendingComment]);
    setCommentText("");
    setIsPostingComment(true);
    try {
      let savedComment: Comment | void;
      if (onAddComment) {
        savedComment = await onAddComment(post.id, content, replyingTo?.id);
      } else {
        const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentId: replyingTo?.id }),
        });
        const data = await response.json();
        if (!response.ok || !data.comment) throw new Error(data.error || "Could not post comment");
        savedComment = data.comment as Comment;
      }
      if (savedComment) {
        setComments((previous) => previous.map((comment) => comment.id === pendingId ? savedComment! : comment));
      }
      setReplyingTo(null);
    } catch (error) {
      setComments((previous) => previous.filter((comment) => comment.id !== pendingId));
      setCommentText(content);
      toast.add({
        title: language === "en" ? "Could not post comment" : "نەتوانرا لێدوانەکە بنێردرێت",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const input = commentInputRef.current;
    const start = input?.selectionStart ?? commentText.length;
    const end = input?.selectionEnd ?? commentText.length;
    const nextValue = `${commentText.slice(0, start)}${emoji}${commentText.slice(end)}`;
    setCommentText(nextValue);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col">
        {/* Header with Author Info */}
        <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => onViewProfile?.(post.author.id)} aria-label={`View ${post.author.name}'s profile`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <Avatar10
                  name={post.author.name}
                  avatar={post.author.avatar}
                  size="size-10"
                  online={post.author.online}
                />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <DialogTitle className="font-bold text-sm text-foreground">
                    <button type="button" onClick={() => onViewProfile?.(post.author.id)} className="hover:underline">
                      {post.author.name}
                    </button>
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{post.author.handle}</span>
                  <span>·</span>
                  <span>{displayTimestamp}</span>
                  <span>·</span>
                  <Globe2 className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Post & Comments Body */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin ${
          dir === "rtl" ? "text-right" : "text-left"
        }`}>
          {/* Post Content */}
          <div className="text-sm text-foreground leading-relaxed">
            <p className="whitespace-pre-line">{displayContent}</p>

            {displayTags && displayTags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 justify-start">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80"
                  >
                    {(language === "ckb" && getPostTopic(tag)?.labelKu) || `#${tag}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Media (if any) */}
          {post.mediaUrl && (
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/50 bg-muted/30">
              <img
                src={post.mediaUrl}
                alt="Post attachment"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Engagement Bar */}
          <div className="flex items-center justify-between border-y border-border/50 py-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onLikeToggle?.(post.id, !post.isLiked)}
                aria-pressed={Boolean(post.isLiked)}
                aria-label={language === "en" ? "Like post" : "بەدڵبوونی پۆست"}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-colors cursor-pointer ${
                  post.isLiked
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                }`}
              >
                <Heart aria-hidden="true" className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                <span>
                  {language === "en"
                    ? `${post.likesCount} likes`
                    : `${post.likesCount} دەنگدانەوە`}
                </span>
              </button>

              <div className="flex items-center gap-1 text-muted-foreground px-2">
                <MessageSquare className="h-4 w-4" />
                <span>
                  {language === "en"
                    ? `${post.commentsCount} Comments`
                    : `${post.commentsCount} لێدوان`}
                </span>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
              title={language === "en" ? "Share" : "هاوبەشکردن"}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Comments Thread */}
          <div className="space-y-3 pt-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider text-muted-foreground ${
              dir === "rtl" ? "text-right" : "text-left"
            }`}>
              {language === "en"
                ? `Comments (${visibleComments.length})`
                : `لێدوانەکان (${visibleComments.length})`}
            </h4>

            {isLoadingComments ? (
              <p className="py-5 text-center text-xs text-muted-foreground">{language === "en" ? "Loading comments…" : "لێدوانەکان باردەکرێن..."}</p>
            ) : visibleComments.length > 0 ? (
              <div className="space-y-3">
                {topLevelComments.map((comment) => {
                  const replies = visibleComments.filter((reply) => reply.parentId === comment.id);
                  const renderComment = (item: Comment, isReply = false) => (
                    <div key={item.id} className={`flex gap-2.5 text-xs ${isReply ? "ms-7 sm:ms-10" : ""}`}>
                      <Avatar10 name={item.author.name} avatar={item.author.avatar} size="size-8" />
                      <div className="min-w-0 flex-1 rounded-xl border border-border/60 bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-bold text-foreground">{item.author.name}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {language === "en" && item.timestampEn ? item.timestampEn : item.timestamp}
                          </span>
                        </div>
                        <p className={`mt-1 whitespace-pre-wrap break-words leading-relaxed text-foreground/90 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                          {language === "en" && item.contentEn ? item.contentEn : item.content}
                        </p>
                        <button type="button" onClick={() => { setReplyingTo(item); commentInputRef.current?.focus(); }} className="mt-2 inline-flex min-h-7 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary">
                          <Reply className="size-3.5" />{language === "en" ? "Reply" : "وەڵامدانەوە"}
                        </button>
                      </div>
                    </div>
                  );
                  return (
                    <div key={comment.id} className="space-y-2">
                      {renderComment(comment)}
                      {replies.length > 0 && <div className="space-y-2 border-s-2 border-border/70">{replies.map((reply) => renderComment(reply, true))}</div>}
                    </div>
                  );
                })}
                {hasMoreComments && <button type="button" disabled={isLoadingOlderComments} onClick={loadOlderComments} className="w-full py-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                  {isLoadingOlderComments ? (language === "en" ? "Loading…" : "باردەکرێت...") : (language === "en" ? "Load older comments" : "لێدوانە کۆنترەکان ببینە")}
                </button>}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {language === "en"
                  ? "No comments yet. Share the first perspective!"
                  : "هیچ لێدوانێک نییە. یەکەم تێڕوانین تۆ پێشکەش بکە!"}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Comment Input */}
        <div className="p-3 border-t border-border/60 bg-muted/20 shrink-0">
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs">
              <span className="truncate text-muted-foreground">{language === "en" ? `Replying to ${replyingTo.author.name}` : `وەڵام بۆ ${replyingTo.author.name}`}</span>
              <button type="button" onClick={() => setReplyingTo(null)} className="shrink-0 font-semibold text-primary hover:underline">{language === "en" ? "Cancel" : "پاشگەزبوونەوە"}</button>
            </div>
          )}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            <Avatar10
              name={commenter.name}
              avatar={commenter.avatar}
              size="size-8.5"
            />
            <div className="relative flex-1">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  replyingTo
                    ? (language === "en" ? `Reply to ${replyingTo.author.name}...` : `وەڵامێک بۆ ${replyingTo.author.name} بنووسە...`)
                    : language === "en"
                    ? "Reply to this moment..."
                    : "وەڵامی ئەم ساتە بدەرەوە..."
                }
                disabled={isPostingComment}
                className={`w-full rounded-full border border-border/80 bg-background px-4 py-2 ${
                  dir === "rtl" ? "pl-9 text-right" : "pr-9 text-left"
                } text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40`}
              />
              <EmojiPicker dir={dir} language={language} onSelect={insertEmoji} />
            </div>
            <Button
              type="submit"
              size="sm"
                disabled={!commentText.trim() || isLoadingComments || isPostingComment}
              className="rounded-full px-3.5 h-8.5 text-xs font-semibold"
            >
              <Send className={`h-3.5 w-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
