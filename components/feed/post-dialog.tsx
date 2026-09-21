"use client";

import {
  Bookmark,
  Flame,
  Globe2,
  MessageSquare,
  Repeat2,
  Send,
  Share2,
  Smile,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Avatar10 } from "@/components/motion/avatar";
import { Button } from "@/components/motion/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CURRENT_USER } from "./dummy-data";
import { Comment, Post } from "./types";

interface PostDialogProps {
  post: Post | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onLikeToggle?: (postId: string) => void;
}

export function PostDialog({
  post,
  isOpen,
  onOpenChange,
  onAddComment,
  onLikeToggle,
}: PostDialogProps) {
  const [commentText, setCommentText] = useState("");

  if (!post) return null;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment?.(post.id, commentText.trim());
    setCommentText("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden p-0 gap-0 rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col">
        {/* Header with Author Info */}
        <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <Avatar10
                name={post.author.name}
                avatar={post.author.avatar}
                size="size-10"
                online={post.author.online}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <DialogTitle className="font-bold text-sm text-foreground">
                    {post.author.name}
                  </DialogTitle>
                  {post.author.verified && (
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{post.author.handle}</span>
                  <span>·</span>
                  <span>{post.timestamp}</span>
                  <span>·</span>
                  <Globe2 className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Post & Comments Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin text-right">
          {/* Post Content */}
          <div className="text-sm text-foreground leading-relaxed">
            <p className="whitespace-pre-line">{post.content}</p>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 justify-start">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Media (if any) */}
          {post.mediaUrl && (
            <div className="overflow-hidden rounded-xl bg-muted/30 border border-border/50 max-h-80">
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
                onClick={() => onLikeToggle?.(post.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-colors cursor-pointer ${
                  post.isLiked
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Flame className={`h-4 w-4 ${post.isLiked ? "fill-amber-500" : ""}`} />
                <span>{post.likesCount} دەنگدانەوە</span>
              </button>

              <div className="flex items-center gap-1 text-muted-foreground px-2">
                <MessageSquare className="h-4 w-4" />
                <span>{post.comments.length} لێدوان</span>
              </div>
            </div>

            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground p-1" title="هاوبەشکردن">
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Comments Thread */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
              لێدوان و وەڵامەکان ({post.comments.length})
            </h4>

            {post.comments.length > 0 ? (
              <div className="space-y-3">
                {post.comments.map((comment: Comment) => (
                  <div key={comment.id} className="flex gap-2.5 text-xs">
                    <Avatar10
                      name={comment.author.name}
                      avatar={comment.author.avatar}
                      size="size-8"
                    />
                    <div className="flex-1 rounded-xl bg-muted/30 border border-border/60 p-3">
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
              <div className="py-6 text-center text-xs text-muted-foreground">
                هیچ لێدوانێک نییە. یەکەم تێڕوانین تۆ پێشکەش بکە!
              </div>
            )}
          </div>
        </div>

        {/* Bottom Comment Input */}
        <div className="p-3 border-t border-border/60 bg-muted/20 shrink-0">
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            <Avatar10
              name={CURRENT_USER.name}
              avatar={CURRENT_USER.avatar}
              size="size-8.5"
            />
            <div className="relative flex-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="وەڵامی ئەم ساتە بدەرەوە..."
                className="w-full rounded-full border border-border/80 bg-background px-4 py-2 pl-9 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40 text-right"
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
              className="rounded-full px-3.5 h-8.5 text-xs font-semibold"
            >
              <Send className="h-3.5 w-3.5 rotate-180" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
