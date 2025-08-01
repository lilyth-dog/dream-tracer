// 알림(공지) 컴포넌트 - 플로팅 알림 벨
'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'

const DEMO_NOTICES = [
  { id: 1, text: '오늘 꿈을 기록해보세요!', time: '방금 전' },
  { id: 2, text: '커뮤니티에 새로운 글이 올라왔어요.', time: '1시간 전' },
  { id: 3, text: 'AI 도움 기능이 업데이트되었습니다.', time: '어제' },
]

export function FloatingNotice() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="fixed bottom-6 left-6 z-50 bg-white border shadow-lg rounded-full p-3 hover:bg-gray-100 hidden md:block"
        onClick={() => setOpen(v => !v)}
        aria-label="알림 열기"
      >
        <Bell className="h-6 w-6 text-indigo-600" />
      </button>
      {open && (
        <div className="fixed bottom-24 left-6 w-72 max-w-full bg-white rounded-xl shadow-2xl p-4 z-50 border hidden md:block">
          <div className="font-bold mb-2">알림</div>
          <ul className="space-y-2">
            {DEMO_NOTICES.map(n => (
              <li key={n.id} className="text-sm flex justify-between items-center">
                <span>{n.text}</span>
                <span className="text-xs text-gray-400">{n.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
