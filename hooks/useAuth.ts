"use client"

// 인증 관련 커스텀 훅 (개선된 버전)
import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, setPersistence, browserSessionPersistence } from "firebase/auth"

// 데모용 사용자 데이터
const DEMO_USER = {
  uid: "demo-user-123",
  email: "demo@example.com",
  displayName: "데모 사용자",
  photoURL: null,
  emailVerified: true,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [{ providerId: "password" }],
} as User

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Firebase가 제대로 설정되었는지 확인
    const isFirebaseConfigured =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "" &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_firebase_api_key"

    if (!isFirebaseConfigured) {
      // 데모 모드: Firebase 없이 작동
      console.log("데모 모드로 실행 중...")
      setTimeout(() => {
        setUser(DEMO_USER)
        setLoading(false)
      }, 1000)
      return
    }

    // Firebase 인증 상태 감시
    let unsubscribe: (() => void) | undefined

    const initAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          await setPersistence(auth, browserSessionPersistence)
        }

        unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            setUser(user)
            setLoading(false)
            setError(null)
          },
          (error) => {
            console.error("Auth state change error:", error)
            setError(error.message)
            setLoading(false)

            // 에러 발생 시 데모 사용자로 fallback
            setUser(DEMO_USER)
          },
        )
      } catch (error) {
        console.error("Firebase auth initialization error:", error)
        setError("Firebase 초기화 실패")

        // Firebase 초기화 실패 시 데모 모드로 전환
        setTimeout(() => {
          setUser(DEMO_USER)
          setLoading(false)
        }, 1000)
      }
    }

    initAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return { user, loading, error }
}
