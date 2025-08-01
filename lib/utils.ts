import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import type { User, CommunityPost, CommunityComment, Badge } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 유저 정보 저장 (bio 포함)
export async function saveUserProfile(user: User) {
  await setDoc(doc(db, "users", user.uid), {
    ...user,
    updatedAt: Timestamp.now(),
  }, { merge: true })
}

// 유저 정보 불러오기 (bio 포함)
export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid))
  return snap.exists() ? (snap.data() as User) : null
}

// 커뮤니티 글 저장
export async function addCommunityPost(post: Omit<CommunityPost, "id">) {
  const ref = await addDoc(collection(db, "community"), {
    ...post,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

// 커뮤니티 글 목록 불러오기
export async function getCommunityPosts(): Promise<CommunityPost[]> {
  const snap = await getDocs(collection(db, "community"))
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as CommunityPost) }))
}

// 배지 목록 불러오기
export async function getBadges(): Promise<Badge[]> {
  const snap = await getDocs(collection(db, "badges"))
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Badge) }))
}

// 배지 초기 데이터 설정
export async function initializeBadges() {
  const initialBadges = [
    {
      id: "first-dream",
      name: "첫 꿈 기록",
      description: "첫 번째 꿈을 기록했습니다",
      iconUrl: "🌟",
      condition: "dreamCount >= 1"
    },
    {
      id: "week-streak",
      name: "일주일 연속",
      description: "7일 연속으로 꿈을 기록했습니다",
      iconUrl: "🔥",
      condition: "streak >= 7"
    },
    {
      id: "lucid-dreamer",
      name: "루시드 드리머",
      description: "첫 번째 루시드 드림을 경험했습니다",
      iconUrl: "✨",
      condition: "lucidDreams >= 1"
    },
    {
      id: "dream-explorer",
      name: "꿈 탐험가",
      description: "10개의 꿈을 기록했습니다",
      iconUrl: "🗺️",
      condition: "dreamCount >= 10"
    },
    {
      id: "dream-master",
      name: "꿈 마스터",
      description: "50개의 꿈을 기록했습니다",
      iconUrl: "👑",
      condition: "dreamCount >= 50"
    },
    {
      id: "month-streak",
      name: "한 달 연속",
      description: "30일 연속으로 꿈을 기록했습니다",
      iconUrl: "🏆",
      condition: "streak >= 30"
    }
  ]

  for (const badge of initialBadges) {
    await setDoc(doc(db, "badges", badge.id), badge)
  }
}

// 사용자 통계 업데이트
export async function updateUserStats(userId: string, stats: {
  dreamCount?: number
  lucidDreams?: number
  streak?: number
}) {
  const userRef = doc(db, "users", userId)
  await updateDoc(userRef, {
    stats: stats,
    updatedAt: Timestamp.now()
  })
}

// 사용자 배지 획득 체크
export async function checkAndAwardBadges(userId: string) {
  const userSnap = await getDoc(doc(db, "users", userId))
  if (!userSnap.exists()) return

  const userData = userSnap.data()
  const userStats = userData.stats || { dreamCount: 0, lucidDreams: 0, streak: 0 }
  const userBadges = userData.badges || []

  const badgesSnap = await getDocs(collection(db, "badges"))
  const allBadges = badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  const newBadges = []
  for (const badge of allBadges) {
    if (userBadges.includes(badge.id)) continue

    // 배지 조건 체크
    let earned = false
    if (badge.condition.includes("dreamCount")) {
      const required = parseInt(badge.condition.match(/\d+/)?.[0] || "0")
      earned = userStats.dreamCount >= required
    } else if (badge.condition.includes("lucidDreams")) {
      const required = parseInt(badge.condition.match(/\d+/)?.[0] || "0")
      earned = userStats.lucidDreams >= required
    } else if (badge.condition.includes("streak")) {
      const required = parseInt(badge.condition.match(/\d+/)?.[0] || "0")
      earned = userStats.streak >= required
    }

    if (earned) {
      newBadges.push(badge.id)
    }
  }

  if (newBadges.length > 0) {
    await updateDoc(doc(db, "users", userId), {
      badges: [...userBadges, ...newBadges],
      updatedAt: Timestamp.now()
    })
  }

  return newBadges
}

// 사용자 배지 목록 가져오기
export async function getUserBadges(userId: string) {
  const userSnap = await getDoc(doc(db, "users", userId))
  if (!userSnap.exists()) return []

  const userData = userSnap.data()
  const userBadgeIds = userData.badges || []
  
  if (userBadgeIds.length === 0) return []

  const badgesSnap = await getDocs(collection(db, "badges"))
  const allBadges = badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  
  return allBadges.filter(badge => userBadgeIds.includes(badge.id))
}
