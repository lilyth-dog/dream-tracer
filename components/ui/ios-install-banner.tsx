"use client"

import { useEffect, useState } from "react"

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone
    const dismissed = typeof window !== 'undefined' ? localStorage.getItem('iosPwaDismissed') === '1' : true
    if (isIOS && !isStandalone && !dismissed) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-16 left-3 right-3 z-40 rounded-lg bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 shadow-lg p-3 text-sm flex items-start gap-2">
      <div className="flex-1 text-gray-800 dark:text-gray-100">
        iOS에서는 브라우저 메뉴의 공유 버튼(⬆️)을 눌러 "홈 화면에 추가"를 선택하면 설치할 수 있어요.
      </div>
      <button
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={() => { setVisible(false); try { localStorage.setItem('iosPwaDismissed', '1') } catch {} }}
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  )
}


