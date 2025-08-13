"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

export default function ModerationPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchReported = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/community?reportsOnly=1', {
          headers: { 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_DASH_TOKEN || '' }
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.error || t('admin.common.fetchFailed', '불러오기 실패'))
        setPosts(data.posts || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchReported()
  }, [])

  const hideToggle = async (postId: string, hide: boolean) => {
    const res = await fetch('/api/community', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_DASH_TOKEN || '' },
      body: JSON.stringify({ action: hide ? 'hide-post' : 'unhide-post', postId, actorUserId: 'admin' })
    })
    const data = await res.json()
    if (data.ok) setPosts(posts.map(p => p.id === postId ? { ...p, hidden: data.hidden } : p))
  }

  if (loading) return <div className="pt-24 container">{t('admin.common.loading', '불러오는 중...')}</div>
  if (error) return <div className="pt-24 container text-red-600">{t('admin.common.error', '오류')}: {error}</div>

  return (
    <div className="pt-24 container max-w-3xl">
      <Card>
          <CardHeader>
          <CardTitle>{t('admin.moderation.title', '신고/숨김 관리')}</CardTitle>
          <CardDescription>{t('admin.moderation.desc', '신고된 게시글 목록입니다')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-sm text-gray-500">{t('admin.moderation.empty', '신고된 게시글이 없습니다')}</div>
          ) : posts.map((p) => (
            <div key={p.id} className="p-3 border rounded">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium truncate mr-2">{p.nickname || t('community.anon', '익명')}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t('admin.moderation.reports', '신고')} {p.reports || 0}</Badge>
                  {p.hidden && <Badge variant="destructive">{t('admin.moderation.hidden', '숨김')}</Badge>}
                </div>
              </div>
              <div className="text-sm mt-2 whitespace-pre-wrap">{p.content}</div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => hideToggle(p.id, !p.hidden)}>
                  {p.hidden ? t('admin.moderation.unhide', '숨김 해제') : t('admin.moderation.hide', '숨김 처리')}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


