"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

export default function AdminLoginPage() {
  const [token, setToken] = useState('')
  const router = useRouter()
  const { t } = useTranslation()
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    document.cookie = `admin_key=${encodeURIComponent(token)}; path=/; max-age=86400; secure`;
    router.push('/admin')
  }
  return (
    <div className="pt-24">
      <Card className="max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>{t('admin.login.title', '관리자 로그인')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input placeholder={t('admin.login.tokenPlaceholder', '관리자 토큰')} value={token} onChange={e => setToken(e.target.value)} />
            <Button type="submit" className="w-full">{t('admin.login.submit', '로그인')}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


