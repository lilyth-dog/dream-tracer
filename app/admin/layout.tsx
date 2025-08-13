"use client"

import { useTranslation } from 'react-i18next'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-24 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">{t('admin.layout.title', '관리자 대시보드')}</h1>
        {children}
      </div>
    </div>
  )
}


