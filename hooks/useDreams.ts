"use client"

// 꿈 데이터 관리 커스텀 훅 (개선된 버전)
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Dream } from "@/lib/types"
import { useAuth } from "./useAuth"

// 데모용 꿈 데이터
const DEMO_DREAMS: Dream[] = [
  {
    id: "1",
    userId: "demo-user-123",
    title: "Flying in the sky",
    content:
      "I was freely flying above the clouds. The wind brushed my face like a bird. Below were the blue sea and small islands, and the sun was warmly shining.",
    date: new Date(2024, 0, 15),
    emotion: "joy",
    tags: ["flight", "freedom", "sky", "sea"],
    vividness: 5,
    isLucid: true,
    sleepQuality: "good",
    dreamType: "lucid",
    images: [],
    createdAt: new Date(2024, 0, 15),
    updatedAt: new Date(2024, 0, 15),
  },
  {
    id: "2",
    userId: "demo-user-123",
    title: "Journey under the sea",
    content:
      "I swam with colorful fish deep under the sea, weaving through coral reefs. It was amazing that I could breathe underwater.",
    date: new Date(2024, 0, 14),
    emotion: "peace",
    tags: ["sea", "fish", "adventure", "coral"],
    vividness: 4,
    isLucid: false,
    sleepQuality: "excellent",
    dreamType: "normal",
    images: [],
    createdAt: new Date(2024, 0, 14),
    updatedAt: new Date(2024, 0, 14),
  },
  {
    id: "3",
    userId: "demo-user-123",
    title: "Childhood home",
    content:
      "I spent time with my family in the house where I lived as a child. My grandmother was there, and everything felt warm and peaceful.",
    date: new Date(2024, 0, 13),
    emotion: "wonder",
    tags: ["memory", "family", "home", "grandma"],
    vividness: 3,
    isLucid: false,
    sleepQuality: "good",
    dreamType: "healing",
    images: [],
    createdAt: new Date(2024, 0, 13),
    updatedAt: new Date(2024, 0, 13),
  },
]

export function useDreams() {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (!user) {
      setDreams([])
      setLoading(false)
      return
    }

    // Firebase가 제대로 설정되었는지 확인
    const isFirebaseConfigured =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key"

    if (!isFirebaseConfigured) {
      // 데모 모드: 샘플 데이터 사용
      setTimeout(() => {
        setDreams(DEMO_DREAMS)
        setLoading(false)
      }, 500)
      return
    }

    // Firebase에서 실제 데이터 가져오기
    try {
      const q = query(collection(db, "dreams"), where("userId", "==", user.uid), orderBy("date", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const dreamData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
          })) as Dream[]

          setDreams(dreamData)
          setLoading(false)
        },
        (error) => {
          console.error("Dreams fetch error:", error)
          // 에러 시 데모 데이터로 fallback
          setDreams(DEMO_DREAMS)
          setLoading(false)
        },
      )

      return unsubscribe
    } catch (error) {
      console.error("Firebase query error:", error)
      // Firebase 쿼리 실패 시 데모 데이터 사용
      setTimeout(() => {
        setDreams(DEMO_DREAMS)
        setLoading(false)
      }, 500)
    }
  }, [user])

  const addDream = async (dreamData: Omit<Dream, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user) return

    const isFirebaseConfigured =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key"

    if (!isFirebaseConfigured) {
      // 데모 모드: 로컬 상태에 추가
      const newDream: Dream = {
        ...dreamData,
        id: Date.now().toString(),
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setDreams((prev) => [newDream, ...prev])
      return
    }

    try {
      await addDoc(collection(db, "dreams"), {
        ...dreamData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Add dream error:", error)
      alert(t('common.saveFailed', '저장에 실패했습니다.'))
    }
  }

  const updateDream = async (id: string, dreamData: Partial<Dream>) => {
    const isFirebaseConfigured =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key"

    if (!isFirebaseConfigured) {
      // 데모 모드: 로컬 상태 업데이트
      setDreams((prev) =>
        prev.map((dream) => (dream.id === id ? { ...dream, ...dreamData, updatedAt: new Date() } : dream)),
      )
      return
    }

    try {
      await updateDoc(doc(db, "dreams", id), {
        ...dreamData,
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error("Update dream error:", error)
      alert(t('common.saveFailed', '저장에 실패했습니다.'))
    }
  }

  const deleteDream = async (id: string) => {
    const isFirebaseConfigured =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key"

    if (!isFirebaseConfigured) {
      // 데모 모드: 로컬 상태에서 제거
      setDreams((prev) => prev.filter((dream) => dream.id !== id))
      return
    }

    try {
      await deleteDoc(doc(db, "dreams", id))
    } catch (error) {
      console.error("Delete dream error:", error)
      alert(t('common.deleteFailed', '삭제에 실패했습니다.'))
    }
  }

  return { dreams, loading, addDream, updateDream, deleteDream }
}
