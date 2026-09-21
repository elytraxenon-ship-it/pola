export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified?: boolean;
  online?: boolean;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  contentEn?: string;
  timestamp: string;
  timestampEn?: string;
  likes: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  author: User;
  timestamp: string;
  timestampEn?: string;
  privacy: "public" | "friends" | "only_me";
  content: string;
  contentEn?: string;
  tags?: string[];
  tagsEn?: string[];
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  comments: Comment[];
  commentsEn?: Comment[];
}

export interface Story {
  id: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  hasUnseen?: boolean;
}

export interface FriendRequest {
  id: string;
  user: User;
  mutualFriends: number;
  timeAgo: string;
}

export interface TrendingTopic {
  id: string;
  category: string;
  tag: string;
  postsCount: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  status?: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;
  contact: User;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isUnread: boolean;
  isGroup?: boolean;
  groupName?: string;
  isVoiceMessage?: boolean;
  messages: ChatMessage[];
}
