"use client";

import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { FeedbackWidget } from "@/components/motion/feedback-widget";
import { Toaster } from "@/components/ui/toast";
import { CreatePost } from "./feed/create-post";
import { INITIAL_POSTS } from "./feed/dummy-data";
import { LeftSidebar } from "./feed/left-sidebar";
import { Navbar } from "./feed/navbar";
import { NotificationsPage } from "./feed/notifications-page";
import { PostCard } from "./feed/post-card";
import { PostDialog } from "./feed/post-dialog";

import { SkeletonPost } from "./feed/skeleton-post";
import { SpacesPage } from "./feed/spaces-page";
import { StoriesReel } from "./feed/stories-reel";
import { Post, User } from "./feed/types";
import { ProfilePage } from "./profile/profile-page";
import { SettingsPage } from "./settings/settings-page";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

interface HomePageProps {
  onLogout?: () => void;
  initialView?: "feed" | "profile" | "settings";
}

export default function HomePage({ onLogout, initialView = "feed" }: HomePageProps) {
  const { dir, t } = useLanguage();
  const [currentView, setCurrentView] = useState<"feed" | "profile" | "notifications" | "settings">(initialView);
  const [activeTab, setActiveTab] = useState("pulse");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("pulse");
  const [autoOpenCreate, setAutoOpenCreate] = useState(false);

  // Real logged-in user for navbar / sidebar
  const currentUser = useCurrentUser();

  // Dialog state for post comments modal
  const [selectedPostForDialog, setSelectedPostForDialog] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string>("1");

  // Fetch real posts from Supabase / API
  const fetchPosts = () => {
    setIsLoading(true);
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        }
      })
      .catch((err) => console.error("Error loading posts:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch current user sequential_id so ?page=profile uses the real user ID
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("sequential_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.sequential_id) {
          const mySeqId = String(profile.sequential_id);
          const params = new URLSearchParams(window.location.search);
          if (!params.get("id")) {
            setProfileUserId(mySeqId);
          }
        }
      }
    });
  }, []);

  // Synchronize view with URL query parameters (?page=profile&id=..., etc.)
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const page = params.get("page");
        const id = params.get("id");
        if (id) {
          setProfileUserId(id);
        }
        if (page === "profile") {
          setCurrentView("profile");
        } else if (page === "settings") {
          setCurrentView("settings");
        } else if (page === "notifications") {
          setCurrentView("notifications");
        } else {
          setCurrentView("feed");
        }
      } catch {}
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  const navigateTo = (view: "feed" | "profile" | "notifications" | "settings", params?: Record<string, string>) => {
    setCurrentView(view);
    try {
      if (view === "feed") {
        window.history.pushState({}, "", window.location.pathname);
      } else {
        const searchParams = new URLSearchParams();
        searchParams.set("page", view);
        if (view === "profile") {
          searchParams.set("id", params?.id || profileUserId || "1");
        }
        window.history.pushState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for creating a new post
  const handleAddPost = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Handler for editing an existing post
  const handleEditPost = (postId: string, newContent: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, content: newContent } : post
      )
    );
    fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    }).catch((err) => console.error("Error editing post:", err));
  };

  // Handler for deleting a post
  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    fetch(`/api/posts/${postId}`, {
      method: "DELETE",
    }).catch((err) => console.error("Error deleting post:", err));
  };

  // Handler for adding a comment to a specific post
  const handleAddComment = (postId: string, commentText: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: `c-${Date.now()}`,
            author: {
              id: currentUser.id,
              name: currentUser.name,
              handle: currentUser.handle,
              avatar: currentUser.avatar,
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

  // Refresh posts from Supabase
  const handleSimulateReload = () => {
    fetchPosts();
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
          navigateTo("feed");
        }}
        onLogout={onLogout}
        onOpenCreateModal={() => {
          // Navigate to feed first, then open create post
          navigateTo("feed");
          // Small delay so feed renders before we open the composer
          setTimeout(() => setAutoOpenCreate(true), 80);
        }}
        onViewProfile={() => {
          navigateTo("profile");
        }}
        onOpenSettings={() => {
          navigateTo("settings");
        }}
        onViewNotifications={() => {
          navigateTo("notifications");
        }}
        currentUser={currentUser}
      />

      {/* View Switcher: Notifications Page vs Profile Page vs Main Feed */}
      {currentView === "notifications" ? (
        <div className="mx-auto max-w-2xl px-2 sm:px-4 pt-2">
          <NotificationsPage onBack={() => navigateTo("feed")} />
        </div>
      ) : currentView === "profile" ? (
        <div className="pt-4">
          {/* Back to Stream Bar */}
          <div className="mx-auto max-w-5xl px-4 pb-3 flex items-center">
            <button
              onClick={() => navigateTo("feed")}
              className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className={`h-3.5 w-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              <span>{t("backToStream")}</span>
            </button>
          </div>

          {/* Profile Page Component */}
          <ProfilePage
            currentUser={currentUser}
            userId={profileUserId}
            posts={posts}
            onAddPost={handleAddPost}
            onLikeToggle={handleLikeToggle}
            onAddComment={handleAddComment}
            onOpenDialog={(p) => {
              setSelectedPostForDialog(p);
              setIsPostDialogOpen(true);
            }}
            onBackToFeed={() => navigateTo("feed")}
            onOpenSettings={() => {
              navigateTo("settings");
            }}
          />
        </div>
      ) : currentView === "settings" ? (
        <div className="pt-2">
          <SettingsPage onBack={() => navigateTo("feed")} />
        </div>
      ) : activeTab === "spaces" ? (
        /* Spaces / Explore Page */
        <div className="mx-auto max-w-5xl">
          <SpacesPage
            posts={posts}
            onLikeToggle={handleLikeToggle}
            onAddComment={handleAddComment}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onOpenDialog={(p) => {
              setSelectedPostForDialog(p);
              setIsPostDialogOpen(true);
            }}
          />
        </div>
      ) : (
        /* 2-Column Feed Layout (Left Sidebar + Main Stream) */
        <div className="mx-auto flex max-w-5xl justify-center gap-6 px-2 sm:px-4">
          {/* Left Column: Navigation shortcuts & profile */}
          <LeftSidebar
            activeSection={activeSection}
            onSelectSection={(sec) => {
              setActiveSection(sec);
              navigateTo("feed");
            }}
            onViewProfile={() => {
              navigateTo("profile");
            }}
            onOpenSettings={() => {
              navigateTo("settings");
            }}
            currentUser={currentUser}
          />

          {/* Center Column: Stories, Create Post, and Feed Posts */}
          <main className="w-full max-w-2xl py-4 flex flex-col gap-4">
            {/* Top Stories / Pulses Reel */}
            <StoriesReel currentUser={currentUser} />

            {/* Create Post Studio Card */}
            <CreatePost
              currentUser={currentUser}
              onAddPost={handleAddPost}
              autoOpen={autoOpenCreate}
              onAutoOpenHandled={() => setAutoOpenCreate(false)}
            />

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
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center backdrop-blur-xs">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {dir === "ltr" ? "No posts yet" : "تا ئێستا هیچ پۆستێک نییە"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                    {dir === "ltr"
                      ? "Share your first thought or photo with the community above!"
                      : "یەکەمین بیرۆکە یان وێنەی خۆت لەگەڵ هاوڕێیان هاوبەش بکە!"}
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLikeToggle={handleLikeToggle}
                    onAddComment={handleAddComment}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
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
