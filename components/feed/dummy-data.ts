import { Conversation, FriendRequest, Post, Story, TrendingTopic, User } from "./types";

export interface UserProfile extends User {
  coverPhoto: string;
  bio: string;
  bioEn?: string;
  location: string;
  locationEn?: string;
  role: string;
  roleEn?: string;
  joinedDate: string;
  joinedDateEn?: string;
  website: string;
  stats: {
    posts: number;
    followers: string;
    following: number;
    resonanceScore: string;
  };
  featuredPhotos: string[];
}

export const CURRENT_USER: User = {
  id: "u-current",
  name: "Alex Morgan",
  handle: "@alexmorgan",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  verified: true,
  online: true,
};

export const CURRENT_USER_PROFILE: UserProfile = {
  ...CURRENT_USER,
  coverPhoto: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&w=1600&q=80",
  bio: "ئەندازیاری ڕووکار و دیزاینەری ئەزموونی بەکارهێنەر لە پۆلا ✦ بەدواداچوون بۆ ڕووکاری شوێنی و جووڵەی نەرم لە دروستکردنی تۆڕە کۆمەڵایەتییەکاندا ✨",
  bioEn: "Interface Architect & UX Designer at Pola ✦ Exploring spatial surfaces and fluid micro-interactions for the next wave of social connection ✨",
  location: "سلێمانی، كوردستان",
  locationEn: "Sulaymaniyah, Kurdistan",
  role: "سەرپەرشتیاری تەلارسازی ڕووکار",
  roleEn: "Lead Interface Architect",
  joinedDate: "شوباتی ٢٠٢٦",
  joinedDateEn: "February 2026",
  website: "https://pola.network/alex",
  stats: {
    posts: 18,
    followers: "4.8K",
    following: 342,
    resonanceScore: "98.6%",
  },
  featuredPhotos: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=400&q=80",
  ],
};

export const DUMMY_STORIES: Story[] = [];

export const INITIAL_POSTS: Post[] = [];

export const DUMMY_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: "fr-1",
    user: {
      id: "u-fr1",
      name: "Daniel Rivera",
      handle: "@drivera",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    },
    mutualFriends: 14,
    timeAgo: "١ ڕۆژ لەمەوبەر",
  },
  {
    id: "fr-2",
    user: {
      id: "u-fr2",
      name: "Nora Lindqvist",
      handle: "@noralind",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    },
    mutualFriends: 8,
    timeAgo: "٢ ڕۆژ لەمەوبەر",
  },
];

export const DUMMY_TRENDING: TrendingTopic[] = [
  { id: "t-1", category: "چەخماخەی پۆلا · ٩٨٪ گەرموگوڕ", tag: "#هەستی_پۆلا", postsCount: "٥٤.٢ هەزار دەنگدانەوە" },
  { id: "t-2", category: "بواری دیزاین · باو و نوێ", tag: "#ڕووکاری_نوێ", postsCount: "٢٨.٤ هەزار دەنگدانەوە" },
  { id: "t-3", category: "تاقیگەی دروستکەران · گەرم", tag: "#جووڵەی_نەرم", postsCount: "٣٩.١ هەزار دەنگدانەوە" },
  { id: "t-4", category: "دیداری بینراو · دیار", tag: "#سادەیی_ناوازە", postsCount: "١٦.٨ هەزار دەنگدانەوە" },
];

export const DUMMY_CONTACTS: User[] = [
  {
    id: "c-1",
    name: "Sarah Chen",
    handle: "@sarahc",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    online: true,
  },
  {
    id: "c-2",
    name: "Marcus Vance",
    handle: "@marcusv",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    online: true,
  },
  {
    id: "c-3",
    name: "Ava Zhou",
    handle: "@avaz",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    online: true,
  },
  {
    id: "c-4",
    name: "Liam O'Connor",
    handle: "@liamoc",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    online: false,
  },
  {
    id: "c-5",
    name: "Elena Rostova",
    handle: "@elena",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80",
    online: true,
  },
];

