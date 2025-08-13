// 알림(공지) 컴포넌트 - 플로팅 알림 벨
'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const DEMO_NOTICES = [
  { id: 1, textKey: 'notice.items.remindRecord', timeKey: 'notice.time.justNow' },
  { id: 2, textKey: 'notice.items.newCommunity', timeKey: 'notice.time.oneHourAgo' },
  { id: 3, textKey: 'notice.items.aiUpdated', timeKey: 'notice.time.yesterday' },
]

export function FloatingNotice() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  return (
    <>
      <button
        className="fixed bottom-6 left-6 z-50 bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg rounded-full p-3 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:block text-gray-800 dark:text-gray-100"
        onClick={() => setOpen(v => !v)}
        aria-label={t('notice.open', '알림 열기')}
      >
        <Bell className="h-6 w-6 text-indigo-600" />
      </button>
      {open && (
        <div className="fixed bottom-24 left-6 w-72 max-w-full bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-4 z-50 border border-gray-200 dark:border-gray-700 hidden md:block text-gray-800 dark:text-gray-100">
          <div className="font-bold mb-2">{t('notice.title', '알림')}</div>
          <ul className="space-y-2">
            {DEMO_NOTICES.map(n => (
              <li key={n.id} className="text-sm flex justify-between items-center">
                <span>{t(n.textKey, '')}</span>
                <span className="text-xs text-gray-400 dark:text-gray-400/80">{t(n.timeKey, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
