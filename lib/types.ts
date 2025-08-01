// 타입 정의
export interface Dream {
  id: string
  userId: string
  title: string
  content: string
  date: Date
  emotion: string
  tags: string[]
  vividness: number
  isLucid: boolean
  sleepQuality: string
  dreamType: string
  images: string[]
  createdAt: Date
  updatedAt: Date
}

// User 타입
export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  badges?: string[]; // 배지 ID 배열
  createdAt?: any;
  updatedAt?: any;
}

// Community Post 타입
export interface CommunityPost {
  id: string;
  authorId: string; // 익명 처리용
  nickname: string; // 익명, 익명2 등
  content: string;
  createdAt: any;
  updatedAt?: any;
}

// Community Comment 타입
export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  nickname: string;
  content: string;
  createdAt: any;
}

// Badge 타입
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
}

export interface DreamStats {
  totalDreams: number
  thisMonth: number
  streak: number
  favoriteEmotion: string
  averageVividness: number
  lucidDreamCount: number
  mostUsedTags: string[]
}
