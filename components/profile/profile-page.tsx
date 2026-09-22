"use client";

import {
  AlertCircle,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Flame,
  Globe2,
  Grid,
  Heart,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Radio,
  Settings,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/motion/button";
import { toast } from "@/components/ui/toast";
import { useLanguage } from "@/lib/language-context";
import { CreatePost } from "../feed/create-post";
import { CURRENT_USER, CURRENT_USER_PROFILE } from "../feed/dummy-data";
import { PostCard } from "../feed/post-card";
import { Post } from "../feed/types";
import { createClient } from "@/lib/supabase/client";
import { ProfileSkeleton } from "./profile-skeleton";
import {
  isValidKurdishLocation,
  sanitizeKurdishLocation,
  VALID_LOCATIONS,
} from "@/lib/kurdish-cities";
import { compressAvatar, compressBanner } from "@/lib/image-compress";

import { User } from "../feed/types";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

interface ProfilePageProps {
  currentUser?: User;
  userId?: string;
  posts: Post[];
  onAddPost?: (newPost: Post) => void;
  onLikeToggle?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onOpenDialog?: (post: Post) => void;
  onBackToFeed?: () => void;
  onOpenSettings?: () => void;
}

export function ProfilePage({
  currentUser,
  userId = "61579905294291",
  posts,
  onAddPost,
  onLikeToggle,
  onAddComment,
  onOpenDialog,
  onBackToFeed,
  onOpenSettings,
}: ProfilePageProps) {
  const hookUser = useCurrentUser();
  const activeUser = currentUser ?? hookUser;
  const { language, dir, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Profile editable fields
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [joinedDate, setJoinedDate] = useState("");
  const [followersCount, setFollowersCount] = useState("0");
  const [followingCount, setFollowingCount] = useState(0);

  // Profile ownership & follow state (IDOR protection)
  const [profileUuid, setProfileUuid] = useState<string | null>(null);
  const [currentAuthUserId, setCurrentAuthUserId] = useState<string | null>(null);
  const [currentAuthSeqId, setCurrentAuthSeqId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch logged-in user identity from Supabase Auth
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setCurrentAuthUserId(user.id);
        const { data: prof } = await supabase
          .from("profiles")
          .select("sequential_id")
          .eq("id", user.id)
          .maybeSingle();
        if (prof?.sequential_id) {
          setCurrentAuthSeqId(String(prof.sequential_id));
        }
      }
    });
  }, []);

  // Determine if viewing user is the legitimate owner of this profile
  const isOwnProfile = Boolean(
    (currentAuthUserId && profileUuid && currentAuthUserId === profileUuid) ||
    (currentAuthSeqId && userId && currentAuthSeqId === String(userId)) ||
    (currentAuthUserId && userId && currentAuthUserId === String(userId)) ||
    (activeUser && (activeUser.id === String(userId) || (profileUuid && activeUser.id === profileUuid)))
  );

  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev);
    setFollowersCount((prev) => {
      const cur = parseInt(prev.replace(/,/g, ""), 10) || 0;
      return String(isFollowing ? Math.max(0, cur - 1) : cur + 1);
    });
    toast.add({
      title: isFollowing ? "فۆڵۆو لادرا" : "فۆڵۆو کرا! ✨",
      description: isFollowing
        ? `ئیتر بەدواداچوون بۆ ${name} ناکەیت.`
        : `دەستت کرد بە فۆڵۆوکردنی ${name}.`,
      type: "success",
    });
  };

  // Edit form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Live location validation
  const isLocationInputValid = isValidKurdishLocation(locationInput.trim());
  const hasLatinInLocation = /[a-zA-Z]/.test(locationInput);

  // Fake Username Availability Checker
  const [checkerStatus, setCheckerStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.add({
        title: "هەڵە لە دیاریکردنی وێنە",
        description: "تەنها فایلی وێنە قبوڵ دەکرێت",
        type: "error",
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      // 1. Client-side canvas compression: max 200KB @ 400x400
      const compressed = await compressAvatar(file);

      // 2. Upload to R2 endpoint
      const formData = new FormData();
      formData.append("file", compressed, "avatar.webp");

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "نەتوانرا وێنەکە باربکرێت");
      }

      const data = await res.json();
      setAvatar(data.url);
      toast.add({
        title: "وێنەی پڕۆفایل نوێکرایەوە! ✨",
        description: "وێنەی پڕۆفایلەکەت بە سەرکەوتوویی بارکرا و وێنە کۆنەکە سڕدرایەوە.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "هەڵە لە بارکردنی وێنە",
        description: err.message || "هەڵەیەک ڕوویدا",
        type: "error",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.add({
        title: "هەڵە لە دیاریکردنی وێنە",
        description: "تەنها فایلی وێنە قبوڵ دەکرێت",
        type: "error",
      });
      return;
    }

    try {
      setIsUploadingCover(true);
      // 1. Client-side canvas compression: max 500KB @ 1600x600
      const compressed = await compressBanner(file);

      // 2. Upload to R2 endpoint
      const formData = new FormData();
      formData.append("file", compressed, "banner.webp");

      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "نەتوانرا وێنەی بەرگ باربکرێت");
      }

      const data = await res.json();
      setCoverPhoto(data.url);
      toast.add({
        title: "وێنەی بەرگ نوێکرایەوە! 🌄",
        description: "وێنەی بەرگی پڕۆفایلەکەت بە سەرکەوتوویی بارکرا و وێنە کۆنەکە سڕدرایەوە.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "هەڵە لە بارکردنی وێنەی بەرگ",
        description: err.message || "هەڵەیەک ڕوویدا",
        type: "error",
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Fetch real profile data from Supabase/API by userId
  useEffect(() => {
    if (!userId) return;
    setIsLoadingProfile(true);

    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setProfileUuid(data.uuid || null);
          setName(data.name || "");
          setHandle(data.handle || "");
          setRole(data.role || "ئەندامی پۆلا");
          setBio(data.bio || "");
          setLocation(data.location || "كوردستان");
          setWebsite(data.website || "");
          setAvatar(data.avatar || CURRENT_USER_PROFILE.avatar);
          setCoverPhoto(data.coverPhoto || CURRENT_USER_PROFILE.coverPhoto);
          setJoinedDate(data.joinedDate || CURRENT_USER_PROFILE.joinedDate);
          if (data.stats) {
            setFollowersCount(String(data.stats.followers ?? "0"));
            setFollowingCount(Number(data.stats.following ?? 0));
          }
        } else {
          // Fallback to defaults
          setName(CURRENT_USER_PROFILE.name);
          setHandle(CURRENT_USER_PROFILE.handle);
          setRole(CURRENT_USER_PROFILE.role);
          setBio(CURRENT_USER_PROFILE.bio);
          setLocation(CURRENT_USER_PROFILE.location);
          setWebsite(CURRENT_USER_PROFILE.website);
          setAvatar(CURRENT_USER_PROFILE.avatar);
          setCoverPhoto(CURRENT_USER_PROFILE.coverPhoto);
          setJoinedDate(CURRENT_USER_PROFILE.joinedDate);
        }
      })
      .catch((err) => {
        console.error("Error loading user profile:", err);
        // Fallback gracefully
        setName(CURRENT_USER_PROFILE.name);
        setHandle(CURRENT_USER_PROFILE.handle);
        setAvatar(CURRENT_USER_PROFILE.avatar);
        setCoverPhoto(CURRENT_USER_PROFILE.coverPhoto);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [userId]);

  // Filter posts created by the profile user ("What I Posted")
  const myPosts = posts.filter(
    (post) =>
      post.author.id === userId ||
      (profileUuid && post.author.id === profileUuid) ||
      (handle && post.author.handle === handle)
  );

  // Username input handler with debounce for fake checker
  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setHandleInput(clean);

    if (!clean || clean.length < 3) {
      setCheckerStatus("idle");
      return;
    }

    if (clean === handle.replace(/^@/, "").toLowerCase()) {
      setCheckerStatus("idle");
      return;
    }

    setCheckerStatus("checking");
  };

  useEffect(() => {
    if (checkerStatus !== "checking") return;
    const timer = setTimeout(() => {
      // Mock list of already taken usernames for the fake checker
      const takenList = [
        "admin",
        "pola",
        "support",
        "kurd",
        "official",
        "alex",
        "user",
        "root",
        "moderator",
        "bot",
        "kurdistan",
        "hawler",
        "slemani",
      ];
      if (takenList.includes(handleInput.toLowerCase())) {
        setCheckerStatus("taken");
      } else {
        setCheckerStatus("available");
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [handleInput, checkerStatus]);

  const handleOpenEditProfile = () => {
    if (!isOwnProfile) return;
    setNameInput(name);
    setHandleInput(handle.replace(/^@/, ""));
    setRoleInput(role);
    setBioInput(bio);
    setLocationInput(location);
    setWebsiteInput(website);
    setCheckerStatus("idle");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (checkerStatus === "taken") {
      toast.add({
        title: "ناوی بەکارهێنەر گیراوە! ✕",
        description: "تکایە ناوێکی بەکارهێنەری تر هەڵبژێرە چونکە ئەم ناوە پێشتر بەکارهاتووە.",
        type: "error",
      });
      return;
    }

    // Strict location validation before saving
    const locToValidate = locationInput.trim() || location;
    const sanitizedLoc = sanitizeKurdishLocation(locToValidate);
    if (!sanitizedLoc || !isValidKurdishLocation(sanitizedLoc)) {
      toast.add({
        title: "شوێنی نادروست! ✕",
        description: "تکایە ناوی شارێکی دروستی کوردستان بنووسە بە شێوازی (شار، کوردستان). وەک: هەولێر، کوردستان",
        type: "error",
      });
      return;
    }

    const finalName = nameInput.trim() || name;
    const cleanHandle = handleInput.trim();
    const finalHandle = cleanHandle ? `@${cleanHandle}` : handle;
    const finalRole = roleInput.trim() || role;
    const finalBio = bioInput.trim();
    const finalLocation = sanitizedLoc;
    let finalWebsite = websiteInput.trim();
    if (finalWebsite && !finalWebsite.startsWith("http://") && !finalWebsite.startsWith("https://")) {
      finalWebsite = `https://${finalWebsite}`;
    }
    finalWebsite = finalWebsite || website;

    setIsSavingProfile(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("تکایە سەرەتا بچۆ ژوورەوە");
      }

      // Route through server-side PATCH endpoint for strict server validation
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: finalName,
          username: cleanHandle || undefined,
          role: finalRole,
          bio: finalBio,
          location: finalLocation,
          website: finalWebsite,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "هەڵەیەک لە سێرڤەردا ڕوویدا");
      }

      // Success -> update local and memory state
      setName(finalName);
      setHandle(finalHandle);
      setRole(finalRole);
      setBio(finalBio);
      setLocation(finalLocation);
      setWebsite(finalWebsite);

      CURRENT_USER_PROFILE.name = finalName;
      CURRENT_USER_PROFILE.handle = finalHandle;
      CURRENT_USER_PROFILE.role = finalRole;
      CURRENT_USER_PROFILE.bio = finalBio;
      CURRENT_USER_PROFILE.location = finalLocation;
      CURRENT_USER_PROFILE.website = finalWebsite;
      CURRENT_USER.name = finalName;
      CURRENT_USER.handle = finalHandle;

      setIsEditingProfile(false);
      toast.add({
        title: "پڕۆفایل نوێکرایەوە! ✨",
        description: "زانیارییەکانی پڕۆفایلەکەت بە سەرکەوتوویی پاشەکەوت کران.",
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "هەڵە لە پاشەکەوتکردن! ✕",
        description: err.message || "پڕۆفایل نوێنەکرایەوە",
        type: "error",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const [isCopied, setIsCopied] = useState(false);

  const handleShareProfile = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?page=profile&id=${userId}`;
    navigator.clipboard?.writeText?.(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoadingProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <div dir={dir} className={`w-full max-w-5xl mx-auto pb-16 px-2 sm:px-4 ${dir === "rtl" ? "text-right" : "text-left"}`}>
      {/* Cover Photo Header with Hover to Change */}
      <div
        onClick={() => isOwnProfile && !isUploadingCover && coverInputRef.current?.click()}
        className={`relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-border/70 shadow-sm bg-muted transition-all select-none ${
          isOwnProfile ? "group cursor-pointer" : ""
        }`}
        title={isOwnProfile ? "کلیک بکە بۆ گۆڕینی وێنەی بەرگ" : undefined}
      >
        {isOwnProfile && (
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        )}
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden">
          <img
            src={coverPhoto || CURRENT_USER_PROFILE.coverPhoto}
            alt="Profile Cover"
            className={`h-full w-full object-cover transition-transform duration-500 ${
              isOwnProfile ? "group-hover:scale-105" : ""
            }`}
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Sleek Dark Hover Overlay or Uploading Indicator */}
          {isOwnProfile && (
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-[1.5px] transition-all duration-300 flex items-center justify-center pointer-events-none ${
              isUploadingCover ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              <div className="flex items-center gap-2 rounded-full border border-white/30 bg-black/75 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md shadow-2xl">
                {isUploadingCover ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>وێنەی بەرگ باردەکرێت...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 text-white" />
                    <span>گۆڕینی وێنەی بەرگ</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Header Details & Avatar */}
      <div className="relative px-4 md:px-8 pb-4">
        {/* Top Action Row: Floating Avatar + Action Buttons */}
        <div className="flex items-end justify-between gap-4">
          {/* Avatar floats over the cover banner with hover camera edit */}
          <div
            onClick={() => isOwnProfile && !isUploadingAvatar && avatarInputRef.current?.click()}
            className={`-mt-16 sm:-mt-20 relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-full bg-background p-1.5 ring-4 ring-background shadow-xl select-none transition-transform ${
              isOwnProfile ? "cursor-pointer group active:scale-95" : ""
            }`}
            title={isOwnProfile ? "کلیک بکە بۆ گۆڕینی وێنەی پڕۆفایل" : undefined}
          >
            {isOwnProfile && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            )}
            <div className="relative w-full h-full rounded-full overflow-hidden bg-muted">
              <img
                src={avatar || CURRENT_USER_PROFILE.avatar}
                alt={name || "User Avatar"}
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  isOwnProfile ? "group-hover:scale-105" : ""
                }`}
              />
              {/* Avatar Hover / Uploading Overlay */}
              {isOwnProfile && (
                <div className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity flex flex-col items-center justify-center ${
                  isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}>
                  {isUploadingAvatar ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="h-4 w-4 text-white drop-shadow-sm" />
                      <span className="text-[9px] font-bold text-white mt-0.5">گۆڕین</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <span
              className="absolute bottom-1 right-1 size-3.5 sm:size-4 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm"
              title="چالاک لە پۆلا"
            />
          </div>

          {/* Action Buttons: Edit Profile & Share, or Follow & Message if someone else */}
          <div className="flex items-center gap-2 pt-3 shrink-0">
            {isOwnProfile ? (
              <Button
                size="sm"
                onClick={handleOpenEditProfile}
                className="rounded-full gap-1.5 text-xs font-semibold px-4 h-9 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{t("editProfile")}</span>
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleToggleFollow}
                  className={`rounded-full gap-1.5 text-xs font-semibold px-4 h-9 cursor-pointer transition-all ${
                    isFollowing
                      ? "border border-border bg-card text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>فۆڵۆوکراوە</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>فۆڵۆو بکە</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    toast.add({
                      title: "نامەکان",
                      description: "بەشی نامەگۆڕینەوە بەمزووانە چالاک دەبێت.",
                      type: "info",
                    });
                  }}
                  className="rounded-full gap-1.5 text-xs font-semibold px-3.5 h-9 cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>پەیام</span>
                </Button>
              </>
            )}

            <Button
              variant={isCopied ? "secondary" : "secondary"}
              size="sm"
              onClick={handleShareProfile}
              className={`rounded-full gap-1.5 text-xs font-semibold px-3.5 h-9 cursor-pointer transition-all ${
                isCopied ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : ""
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">لەبەرگیرایەوە!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{t("share")}</span>
                </>
              )}
            </Button>

            {isOwnProfile && onOpenSettings && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenSettings}
                className="rounded-full gap-1.5 text-xs font-semibold px-3.5 h-9 cursor-pointer"
                title={t("settings")}
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("settings")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* User Identifiers: Name, Handle, Status, Role (ID 61579905294291 Removed) */}
        <div className={`mt-4 space-y-1.5 ${dir === "rtl" ? "text-right" : "text-left"}`}>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {name}
            </h1>
            <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <span dir="ltr" className="font-semibold text-foreground/90 font-sans">
              {handle}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-500 font-medium text-xs">
              <Radio className="h-3 w-3 animate-pulse shrink-0" />
              {t("activeInPola")}
            </span>
            <span>·</span>
            <span className="text-xs font-medium text-muted-foreground">
              {role}
            </span>
          </div>
        </div>

        {/* Bio & Meta or Comprehensive Profile Editor */}
        <div className="mt-4 max-w-2xl">
          <AnimatePresence mode="wait">
            {isEditingProfile ? (
              <motion.div
                key="edit-profile-form"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md p-5 sm:p-6 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      دەستکاریکردنی زانیارییەکانی پڕۆفایل
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    ناو (Display Name)
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 px-3.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-right font-semibold"
                  />
                </div>

                {/* Username with Live Fake Availability Checker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      ناوی بەکارهێنەر (Username)
                    </label>
                    {checkerStatus === "checking" && (
                      <span className="flex items-center gap-1.5 text-[11px] text-sky-400 font-medium">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>لە پشکنیندایە...</span>
                      </span>
                    )}
                    {checkerStatus === "available" && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>بەردەستە بۆ تۆمارکردن ✓</span>
                      </span>
                    )}
                    {checkerStatus === "taken" && (
                      <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <AlertCircle className="h-3 w-3" />
                        <span>ئەم ناوە پێشتر گیراوە ✕</span>
                      </span>
                    )}
                    {checkerStatus === "idle" && (
                      <span className="text-[10px] text-muted-foreground">
                        ناوی ئێستاتە
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold text-xs pointer-events-none">
                      @
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={handleInput}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="alexmorgan"
                      className={`w-full rounded-xl border bg-background/80 py-2.5 pr-8 pl-3 text-xs font-mono font-semibold transition-all focus:outline-none focus:ring-2 text-right ${
                        checkerStatus === "taken"
                          ? "border-rose-500/60 focus:ring-rose-500/30 text-rose-400"
                          : checkerStatus === "available"
                          ? "border-emerald-500/60 focus:ring-emerald-500/30 text-emerald-400"
                          : "border-border/80 focus:ring-primary/30 text-foreground"
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    دەتوانیت پیتەکانی ئینگلیزی (a-z)، ژمارەکان و (_) بەکاربهێنیت.
                  </p>
                </div>

                {/* Role / Job Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    پیشە یان ناونیشان
                  </label>
                  <input
                    type="text"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    placeholder="سەرپەرشتیاری تەلارسازی ڕووکار"
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 px-3.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-right"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    ناساندنی کەسی (بایۆ)
                  </label>
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    rows={3}
                    placeholder="دەربارەی خۆت و کارەکانت کەمێک بنووسە..."
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 px-3.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none text-right"
                  />
                </div>

                {/* Location & Website in 2 Columns */}
                <div className="space-y-3">
                  {/* Location with Strict Kurdish City Validation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>شوێن / شار</span>
                        <span className="text-[10px] text-muted-foreground font-normal">(شار، کوردستان)</span>
                      </label>
                      {locationInput && (
                        isLocationInputValid ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" /> شاری دروست
                          </span>
                        ) : (
                          <span className="text-[11px] text-destructive font-semibold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> نادروست
                          </span>
                        )
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="هەولێر، کوردستان"
                        className={`w-full rounded-xl border py-2.5 pr-3.5 pl-9 text-xs text-foreground focus:outline-none focus:ring-2 transition-all text-right ${
                          locationInput && !isLocationInputValid
                            ? "border-destructive text-destructive bg-destructive/5 focus:ring-destructive/30"
                            : "border-border/80 bg-background/80 focus:ring-primary/30"
                        }`}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {locationInput && !isLocationInputValid ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : isLocationInputValid ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Live Validation Alert Message */}
                    {locationInput && !isLocationInputValid && (
                      <p className="text-[11px] font-medium text-destructive leading-tight flex items-center gap-1 pt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {hasLatinInLocation
                          ? `نووسینی ئینگلیزی/لاتینی ("${locationInput}") قەدەغەیە! تەنها شارەکانی کوردستان بنووسە.`
                          : "شوێن نادروستە! پێویستە ناوی شارێکی کوردستان بێت بە شێوازی (شار، کوردستان). وەک: هەولێر، کوردستان"}
                      </p>
                    )}

                    {/* Quick Kurdish Cities Selection */}
                    <div className="pt-1.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>هەڵبژاردنی خێرا:</span>
                        <select
                          value={isLocationInputValid ? locationInput : ""}
                          onChange={(e) => {
                            if (e.target.value) setLocationInput(e.target.value);
                          }}
                          className="bg-muted/60 border border-border/60 rounded-lg px-2 py-0.5 text-[11px] text-foreground focus:outline-none cursor-pointer"
                        >
                          <option value="">هەموو شارەکانی کوردستان...</option>
                          {VALID_LOCATIONS.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {["هەولێر، کوردستان", "سلێمانی، کوردستان", "دهۆک، کوردستان", "کەرکووک، کوردستان", "هەڵەبجە، کوردستان", "زاخۆ، کوردستان"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setLocationInput(c)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              locationInput === c
                                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border-border/60"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>ماڵپەڕ یان لینک</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      placeholder="pola.network/alex"
                      className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 px-3.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-left font-mono"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsEditingProfile(false)}
                    className="rounded-xl text-xs h-8.5 px-4 cursor-pointer"
                  >
                    پاشگەزبوونەوە
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={
                      checkerStatus === "taken" ||
                      checkerStatus === "checking" ||
                      !isLocationInputValid ||
                      isSavingProfile
                    }
                    className="rounded-xl text-xs h-8.5 px-5 font-bold cursor-pointer gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>پاشەکەوت دەکرێت...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>پاشەکەوتکردن</span>
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="profile-normal-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Bio text */}
                <p className={`text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal ${
                  dir === "rtl" ? "text-right" : "text-left"
                }`}>
                  {bio}
                </p>

                {/* Meta Info: Location, Joined, Website */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>بەشداربووە لە {joinedDate || CURRENT_USER_PROFILE.joinedDate}</span>
                  </div>
                  {website && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:underline font-mono"
                      dir="ltr"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                </div>

                {/* Clean inline follower & following stats */}
                <div className="mt-3.5 flex items-center gap-4 text-xs pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                    <strong className="font-extrabold text-foreground font-mono text-sm">
                      {followingCount}
                    </strong>
                    <span className="text-muted-foreground font-medium">شوێنکەوتوو</span>
                  </div>
                  <span className="h-3 w-px bg-border/80" />
                  <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                    <strong className="font-extrabold text-foreground font-mono text-sm">
                      {followersCount}
                    </strong>
                    <span className="text-muted-foreground font-medium">شوێنکەوتووان</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Profile Navigation Tabs (Posts & Media only, Spheres removed) */}
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
          <span>
            {language === "en"
              ? `My Moments (${myPosts.length})`
              : `بڵاوکراوەکانم (${myPosts.length})`}
          </span>
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
          <span>{language === "en" ? "Media & Visuals" : "وێنە و بینراوەکان"}</span>
          {activeTab === "media" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-foreground rounded-full" />
          )}
        </button>
      </div>

      {/* Main Profile Grid: Left Info / Featured + Right Posts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Intro & Featured Media Gallery */}
        <div className="space-y-4">
          {/* Intro Card */}
          <div className={`rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-3 ${dir === "rtl" ? "text-right" : "text-left"}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {language === "en" ? "Creator Profile" : "ناساندنی دروستکەر"}
            </h3>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {language === "en"
                ? "Spatial interaction designer & UX engineer at Pola."
                : "دیزاینەری شێوازی کارلێکی شوێنی و ئەندازیاری ڕووکاری بەکارهێنەر لە پۆلا."}
            </p>
            <div className="border-t border-border/50 pt-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{language === "en" ? "Resonance Rank" : "پلەی دەنگدانەوە"}</span>
                <span className="font-semibold text-foreground">
                  {language === "en" ? "Top 2% of Creators" : "لە ٢٪ی دروستکەرە باڵاکان"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{language === "en" ? "Account Status" : "دۆخی هەژمار"}</span>
                <span className="font-semibold text-emerald-500">
                  {language === "en" ? "Verified Partner" : "هاوبەشی پشتڕاستکراو"}
                </span>
              </div>
            </div>
          </div>

          {/* Featured Visuals / Photos Grid */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {language === "en" ? "Featured Gallery" : "پێشانگای هەڵبژێردراو"}
              </h3>
              <span className="text-[11px] font-semibold text-primary hover:underline cursor-pointer">
                {language === "en" ? "See all" : "هەمووی ببینە"}
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
              {/* Profile Post Studio Trigger - only on own profile */}
              {isOwnProfile && (
                <CreatePost currentUser={activeUser} onAddPost={onAddPost} />
              )}

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
                    {language === "en" ? "No moments shared yet" : "هیچ ساتێک بڵاونەکراوەتەوە"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {language === "en"
                      ? "Share your first moment with the Pola community!"
                      : "یەکەم سات یان بیروڕای خۆت لەگەڵ بازنەی پۆلا بەش بکە!"}
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
        </div>
      </div>
    </div>
  );
}
