"use client"

// 꿈 데이터 관리 커스텀 훅 (개선된 버전)
import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Dream } from "@/lib/types"
import { useAuth } from "./useAuth"

// 데모용 꿈 데이터
const DEMO_DREAMS: Dream[] = [
  {
    id: "1",
    userId: "demo-user-123",
    title: "하늘을 나는 꿈",
    content:
      "구름 위를 자유롭게 날아다니는 꿈을 꾸었다. 바람이 얼굴을 스치며 새처럼 자유로웠다. 아래로는 푸른 바다와 작은 섬들이 보였고, 햇살이 따뜻하게 내리쬐었다.",
    date: new Date(2024, 0, 15),
    emotion: "joy",
    tags: ["비행", "자유", "하늘", "바다"],
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
    title: "바다 속 여행",
    content:
      "깊은 바다 속에서 형형색색의 물고기들과 함께 수영하며 산호초 사이를 헤엄쳤다. 물속에서도 숨을 쉴 수 있어서 신기했다.",
    date: new Date(2024, 0, 14),
    emotion: "peace",
    tags: ["바다", "물고기", "모험", "산호초"],
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
    title: "어린 시절 집",
    content:
      "어릴 적 살던 집에서 가족들과 함께 시간을 보내는 꿈이었다. 할머니도 계셨고, 모든 것이 따뜻하고 평화로웠다.",
    date: new Date(2024, 0, 13),
    emotion: "wonder",
    tags: ["추억", "가족", "집", "할머니"],
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
      alert("꿈 저장에 실패했습니다.")
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
      alert("꿈 수정에 실패했습니다.")
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
      alert("꿈 삭제에 실패했습니다.")
    }
  }

  return { dreams, loading, addDream, updateDream, deleteDream }
}
