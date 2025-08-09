"use client"

import { useEffect, useRef, useState } from "react"
import { X, Download } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const HIDE_KEY = "installPromptHideDate"

function isIOS() {
  if (typeof window === "undefined") return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  if (typeof window === "undefined") return false
  // iOS: navigator.standalone, PWA: display-mode
  return (
    // @ts-expect-error - iOS specific
    !!(window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches
  )
}

function isHiddenForToday() {
  if (typeof window === "undefined") return false
  const today = new Date()
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  return window.localStorage.getItem(HIDE_KEY) === ymd
}

function hideForToday() {
  const today = new Date()
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  window.localStorage.setItem(HIDE_KEY, ymd)
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isStandalone()) return // 이미 설치됨
    if (isHiddenForToday()) return // 오늘은 보지 않기

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setIosHint(false)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener)

    // iOS는 beforeinstallprompt 미발생 → 힌트 배너 노출
    const timer = window.setTimeout(() => {
      if (!deferredPromptRef.current && isIOS() && !isStandalone() && !isHiddenForToday()) {
        setIosHint(true)
        setVisible(true)
      }
    }, 1500)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener)
      window.clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  const handleInstall = async () => {
    const evt = deferredPromptRef.current
    if (!evt) {
      // iOS 안내만 표시 중
      return
    }
    await evt.prompt()
    const choice = await evt.userChoice
    if (choice.outcome === "accepted") {
      setVisible(false)
    } else {
      // 사용자가 닫음 → 오늘은 그대로 다시 보일 수 있음
      setVisible(false)
    }
  }

  const handleClose = () => setVisible(false)
  const handleHideToday = () => {
    hideForToday()
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-[calc(12px+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-white/95 backdrop-blur shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-full bg-indigo-600/10 p-2 text-indigo-600">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">앱 설치</div>
            {iosHint ? (
              <p className="text-sm text-gray-600 mt-1">iOS에서는 공유 버튼(사파리 하단) → "홈 화면에 추가"를 눌러 설치할 수 있어요.</p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">홈 화면에 추가하여 더 빠르게 접근하세요. 오프라인에서도 일부 기능을 사용할 수 있어요.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {!iosHint && (
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  설치하기
                </button>
              )}
              <button
                onClick={handleHideToday}
                className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                오늘 그만 보기
              </button>
              <button
                onClick={handleClose}
                className="ml-auto inline-flex items-center justify-center rounded-md px-2 py-2 text-sm text-gray-500 hover:text-gray-700"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