export const DUMMY_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    contact: {
      id: "u-suhaib",
      name: "Suhaib Xoshnaw",
      handle: "@suhaib_x",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      online: true,
    },
    lastMessage: "دەستخۆشیت لێدەکەم بۆ پڕۆژەکە، کەی دەتوانین گفتوگۆ بکەین؟",
    timestamp: "پێش ٥ خولەک",
    unreadCount: 1,
    isUnread: true,
    messages: [
      {
        id: "m-1-1",
        senderId: "u-suhaib",
        text: "سڵاو ئەلێکس، چۆنی؟",
        timestamp: "١٠:١٥",
        isOutgoing: false,
      },
      {
        id: "m-1-2",
        senderId: "u-current",
        text: "سڵاو کاک سوهەیب، زۆر سوپاس تۆ چۆنی؟ هیوادارم باش بیت.",
        timestamp: "١٠:١٨",
        isOutgoing: true,
        status: "read",
      },
      {
        id: "m-1-3",
        senderId: "u-suhaib",
        text: "دەستخۆشیت لێدەکەم بۆ پڕۆژەکە، کەی دەتوانین گفتوگۆ بکەین؟",
        timestamp: "١٠:٢٥",
        isOutgoing: false,
      },
    ],
  },
  {
    id: "conv-2",
    contact: {
      id: "u-hogr",
      name: "Hogr Khoshnaw",
      handle: "@hogr_gh",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      online: false,
    },
    lastMessage: "هۆگر دەنگێکی تۆمارکراوی نارد (٠:٤٢)",
    timestamp: "پێش ١ کاتژمێر",
    unreadCount: 1,
    isUnread: true,
    isVoiceMessage: true,
    messages: [
      {
        id: "m-2-1",
        senderId: "u-hogr",
        text: "هۆگر دەنگێکی تۆمارکراوی نارد (٠:٤٢)",
        timestamp: "٠٩:٣٠",
        isOutgoing: false,
      },
    ],
  },
  {
    id: "conv-3",
    contact: {
      id: "u-sarah",
      name: "Sarah Chen",
      handle: "@sarahc",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      online: true,
    },
    lastMessage: "تۆمارەکانی بەشی نوێی پۆلا تەواو بوون، بڕوانە تاقیگەکە!",
    timestamp: "پێش ٣ کاتژمێر",
    unreadCount: 0,
    isUnread: false,
    messages: [
      {
        id: "m-3-1",
        senderId: "u-sarah",
        text: "سڵاو ئەلێکس! وێنە و ڕووکارەکانت بینی؟",
        timestamp: "دوێنێ",
        isOutgoing: false,
      },
      {
        id: "m-3-2",
        senderId: "u-current",
        text: "بەڵێ سارە، جووڵەکان زۆر نەرم و ناوازەن!",
        timestamp: "دوێنێ",
        isOutgoing: true,
        status: "read",
      },
      {
        id: "m-3-3",
        senderId: "u-sarah",
        text: "تۆمارەکانی بەشی نوێی پۆلا تەواو بوون، بڕوانە تاقیگەکە!",
        timestamp: "٠٨:١٠",
        isOutgoing: false,
      },
    ],
  },
  {
    id: "conv-4",
    contact: {
      id: "u-sazan",
      name: "Sazan samir",
      handle: "@sazan_gh",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      online: true,
    },
    lastMessage: "تۆ و سازان ئێستا هاوڕێن لە تۆڕی پۆلا",
    timestamp: "دوێنێ",
    unreadCount: 0,
    isUnread: false,
    messages: [
      {
        id: "m-4-1",
        senderId: "u-sazan",
        text: "تۆ و سازان ئێستا هاوڕێن لە تۆڕی پۆلا 👋",
        timestamp: "دوێنێ",
        isOutgoing: false,
      },
    ],
  },
  {
    id: "conv-5",
    contact: {
      id: "u-marcus",
      name: "Marcus Vance",
      handle: "@marcusv",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
      online: true,
    },
    lastMessage: "فایلە ڕێکخراوەکانی تەلارسازیم ئامادە کردووە بۆ ناردن",
    timestamp: "٢ ڕۆژ لەمەوبەر",
    unreadCount: 0,
    isUnread: false,
    messages: [
      {
        id: "m-5-1",
        senderId: "u-marcus",
        text: "فایلە ڕێکخراوەکانی تەلارسازیم ئامادە کردووە بۆ ناردن",
        timestamp: "شەممە",
        isOutgoing: false,
      },
    ],
  },
  {
    id: "conv-6",
    contact: {
      id: "u-zardasht",
      name: "Zardasht Xoshnaw",
      handle: "@zardasht_x",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
      online: false,
    },
    lastMessage: "تۆ و زەردەشت ئێستا هاوڕێن لە پۆلا",
    timestamp: "٣ ڕۆژ لەمەوبەر",
    unreadCount: 0,
    isUnread: false,
    messages: [
      {
        id: "m-6-1",
        senderId: "u-zardasht",
        text: "سڵاو کاک ئەلێکس!",
        timestamp: "هەینی",
        isOutgoing: false,
      },
    ],
  },
  {
    id: "conv-7",
    contact: {
      id: "u-ahmad",
      name: "Ahmad Rzgar",
      handle: "@ahmad_rz",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
      online: true,
    },
    lastMessage: "سوپاس بۆ ڕوونکردنەوەکەت دەربارەی تایبەتمەندییە نوێیەکان",
    timestamp: "١ هەفتە لەمەوبەر",
    unreadCount: 0,
    isUnread: false,
    messages: [
      {
        id: "m-7-1",
        senderId: "u-ahmad",
        text: "سوپاس بۆ ڕوونکردنەوەکەت دەربارەی تایبەتمەندییە نوێیەکان",
        timestamp: "١ هەفتە لەمەوبەر",
        isOutgoing: false,
      },
    ],
  },
];

