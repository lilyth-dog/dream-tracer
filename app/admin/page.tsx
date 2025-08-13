"use client"

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'

export default function AdminHome() {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="p-4">
          <Link className="text-indigo-600 font-medium" href="/community/moderation">{t('admin.home.moderation', '신고/숨김 관리')}</Link>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <Link className="text-indigo-600 font-medium" href="/admin/users">{t('admin.home.users', '사용자 관리')}</Link>
        </CardContent>
      </Card>
    </div>
  )
}


