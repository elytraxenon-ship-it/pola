"use client";

import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { FeedbackWidget } from "@/components/motion/feedback-widget";
import { Toaster } from "@/components/ui/toast";
import { CreatePost } from "./feed/create-post";
import { DUMMY_CONTACTS, INITIAL_POSTS } from "./feed/dummy-data";
import { LeftSidebar } from "./feed/left-sidebar";
import { MessengerChat } from "./feed/messenger-chat";
import { MessengerPage } from "./feed/messenger-page";
import { Navbar } from "./feed/navbar";
import { NotificationsPage } from "./feed/notifications-page";
import { PostCard } from "./feed/post-card";
import { PostDialog } from "./feed/post-dialog";

import { SkeletonPost } from "./feed/skeleton-post";
import { StoriesReel } from "./feed/stories-reel";
import { Post, User } from "./feed/types";
import { ProfilePage } from "./profile/profile-page";
import { SettingsPage } from "./settings/settings-page";
import { useLanguage } from "@/lib/language-context";

interface HomePageProps {
  onLogout?: () => void;
  initialView?: "feed" | "profile" | "settings";
}

export default function HomePage({ onLogout, initialView = "feed" }: HomePageProps) {
  const { dir, t } = useLanguage();
  const [currentView, setCurrentView] = useState<"feed" | "profile" | "notifications" | "messages" | "settings">(initialView);
  const [activeTab, setActiveTab] = useState("pulse");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("pulse");

  // Dialog state for post comments modal
  const [selectedPostForDialog, setSelectedPostForDialog] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  // Messenger chat state
  const [activeChatContact, setActiveChatContact] = useState<User | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Handler for creating a new post
  const handleAddPost = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Handler for adding a comment to a specific post
  const handleAddComment = (postId: string, commentText: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: `c-${Date.now()}`,
            author: {
              id: "u-current",
              name: "Alex Morgan",
              handle: "@alexmorgan",
              avatar:
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            },
            content: commentText,
            timestamp: "کەمێک لەمەوبەر",
            likes: 0,
          };

          const updatedPost = {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, newComment],
          };

          if (selectedPostForDialog?.id === postId) {
            setSelectedPostForDialog(updatedPost);
          }

          return updatedPost;
        }
        return post;
      })
    );
  };

  // Handler for like toggle
  const handleLikeToggle = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          const likesCount = isLiked ? post.likesCount + 1 : post.likesCount - 1;
          const updated = { ...post, isLiked, likesCount };
          if (selectedPostForDialog?.id === postId) {
            setSelectedPostForDialog(updated);
          }
          return updated;
        }
        return post;
      })
    );
  };

  // Simulate skeleton reload
  const handleSimulateReload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground relative">
      {/* Subtle Pola Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(168,85,247,0.06),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(168,85,247,0.12),transparent)]" />

      {/* Pola Top Navigation Bar */}
      <Navbar
        activeTab={currentView === "feed" ? activeTab : ""}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentView("feed");
        }}
        onLogout={onLogout}
        onOpenCreateModal={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenChat={() => {
          setActiveChatContact(DUMMY_CONTACTS[0]);
          setIsChatOpen(true);
        }}
              onViewProfile={() => {
          setCurrentView("profile");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenSettings={() => {
          setCurrentView("settings");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onViewNotifications={() => {
          setCurrentView("notifications");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onViewMessages={() => {
          setCurrentView("messages");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onSelectChatContact={(contact) => {
          setActiveChatContact(contact);
          setCurrentView("messages");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* View Switcher: Messages Page vs Notifications Page vs Profile Page vs Main Feed */}
      {currentView === "messages" ? (
        <div className="pt-2">
          <MessengerPage
            onBack={() => setCurrentView("feed")}
            initialContact={activeChatContact}
          />
        </div>
      ) : currentView === "notifications" ? (
        <div className="mx-auto max-w-2xl px-2 sm:px-4 pt-2">
          <NotificationsPage onBack={() => setCurrentView("feed")} />
        </div>
      ) : currentView === "profile" ? (
        <div className="pt-4">
          {/* Back to Stream Bar */}
          <div className="mx-auto max-w-5xl px-4 pb-3 flex items-center">
            <button
              onClick={() => setCurrentView("feed")}
              className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className={`h-3.5 w-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              <span>{t("backToStream")}</span>
            </button>
          </div>

          {/* Profile Page Component */}
          <ProfilePage
            posts={posts}
            onAddPost={handleAddPost}
            onLikeToggle={handleLikeToggle}
            onAddComment={handleAddComment}
            onOpenDialog={(p) => {
              setSelectedPostForDialog(p);
              setIsPostDialogOpen(true);
            }}
            onBackToFeed={() => setCurrentView("feed")}
            onOpenSettings={() => {
              setCurrentView("settings");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      ) : currentView === "settings" ? (
        <div className="pt-2">
          <SettingsPage onBack={() => setCurrentView("feed")} />
        </div>
      ) : (
        /* 2-Column Feed Layout (Left Sidebar + Main Stream) */
        <div className="mx-auto flex max-w-5xl justify-center gap-6 px-2 sm:px-4">
          {/* Left Column: Navigation shortcuts & profile */}
          <LeftSidebar
            activeSection={activeSection}
            onSelectSection={(sec) => {
              setActiveSection(sec);
              setCurrentView("feed");
            }}
            onViewProfile={() => {
              setCurrentView("profile");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenSettings={() => {
              setCurrentView("settings");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />

          {/* Center Column: Stories, Create Post, and Feed Posts */}
          <main className="w-full max-w-2xl py-4 flex flex-col gap-4">
            {/* Top Stories / Pulses Reel */}
            <StoriesReel />

            {/* Create Post Studio Card */}
            <CreatePost onAddPost={handleAddPost} />

            {/* Feed Filter / Skeleton Demo Bar */}
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{dir === "ltr" ? "Moments Stream" : "دەریای ساتەکان"}</span>
              </div>

              <button
                onClick={handleSimulateReload}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                title={dir === "ltr" ? "Test skeleton loading" : "تاقیکردنەوەی بارکردنی سەرەتایی"}
              >
                <RefreshCw
                  className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : ""}`}
                />
                <span>{isLoading
                  ? (dir === "ltr" ? "Refreshing..." : "نوێ دەکرێتەوە...")
                  : (dir === "ltr" ? "Test Loading" : "تاقیکردنەوەی بارکردن")}
                </span>
              </button>
            </div>

            {/* Posts Stream */}
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <>
                  <SkeletonPost />
                  <SkeletonPost />
                </>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLikeToggle={handleLikeToggle}
                    onAddComment={handleAddComment}
                    onOpenDialog={(p) => {
                      setSelectedPostForDialog(p);
                      setIsPostDialogOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </main>
        </div>
      )}

      {/* Pop-up Dialog for Post & Comments */}
      <PostDialog
        post={selectedPostForDialog}
        isOpen={isPostDialogOpen}
        onOpenChange={setIsPostDialogOpen}
        onAddComment={handleAddComment}
        onLikeToggle={handleLikeToggle}
      />

      {/* Messenger Chat Panel using @/components/ui/message */}
      <MessengerChat
        contact={activeChatContact}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Pola Toast Notifications */}
      <Toaster />

      {/* Floating Feedback Widget from components/motion */}
      <FeedbackWidget
        position="bottom-left"
        title={dir === "ltr" ? "Feedback on Pola" : "ڕا و سەرنج لەسەر پۆلا"}
        placeholder={dir === "ltr" ? "How's your experience with Pola? Share your thoughts here..." : "ئەزموونت چۆنە لەگەڵ تۆڕی پۆلا؟ لێرە بیروڕات بنووسە..."}
      />
    </div>
  );
}
