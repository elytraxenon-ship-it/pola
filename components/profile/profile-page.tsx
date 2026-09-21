"use client";

import {
  Calendar,
  Camera,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Flame,
  Globe2,
  Grid,
  Heart,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  MessageSquare,
  Orbit,
  Plus,
  Radio,
  Share2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/motion/button";
import { toast } from "@/components/ui/toast";
import { CreatePost } from "../feed/create-post";
import { CURRENT_USER_PROFILE } from "../feed/dummy-data";
import { PostCard } from "../feed/post-card";
import { Post } from "../feed/types";

interface ProfilePageProps {
  posts: Post[];
  onAddPost?: (newPost: Post) => void;
  onLikeToggle?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onOpenDialog?: (post: Post) => void;
  onBackToFeed?: () => void;
}

export function ProfilePage({
  posts,
  onAddPost,
  onLikeToggle,
  onAddComment,
  onOpenDialog,
  onBackToFeed,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "media" | "spheres">("posts");
  const [bio, setBio] = useState(CURRENT_USER_PROFILE.bio);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(CURRENT_USER_PROFILE.bio);

  // Filter posts created by the current user ("What I Posted")
  const myPosts = posts.filter(
    (post) =>
      post.author.id === CURRENT_USER_PROFILE.id ||
      post.author.handle === CURRENT_USER_PROFILE.handle
  );

  const handleSaveBio = () => {
    setBio(bioInput);
    setIsEditingBio(false);
    toast.add({
      title: "بایۆ نوێکرایەوە! ✨",
      description: "ناساندنی پڕۆفایلەکەت بە سەرکەوتوویی نوێ کرایەوە.",
      type: "success",
    });
  };

  const handleShareProfile = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    toast.add({
      title: "بەستەر لەبەرگیرایەوە! 🔗",
      description: "بەستەری پڕۆفایلەکەت بە سەرکەوتوویی لەبەرگیرایەوە.",
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-16 px-2 sm:px-4 text-right">
      {/* Cover Photo Header */}
      <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-border/70 shadow-sm bg-muted">
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden">
          <img
            src={CURRENT_USER_PROFILE.coverPhoto}
            alt="Profile Cover"
            className="h-full w-full object-cover"
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        {/* Change Cover Photo Button */}
        <button
          type="button"
          className="absolute left-4 bottom-4 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-black/80 transition-all cursor-pointer shadow-md"
        >
          <Camera className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">گۆڕینی بەرگ</span>
        </button>
      </div>

      {/* Profile Header Details & Avatar */}
      <div className="relative px-4 md:px-8 pb-4">
        {/* Top Action Row: Floating Avatar + Action Buttons */}
        <div className="flex items-end justify-between gap-4">
          {/* Only the avatar floats over the cover banner */}
          <div className="-mt-16 sm:-mt-20 relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-full bg-background p-1.5 ring-4 ring-background shadow-xl">
            <div className="relative w-full h-full rounded-full overflow-hidden bg-muted">
              <img
                src={CURRENT_USER_PROFILE.avatar}
                alt={CURRENT_USER_PROFILE.name}
                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              />
            </div>
            <span
              className="absolute bottom-1 right-1 size-3.5 sm:size-4 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm"
              title="چالاک لە پۆلا"
            />
          </div>

          {/* Action Buttons: Edit Profile & Share */}
          <div className="flex items-center gap-2 pt-3 shrink-0">
            <Button
              size="sm"
              onClick={() => setIsEditingBio(true)}
              className="rounded-full gap-1.5 text-xs font-semibold px-4 h-9 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>دەستکاریی پڕۆفایل</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleShareProfile}
              className="rounded-full gap-1.5 text-xs font-semibold px-3.5 h-9 cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">هاوبەشکردن</span>
            </Button>
          </div>
        </div>

        {/* User Identifiers: Safely below the banner in clean normal flow */}
        <div className="mt-4 space-y-1.5 text-right">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {CURRENT_USER_PROFILE.name}
            </h1>
            <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <span dir="ltr" className="font-semibold text-foreground/90 font-sans">
              {CURRENT_USER_PROFILE.handle}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-500 font-medium text-xs">
              <Radio className="h-3 w-3 animate-pulse shrink-0" />
              چالاک لە پۆلا
            </span>
            <span>·</span>
            <span className="text-xs font-medium text-muted-foreground">
              {CURRENT_USER_PROFILE.role}
            </span>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-4 max-w-2xl">
          {isEditingBio ? (
            <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={3}
                className="w-full resize-none bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none text-right"
                placeholder="دەربارەی خۆت و کارەکانت کەمێک بنووسە..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditingBio(false)}
                  className="rounded-full text-xs h-7.5 px-3 cursor-pointer"
                >
                  پاشگەزبوونەوە
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveBio}
                  className="rounded-full text-xs h-7.5 px-3 font-semibold cursor-pointer"
                >
                  پاشەکەوتکردن
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal text-right">
              {bio}
            </p>
          )}

          {/* Meta Info: Location, Joined, Website */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{CURRENT_USER_PROFILE.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>بەشداربووە لە {CURRENT_USER_PROFILE.joinedDate}</span>
            </div>
            <a
              href={CURRENT_USER_PROFILE.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
              dir="ltr"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>pola.network/alex</span>
            </a>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 border-y border-border/60 py-3">
          <div className="flex flex-col items-center sm:items-start px-3 py-1">
            <span className="text-lg font-extrabold text-foreground">
              {myPosts.length}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              ساتە بڵاوکراوەکان
            </span>
          </div>
          <div className="flex flex-col items-center sm:items-start px-3 py-1">
            <span className="text-lg font-extrabold text-foreground">
              {CURRENT_USER_PROFILE.stats.followers}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              ئەندامانی بازنە
            </span>
          </div>
          <div className="flex flex-col items-center sm:items-start px-3 py-1">
            <span className="text-lg font-extrabold text-foreground">
              {CURRENT_USER_PROFILE.stats.following}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              شوێنکەوتوو
            </span>
          </div>
          <div className="flex flex-col items-center sm:items-start px-3 py-1">
            <span className="text-lg font-extrabold text-amber-500 font-sans" dir="ltr">
              {CURRENT_USER_PROFILE.stats.resonanceScore}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              نمرەی دەنگدانەوە
            </span>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center border-b border-border/70 mb-5 px-4 justify-start">
        <button
          onClick={() => setActiveTab("posts")}
          className={`relative flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "posts"
              ? "text-foreground font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>بڵاوکراوەکانم ({myPosts.length})</span>
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-foreground rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("media")}
          className={`relative flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "media"
              ? "text-foreground font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>وێنە و بینراوەکان</span>
          {activeTab === "media" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-foreground rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("spheres")}
          className={`relative flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "spheres"
              ? "text-foreground font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Orbit className="h-4 w-4" />
          <span>بوار و کۆمەڵگەکان</span>
          {activeTab === "spheres" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-foreground rounded-full" />
          )}
        </button>
      </div>

      {/* Main Profile Grid: Left Info / Featured + Right Posts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Intro & Featured Media Gallery */}
        <div className="space-y-4">
          {/* Intro Card */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-3 text-right">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ناساندنی دروستکەر
            </h3>
            <p className="text-xs text-foreground/80 leading-relaxed">
              دیزاینەری شێوازی کارلێکی شوێنی و ئەندازیاری ڕووکاری بەکارهێنەر لە پۆلا.
            </p>
            <div className="border-t border-border/50 pt-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>پلەی دەنگدانەوە</span>
                <span className="font-semibold text-foreground">لە ٢٪ی دروستکەرە باڵاکان</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>دۆخی هەژمار</span>
                <span className="font-semibold text-emerald-500">هاوبەشی پشتڕاستکراو</span>
              </div>
            </div>
          </div>

          {/* Featured Visuals / Photos Grid */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                پێشانگای هەڵبژێردراو
              </h3>
              <span className="text-[11px] font-semibold text-primary hover:underline cursor-pointer">
                هەمووی ببینە
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CURRENT_USER_PROFILE.featuredPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/40 group cursor-pointer"
                >
                  <img
                    src={photo}
                    alt={`Featured ${index}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: "What I Posted" Feed Stream or Media Tab */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "posts" && (
            <>
              {/* Profile Post Studio Trigger */}
              <CreatePost onAddPost={onAddPost} />

              {/* What I Posted Feed */}
              {myPosts.length > 0 ? (
                myPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLikeToggle={onLikeToggle}
                    onAddComment={onAddComment}
                    onOpenDialog={onOpenDialog}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-border/70 bg-card p-8 text-center space-y-2">
                  <Sparkles className="h-8 w-8 text-muted-foreground mx-auto" />
                  <h4 className="text-sm font-bold text-foreground">
                    هیچ ساتێک بڵاونەکراوەتەوە
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    یەکەم سات یان بیروڕای خۆت لەگەڵ بازنەی پۆلا بەش بکە!
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "media" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CURRENT_USER_PROFILE.featuredPhotos.concat(
                myPosts.map((p) => p.mediaUrl).filter(Boolean) as string[]
              ).map((img, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/60 group cursor-pointer shadow-xs"
                >
                  <img
                    src={img}
                    alt={`Media ${i}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === "spheres" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "جووڵە و ڕووکاری زیرەک", role: "دامەزرێنەری هاوبەش", count: "٢٤.٦ هەزار دەنگدانەوە" },
                { name: "تەلارسازی شوێنی", role: "بەشداربوو", count: "١٢.٨ هەزار دەنگدانەوە" },
                { name: "داهێنەرە سەربەخۆکان", role: "ئەندام", count: "٣١.٢ هەزار دەنگدانەوە" },
                { name: "دیزاینی بەرهەمی سادە", role: "ئەندام", count: "١٩.٤ هەزار دەنگدانەوە" },
              ].map((sphere, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs hover:border-border transition-all text-right"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-mono text-sm font-bold">
                    ✦
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="text-xs font-bold text-foreground truncate">
                      {sphere.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {sphere.role} · {sphere.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
