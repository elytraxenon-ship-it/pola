"use client";

import {
  Bookmark,
  CheckCircle2,
  Flame,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Send,
  Share2,
  Smile,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import { CURRENT_USER } from "./dummy-data";
import { Comment, Post } from "./types";

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onSaveToggle?: (postId: string) => void;
  onOpenDialog?: (post: Post) => void;
}

export function PostCard({
  post,
  onLikeToggle,
  onAddComment,
  onSaveToggle,
  onOpenDialog,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLikedLocal, setIsLikedLocal] = useState(post.isLiked ?? false);
  const [likesCountLocal, setLikesCountLocal] = useState(post.likesCount);
  const [isSavedLocal, setIsSavedLocal] = useState(post.isSaved ?? false);

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
              <span>{post.timestamp}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              isSavedLocal
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            title="پاشەکەوتکردنی سات"
          >
            <Bookmark className={`h-4 w-4 ${isSavedLocal ? "fill-current" : ""}`} />
          </button>
          <button
            className="rounded-full p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
            title="هەڵبژاردەی زیاتر"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Text */}
      <div className="px-4 pb-3 text-xs md:text-sm text-foreground leading-relaxed">
        <p className="whitespace-pre-line">{post.content}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
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

          {/* Remix / Echo */}
          <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer">
            <Repeat2 className="h-4 w-4" />
            <span>{post.sharesCount}</span>
          </button>
        </div>

        <button className="flex items-center gap-1 rounded-full p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer" title="هاوبەشکردن">
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Discussion Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/50 bg-muted/20 px-4 py-3 rounded-b-2xl text-right"
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
                          {comment.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 text-foreground/90 leading-relaxed text-right">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-xs text-muted-foreground text-center py-1">
                هیچ لێدوانێک نییە. یەکەم سەرنج تۆ بنووسە!
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
                  placeholder="بۆچوونێک بنووسە..."
                  className="w-full rounded-full border border-border/80 bg-card px-4 py-2 pl-9 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40 text-right"
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                <Send className="h-3.5 w-3.5 rotate-180" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
