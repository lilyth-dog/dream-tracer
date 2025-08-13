"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        // 커뮤니티 글에서 작성자 집합을 추려 표시(데모용)
        const res = await fetch('/api/community?limit=100', { headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_DASH_TOKEN || '' } })
        const data = await res.json()
        const map: Record<string, any> = {}
        ;(data.posts || []).forEach((p: any) => {
          if (!p.authorId) return
          if (!map[p.authorId]) map[p.authorId] = { uid: p.authorId, nickname: p.nickname }
        })
        setUsers(Object.values(map))
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const doAction = async (uid: string, action: 'mute'|'unmute'|'block'|'unblock') => {
    await fetch('/api/community', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, targetUserId: uid, actorUserId: 'admin' })
    })
    alert(t('admin.common.done', '처리되었습니다'))
  }

  if (loading) return <div className="pt-24 container">{t('admin.common.loading', '불러오는 중...')}</div>
  if (error) return <div className="pt-24 container text-red-600">{t('admin.common.error', '오류')}: {error}</div>

  return (
    <div className="pt-24 container max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.users.title', '사용자 관리')}</CardTitle>
          <CardDescription>{t('admin.users.desc', '차단/뮤트 관리')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 ? (
            <div className="text-sm text-gray-500">{t('admin.users.noData', '사용자 정보가 부족합니다')}</div>
          ) : users.map(u => (
            <div key={u.uid} className="p-3 border rounded">
              <div className="text-sm font-medium">{u.nickname || t('community.anon', '익명')} <span className="text-gray-400">({u.uid})</span></div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => doAction(u.uid, 'mute')}>{t('admin.users.mute', '뮤트')}</Button>
                <Button size="sm" variant="outline" onClick={() => doAction(u.uid, 'unmute')}>{t('admin.users.unmute', '뮤트 해제')}</Button>
                <Button size="sm" variant="outline" onClick={() => doAction(u.uid, 'block')}>{t('admin.users.block', '차단')}</Button>
                <Button size="sm" variant="outline" onClick={() => doAction(u.uid, 'unblock')}>{t('admin.users.unblock', '차단 해제')}</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


