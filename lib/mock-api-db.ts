import { Post, User } from "@/components/feed/types";
import { CURRENT_USER, CURRENT_USER_PROFILE, INITIAL_POSTS, UserProfile } from "@/components/feed/dummy-data";

export interface FeedbackRecord {
  id: string;
  feedback: string;
  rating?: number;
  userId?: string;
  userHandle?: string;
  timestamp: string;
  dateKey: string;
}

// Global in-memory storage for Next.js dev server/runtime
declare global {
  // eslint-disable-next-line no-var
  var __POLA_POSTS__: Post[] | undefined;
  // eslint-disable-next-line no-var
  var __POLA_USERS__: Record<string, UserProfile> | undefined;
  // eslint-disable-next-line no-var
  var __POLA_FEEDBACKS__: FeedbackRecord[] | undefined;
}

if (!global.__POLA_POSTS__) {
  global.__POLA_POSTS__ = [...INITIAL_POSTS];
}

if (!global.__POLA_USERS__) {
  global.__POLA_USERS__ = {
    "61579905294291": {
      ...CURRENT_USER_PROFILE,
      id: "61579905294291",
    },
    "u-current": CURRENT_USER_PROFILE,
    "user-1": {
      id: "user-1",
      name: "Soran Ahmad",
      handle: "@soran",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      coverPhoto: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
      bio: "گەشەپێدەری نەرمەکاڵا و ئارەزوومەندی فۆتۆگرافی لە هەولێر 🏔️",
      location: "هەولێر، كوردستان",
      role: "گەشەپێدەری کۆدەکان",
      joinedDate: "کانوونی دووەمی ٢٠٢٦",
      website: "https://pola.network/soran",
      stats: {
        posts: 12,
        followers: "2.1K",
        following: 180,
        resonanceScore: "94.2%",
      },
      featuredPhotos: [],
    },
  };
}

if (!global.__POLA_FEEDBACKS__) {
  global.__POLA_FEEDBACKS__ = [];
}

export const mockDb = {
  getPosts: () => global.__POLA_POSTS__!,
  getPostById: (id: string) => global.__POLA_POSTS__!.find((p) => p.id === id),
  addPost: (post: Post) => {
    global.__POLA_POSTS__!.unshift(post);
    return post;
  },
  updatePost: (id: string, updates: Partial<Post>) => {
    const index = global.__POLA_POSTS__!.findIndex((p) => p.id === id);
    if (index === -1) return null;
    global.__POLA_POSTS__![index] = { ...global.__POLA_POSTS__![index], ...updates };
    return global.__POLA_POSTS__![index];
  },
  deletePost: (id: string) => {
    const index = global.__POLA_POSTS__!.findIndex((p) => p.id === id);
    if (index === -1) return false;
    global.__POLA_POSTS__!.splice(index, 1);
    return true;
  },
  toggleRepost: (id: string) => {
    const post = global.__POLA_POSTS__!.find((p) => p.id === id);
    if (!post) return null;
    post.sharesCount = (post.sharesCount || 0) + 1;
    return post;
  },
  getUser: (id: string) => {
    if (global.__POLA_USERS__![id]) return global.__POLA_USERS__![id];
    // Return default profile configured with this id
    return {
      ...CURRENT_USER_PROFILE,
      id,
    };
  },
  addFeedback: (record: FeedbackRecord) => {
    global.__POLA_FEEDBACKS__!.push(record);
    return record;
  },
  getFeedbacks: () => global.__POLA_FEEDBACKS__!,
  hasFeedbackToday: (userIdOrIp: string, todayKey: string) => {
    return global.__POLA_FEEDBACKS__!.some(
      (f) => f.userId === userIdOrIp && f.dateKey === todayKey
    );
  },
};
