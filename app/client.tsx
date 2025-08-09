"use client"
import "../i18n"
// 루트 레이아웃 업데이트 (에러 처리 개선)
import type { PropsWithChildren } from "react"

import { Inter } from "next/font/google"
import { usePathname } from "next/navigation"
import "./globals.css"
import { Navigation } from "@/components/layout/navigation"
import TopNavigation from "@/components/layout/top-navigation"
import { useAuth } from "@/hooks/useAuth"
import { LoginForm } from "@/components/auth/login-form"
import { Moon, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"
import { MessageCircle } from "lucide-react"
import { FloatingNotice } from "@/components/ui/floating-notice"
import { ThemeProvider } from "@/components/theme-provider"
import { InstallPrompt } from "@/components/pwa/install-prompt"

const inter = Inter({ subsets: ["latin"] })

function AIHelpButton() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { role: "ai", text: "안녕하세요! 꿈 기록, 해석, 시각화 등 궁금한 점을 물어보세요." }
  ])
  // 최초 위치: 화면 중앙(가로 50vw, 세로 70vh)
  const getInitialPosition = () => {
    if (typeof window !== "undefined") {
      const saved = window.sessionStorage.getItem("aiHelpBtnPos")
      if (saved) return JSON.parse(saved)
      return {
        x: window.innerWidth / 2 - 32, // 버튼 크기 고려
        y: window.innerHeight * 0.7
      }
    }
    return { x: 100, y: 300 }
  }
  const [position, setPosition] = useState(() => getInitialPosition())
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return
      let clientX, clientY
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }
      const dx = clientX - dragStart.current.mouseX
      const dy = clientY - dragStart.current.mouseY
      // 화면 경계 제한
      const newX = Math.max(0, Math.min(window.innerWidth - 64, dragStart.current.x + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 64, dragStart.current.y + dy))
      setPosition({ x: newX, y: newY })
    }
    const handleUp = () => {
      setDragging(false)
      window.sessionStorage.setItem("aiHelpBtnPos", JSON.stringify(position))
    }
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    window.addEventListener("touchmove", handleMove)
    window.addEventListener("touchend", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
      window.removeEventListener("touchmove", handleMove)
      window.removeEventListener("touchend", handleUp)
    }
  }, [dragging, position])

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true)
    if (e.type === "touchstart") {
      const touch = (e as React.TouchEvent).touches[0]
      dragStart.current = { x: position.x, y: position.y, mouseX: touch.clientX, mouseY: touch.clientY }
    } else {
      const mouse = e as React.MouseEvent
      dragStart.current = { x: position.x, y: position.y, mouseX: mouse.clientX, mouseY: mouse.clientY }
    }
    // 브라우저 기본 드래그 방지
    if (e && typeof (e as any).preventDefault === 'function') {
      (e as any).preventDefault()
    }
  }
  // 클릭과 드래그 구분: 드래그 중에는 onClick 동작 X
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragging) return
    setOpen((v) => !v)
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    setMessages([...messages, { role: "user", text: input }])
    const userMsg = input
    setInput("")
    try {
      const res = await fetch("/api/ai-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "ai", text: data.answer }])
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "AI 답변 생성에 실패했습니다." }])
    }
  }

  // 대화창 방향 계산
  const getDialogPosition = () => {
    if (typeof window === "undefined") return { top: position.y + 80, left: position.x, direction: "down-right" }
    const margin = 16
    const dialogWidth = 320
    const dialogHeight = 280
    const isBottom = position.y > window.innerHeight / 2
    const isRight = position.x > window.innerWidth / 2
    let top, left
    if (isBottom) {
      top = position.y - dialogHeight - margin
    } else {
      top = position.y + 64 + margin
    }
    if (isRight) {
      left = position.x - dialogWidth + 64
    } else {
      left = position.x
    }
    // 화면 밖으로 나가지 않게 보정
    top = Math.max(margin, Math.min(top, window.innerHeight - dialogHeight - margin))
    left = Math.max(margin, Math.min(left, window.innerWidth - dialogWidth - margin))
    return { top, left, direction: `${isBottom ? "up" : "down"}-${isRight ? "left" : "right"}` }
  }

  return (
    <>
      <button
        ref={btnRef}
        className={
          `fixed z-50 bg-indigo-600 text-white rounded-full shadow-lg p-4 hover:bg-indigo-700 transition`
        }
        style={{ left: position.x, top: position.y }}
        aria-label="AI 도움말 열기"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onDragStart={e => e.preventDefault()}
        onClick={handleClick}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      {open && (() => {
        const dialogPos = getDialogPosition()
        return (
          <div
            className="fixed z-50 bg-white rounded-xl shadow-2xl p-4 border"
            style={{ left: dialogPos.left, top: dialogPos.top, width: 320, maxWidth: '100%' }}
          >
            <div className="font-bold mb-2">AI 도우미</div>
            <div className="h-40 overflow-y-auto text-sm mb-2 flex flex-col gap-2">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "ai" ? "text-indigo-700" : "text-gray-800 text-right"}>{msg.text}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded px-2 py-1 text-sm"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendMessage() }}
                placeholder="AI에게 물어보세요..."
              />
              <button className="bg-indigo-500 text-white px-3 py-1 rounded" onClick={sendMessage}>전송</button>
            </div>
          </div>
        )
      })()}
    </>
  )
}

function AuthWrapper({ children }: Readonly<PropsWithChildren<unknown>>) {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Moon className="h-12 w-12 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">연결 오류</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">데모 모드로 전환됩니다...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}

export default function RootLayout({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
  const pathname = usePathname()
  const showMobileNav = pathname !== "/write"
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthWrapper>
            <div className="flex flex-col min-h-screen">
              <TopNavigation />
              <div className="flex flex-1 overflow-hidden">
                <Navigation className="w-64 border-r hidden md:block bg-white/80 backdrop-blur-sm dark:bg-gray-800/80" />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                  <div className="max-w-7xl mx-auto w-full">
                    {children}
                  </div>
                </main>
              </div>
              {/* 모바일 하단 내비게이션: /write 페이지에서는 숨김 */}
              {showMobileNav && (
                <div className="md:hidden">
                  <Navigation />
                </div>
              )}
            </div>
            <AIHelpButton />
            <FloatingNotice />
          </AuthWrapper>
        </ThemeProvider>
        {/* PWA 설치 배너 */}
        <InstallPrompt />
      </body>
    </html>
  )
}
