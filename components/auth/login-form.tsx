// 로그인 폼 컴포넌트 (개선된 버전)
"use client"

import type React from "react"

import { useState } from "react"
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Moon, Mail, Lock, Chrome, AlertCircle } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)

  // Firebase 설정 확인
  const isFirebaseConfigured =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "" &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_firebase_api_key"

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFirebaseConfigured) {
      alert("데모 모드에서는 자동으로 로그인됩니다.")
      return
    }

    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error("Login error:", error)
      let errorMessage = "로그인에 실패했습니다."

      if (error.code === "auth/user-not-found") {
        errorMessage = "등록되지 않은 이메일입니다."
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "비밀번호가 올바르지 않습니다."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "올바르지 않은 이메일 형식입니다."
      }

      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      alert("데모 모드에서는 자동으로 로그인됩니다.")
      return
    }

    setLoading(true)

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error: any) {
      console.error("Google login error:", error)
      let errorMessage = "구글 로그인에 실패했습니다."

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "로그인이 취소되었습니다."
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "팝업이 차단되었습니다. 팝업을 허용해주세요."
      }

      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFirebaseConfigured) {
      alert("데모 모드에서는 회원가입이 지원되지 않습니다.")
      return
    }
    setRegisterLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, registerEmail, registerPassword)
      alert("회원가입이 완료되었습니다. 로그인 해주세요.")
      setShowRegister(false)
    } catch (error: any) {
      alert("회원가입에 실패했습니다: " + error.message)
    } finally {
      setRegisterLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFirebaseConfigured) {
      alert("데모 모드에서는 비밀번호 찾기가 지원되지 않습니다.")
      return
    }
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      alert("비밀번호 재설정 이메일이 발송되었습니다.")
    } catch (error: any) {
      alert("비밀번호 찾기에 실패했습니다: " + error.message)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Moon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              루비드 드림 다이어리
            </h1>
          </div>
          <CardTitle>로그인</CardTitle>
          <CardDescription>꿈의 세계로 들어가세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isFirebaseConfigured && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">데모 모드</p>
                <p>Firebase 환경변수가 설정되지 않아 데모 모드로 실행됩니다.</p>
              </div>
            </div>
          )}

          {showRegister ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registerEmail">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pl-10"
                    required={!!isFirebaseConfigured}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerPassword">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="registerPassword"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="pl-10"
                    required={!!isFirebaseConfigured}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={registerLoading}>
                {registerLoading ? "회원가입 중..." : isFirebaseConfigured ? "회원가입" : "데모 모드 안내"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowRegister(false)}>
                로그인으로 돌아가기
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required={!!isFirebaseConfigured}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required={!!isFirebaseConfigured}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "로그인 중..." : isFirebaseConfigured ? "로그인" : "데모 모드로 시작"}
                </Button>
              </form>

              <div className="flex justify-between mt-2">
                <Button type="button" variant="link" className="p-0 text-xs" onClick={() => setShowRegister(true)}>
                  회원가입
                </Button>
                <Button type="button" variant="link" className="p-0 text-xs" onClick={() => setShowReset(true)}>
                  비밀번호 찾기
                </Button>
              </div>
              {showReset && (
                <form onSubmit={handlePasswordReset} className="space-y-2 mt-2">
                  <Label htmlFor="resetEmail">이메일</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    required={!!isFirebaseConfigured}
                  />
                  <Button type="submit" className="w-full" disabled={resetLoading}>
                    {resetLoading ? "이메일 발송 중..." : isFirebaseConfigured ? "비밀번호 재설정 메일 발송" : "데모 모드 안내"}
                  </Button>
                </form>
              )}

              {isFirebaseConfigured && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">또는</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    구글로 로그인
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
