// 커뮤니티 페이지
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Heart, MessageCircle, LayoutDashboard, BookOpen, BarChart2, Palette, Brain, PenLine, Bookmark, Trash2, Flag, MoreVertical } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from 'next/navigation'

// 샘플 커뮤니티 데이터
const communityPosts = [
	{
		id: "1",
		author: {
			name: "꿈꾸는자",
			avatar: "/placeholder.svg?height=40&width=40",
			level: "드림 마스터",
		},
		title: "오늘 정말 신기한 루시드 드림을 경험했어요!",
		content:
			"꿈 속에서 제가 꿈을 꾸고 있다는 걸 깨달았는데, 그 순간부터 자유자재로 날아다닐 수 있었어요. 처음 경험하는 루시드 드림이라 너무 신기했습니다.",
		tags: ["루시드드림", "비행", "첫경험"],
		likes: 24,
		comments: [], // 샘플: 빈 배열로 변경
		shares: 3,
		timeAgo: "2시간 전",
		category: "경험공유",
		createdAt: new Date().toISOString(),
	},
	{
		id: "2",
		author: {
			name: "달빛여행자",
			avatar: "/placeholder.svg?height=40&width=40",
			level: "드림 익스플로러",
		},
		title: "반복되는 꿈의 의미가 궁금해요",
		content: "계속해서 같은 장소, 같은 상황의 꿈을 꾸고 있어요. 어떤 의미일까요? 비슷한 경험 있으신 분 계신가요?",
		tags: ["반복꿈", "해석", "질문"],
		likes: 15,
		comments: [],
		shares: 2,
		timeAgo: "4시간 전",
		category: "질문",
		createdAt: new Date().toISOString(),
	},
	{
		id: "3",
		author: {
			name: "꿈해석가",
			avatar: "/placeholder.svg?height=40&width=40",
			level: "드림 아날리스트",
		},
		title: "꿈 일기 작성 팁 공유합니다",
		content:
			"3년간 꿈 일기를 써온 경험을 바탕으로 효과적인 꿈 기록 방법을 공유해드려요. 꿈을 더 생생하게 기억하는 방법도 함께!",
		tags: ["팁", "꿈일기", "기록법"],
		likes: 45,
		comments: [],
		shares: 12,
		timeAgo: "1일 전",
		category: "팁",
		createdAt: new Date().toISOString(),
	},
]

// Post, Comment 타입 예시(실제 구조에 맞게 수정)
type Post = {
  id: string;
  author: {
	name: string;
	avatar: string;
	level: string;
  };
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  shares: number;
  timeAgo: string;
  category: string;
  createdAt: string; // ISO date string
  likedUserIds?: string[]; // 좋아요한 사용자 ID 배열
  authorId?: string; // 작성자 ID
  nickname?: string; // 작성자 닉네임
  // 추천은 하트로 통합됨
  isPublicProfile?: boolean; // 공개 프로필 여부
  reports?: number;
  reportedUserIds?: string[];
  hidden?: boolean;
};

type Comment = {
  id: string;
  author: string;
  text: string;
  anonId?: string; // 브라우저별 임시 ID
  userId?: string; // 사용자 ID
  nickname?: string; // 댓글 작성자 닉네임
  isPublicProfile?: boolean; // 공개 프로필 여부
};

// 1. 브라우저별 임시 ID 생성/저장
function getAnonId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem("dreamai_anon_id");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem("dreamai_anon_id", id);
  }
  return id;
}

export default function CommunityPage() {
    const { t } = useTranslation()
    const { user } = useAuth();
    const router = useRouter()
    const [posts, setPosts] = useState<Post[]>([])
    const [newContent, setNewContent] = useState("")
    const [isPublicProfile, setIsPublicProfile] = useState(false)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [sortMode, setSortMode] = useState<'recent' | 'popular'>("recent")
    const [nextCursorMs, setNextCursorMs] = useState<number | null>(null)
    const [nextOffset, setNextOffset] = useState<number>(0)
    const [loadingMore, setLoadingMore] = useState(false)
    const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set())
    // 추천은 하트로 통합됨
    const [pendingReportIds, setPendingReportIds] = useState<Set<string>>(new Set())
    const [mutedUserIds, setMutedUserIds] = useState<Set<string>>(new Set())
    const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set())

    const normalizePosts = useCallback((arr: any[]) => {
        return (arr || []).map((post: any) => {
            let createdAt = post.createdAt
            if (typeof createdAt === 'number') createdAt = new Date(createdAt).toISOString()
            if (createdAt?.toMillis) createdAt = new Date(createdAt.toMillis()).toISOString()
            return { ...post, createdAt: createdAt || new Date().toISOString() }
        })
    }, [])

    const fetchPosts = useCallback(async (opts?: { reset?: boolean; mode?: 'recent' | 'popular' }) => {
        const mode = opts?.mode || sortMode
        try {
            if (opts?.reset) {
                setPosts([])
                setNextCursorMs(null)
                setNextOffset(0)
            }
            const params = new URLSearchParams()
            params.set('limit', '20')
            if (mode === 'popular') {
                params.set('sort', 'popular')
                params.set('windowHours', '72')
                params.set('offset', String(opts?.reset ? 0 : nextOffset))
            } else if (nextCursorMs && !opts?.reset) {
                params.set('cursorMs', String(nextCursorMs))
            }
            const res = await fetch(`/api/community?${params.toString()}`)
            const data = await res.json()
            if (mode === 'popular') {
                const list = normalizePosts(data.posts || []).filter((p:any)=> !blockedUserIds.has(p.authorId) && !mutedUserIds.has(p.authorId))
                setPosts((prev) => (opts?.reset ? list : [...prev, ...list]))
                setNextOffset(data.nextOffset ?? (opts?.reset ? list.length : nextOffset + list.length))
            } else {
                const list = normalizePosts(data.posts || []).filter((p:any)=> !blockedUserIds.has(p.authorId) && !mutedUserIds.has(p.authorId))
                setPosts((prev) => (opts?.reset ? list : [...prev, ...list]))
                setNextCursorMs(data.nextCursorMs || null)
            }
        } finally {
            setInitialLoading(false)
        }
    }, [nextCursorMs, nextOffset, normalizePosts, sortMode])

    useEffect(() => {
        fetchPosts({ reset: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 로컬 저장된 뮤트/차단 목록 로드
    useEffect(() => {
        if (!user) return
        try {
          const m = localStorage.getItem(`muted_${user.uid}`)
          const b = localStorage.getItem(`blocked_${user.uid}`)
          if (m) setMutedUserIds(new Set(JSON.parse(m)))
          if (b) setBlockedUserIds(new Set(JSON.parse(b)))
        } catch {}
    }, [user])

    const onChangeSort = async (mode: 'recent' | 'popular') => {
        setSortMode(mode)
        setInitialLoading(true)
        await fetchPosts({ reset: true, mode })
    }

    const loadMore = async () => {
        if (loadingMore) return
        setLoadingMore(true)
        await fetchPosts()
        setLoadingMore(false)
    }

    const persistRelations = () => {
        if (!user) return
        try {
            localStorage.setItem(`muted_${user.uid}`, JSON.stringify(Array.from(mutedUserIds)))
            localStorage.setItem(`blocked_${user.uid}`, JSON.stringify(Array.from(blockedUserIds)))
        } catch {}
    }

    const toggleMute = async (targetUserId?: string) => {
        if (!user || !targetUserId) return
        const isMuted = mutedUserIds.has(targetUserId)
        await fetch('/api/community', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: isMuted ? 'unmute' : 'mute', targetUserId, actorUserId: user.uid }) })
        const next = new Set(mutedUserIds)
        if (isMuted) next.delete(targetUserId); else next.add(targetUserId)
        setMutedUserIds(next)
        persistRelations()
        setPosts(prev => prev.filter(p => p.authorId !== targetUserId))
    }

    const toggleBlock = async (targetUserId?: string) => {
        if (!user || !targetUserId) return
        const isBlocked = blockedUserIds.has(targetUserId)
        await fetch('/api/community', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: isBlocked ? 'unblock' : 'block', targetUserId, actorUserId: user.uid }) })
        const next = new Set(blockedUserIds)
        if (isBlocked) next.delete(targetUserId); else next.add(targetUserId)
        setBlockedUserIds(next)
        persistRelations()
        setPosts(prev => prev.filter(p => p.authorId !== targetUserId))
    }

    // IntersectionObserver로 자동 더보기
    useEffect(() => {
        const btn = document.getElementById('load-more-btn')
        if (!btn) return
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting && !loadingMore && !initialLoading) {
                    loadMore()
                }
            })
        }, { rootMargin: '200px' })
        io.observe(btn)
        return () => io.disconnect()
    }, [loadMore, loadingMore, initialLoading])
	const handlePost = async () => {
		if (!newContent.trim()) return
		setLoading(true)
		const authorId = user?.uid || ''
		const nickname = t('community.anon', '익명') // 로케일 닉네임
		const res = await fetch("/api/community", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: newContent, authorId, nickname, isPublicProfile })
		})
		const data = await res.json()
		const postWithCreatedAt = (() => {
			const p = data.post || {}
			let createdAt = p.createdAt
			if (typeof createdAt === 'number') createdAt = new Date(createdAt).toISOString()
			return { ...p, createdAt: createdAt || new Date().toISOString() }
		})()
		setPosts([postWithCreatedAt, ...posts])
		setNewContent("")
		setIsPublicProfile(false)
		setLoading(false)
	}
    const handleLike = async (id: string) => {
        if (!user) return;
        if (pendingLikeIds.has(id)) return;
        setPendingLikeIds(new Set(pendingLikeIds).add(id))
        const post = posts.find(p => p.id === id);
        const liked = post?.likedUserIds?.includes(user.uid);
		const res = await fetch("/api/community", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ postId: id, like: !liked, userId: user.uid })
		});
		const data = await res.json();
		if (data.ok) {
			setPosts(posts.map(p =>
				p.id === id
					? {
						...p,
						likes: data.likes,
						likedUserIds: data.likedUserIds,
					}
					: p
			));
		}
        setPendingLikeIds((prev) => { const n = new Set(prev); n.delete(id); return n })
	};
	const handleComment = async (id: string, comment: string, isPublicProfile: boolean) => {
		if (!comment.trim() || !user) return;
		const res = await fetch("/api/community", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ postId: id, comment, userId: user.uid, isPublicProfile })
		});
		const data = await res.json();
		if (data.ok && data.comment) {
			setPosts(posts.map(p =>
				p.id === id
					? {
						...p,
						comments: [...(p.comments || []), data.comment],
					}
					: p
			));
		}
	};
    // 추천 기능 제거
	const handleDelete = async (id: string) => {
		if (!user) return;
		if (!window.confirm(t('common.confirmDelete', '정말 삭제하시겠습니까?'))) return;
		const res = await fetch("/api/community", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ postId: id, userId: user.uid })
		});
		const data = await res.json();
		if (data.ok) {
			setPosts(posts.filter(p => p.id !== id));
		} else {
			alert(data.error || t('common.deleteFailed', '삭제에 실패했습니다.'));
		}
	};
	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
			<div className="container mx-auto px-2 py-8 max-w-3xl pt-20">
				<main className="w-full">
					<Card className="glass-effect dark:bg-gray-800/70">
                    <CardHeader>
                        <CardTitle>{t('community.shareTitle', '꿈 공유하기')}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
                        <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder={t('community.sharePlaceholder', '꿈을 자유롭게 공유해보세요!')} className="dark:bg-gray-800/70 dark:border-gray-700" />
							<div className="flex items-center gap-2">
								<input type="checkbox" id="publicProfile" checked={isPublicProfile} onChange={e => setIsPublicProfile(e.target.checked)} />
                            <label htmlFor="publicProfile" className="text-xs select-none">{t('community.publicProfile', '공개 프로필로 작성')}</label>
							</div>
                        <Button onClick={handlePost} disabled={loading} className="dark:bg-indigo-600 dark:hover:bg-indigo-500">{loading ? t('common.submitting', '등록 중...') : t('community.shareCta', '공유하기')}</Button>
						</CardContent>
					</Card>
					<div className="flex items-center gap-2 mt-6">
                    <Button variant={sortMode === 'recent' ? 'default' : 'outline'} size="sm" onClick={() => onChangeSort('recent')}>{t('community.sortRecent', '최신')}</Button>
                    <Button variant={sortMode === 'popular' ? 'default' : 'outline'} size="sm" onClick={() => onChangeSort('popular')}>{t('community.sortPopular', '인기')}</Button>
						</div>
					<div className="space-y-4 mt-8">
						{initialLoading ? (
                        <Card className="glass-effect dark:bg-gray-800/70"><CardContent>{t('common.loading', '로딩 중...')}</CardContent></Card>
                        ) : posts.map((post) => (
							<Card key={post.id} className="glass-effect dark:bg-gray-800/70">
								<CardHeader className="flex flex-row items-center gap-2">
									{post.isPublicProfile && user && user.uid === post.authorId ? (
								<Avatar>
									<AvatarImage src={user.photoURL || undefined} />
									<AvatarFallback>{user.displayName?.[0] || t('community.anon', '익명')[0] || 'N'}</AvatarFallback>
								</Avatar>
									) : (
								<Avatar>
									<AvatarFallback>{(post.nickname || t('community.anon', '익명'))[0]}</AvatarFallback>
								</Avatar>
									)}
									<div>
										<CardTitle className="text-base">
											{post.isPublicProfile && user && user.uid === post.authorId
									? user.displayName || t('profile.preview.title', '프로필')
									: post.nickname || t('community.anon', '익명')}
										</CardTitle>
								<CardDescription className="text-xs text-gray-400 dark:text-gray-300">{post.createdAt?.toString().slice(0, 10) || ''}</CardDescription>
									</div>
                                    <div className="ml-auto">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="more">
                                            <MoreVertical className="w-5 h-5" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          {post.authorId && user?.uid !== post.authorId && (
                                            <DropdownMenuItem onClick={() => toggleMute(post.authorId!)}>
                                              {mutedUserIds.has(post.authorId!) ? t('community.unmute','뮤트 해제') : t('community.mute','뮤트')}
                                            </DropdownMenuItem>
                                          )}
                                          {/* 신고 모달 트리거 */}
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <DropdownMenuItem className="text-red-600">
                                                <Flag className="w-4 h-4" /> {t('community.report','신고')}
                                              </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>{t('community.report','신고')}</AlertDialogTitle>
                                                <AlertDialogDescription>{t('community.reportDesc','이 게시글을 신고하시겠습니까? 여러 차례 신고되면 자동으로 숨김 처리됩니다.')}</AlertDialogDescription>
                                                <textarea id={`report-reason-${post.id}`} className="mt-3 w-full border dark:border-gray-700 rounded p-2 text-sm bg-white dark:bg-gray-800" placeholder={t('community.reportReason','신고 사유(선택)') as string}></textarea>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>{t('common.no','아니오')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={async () => {
                                                  if (!user) return
                                                  if (pendingReportIds.has(post.id)) return
                                                  setPendingReportIds(new Set(pendingReportIds).add(post.id))
                                                  const reported = post.reportedUserIds?.includes(user.uid)
                                                  const reasonEl = document.getElementById(`report-reason-${post.id}`) as HTMLTextAreaElement | null
                                                  const reason = reasonEl?.value || ''
                                                  const res = await fetch('/api/community', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: post.id, report: !reported, userId: user.uid, reason }) })
                                                  const data = await res.json()
                                                  if (data.ok) {
                                                    setPosts(posts.map(p => p.id === post.id ? { ...p, reportedUserIds: data.reportedUserIds, reports: data.reports, hidden: data.hidden ?? p.hidden } : p))
                                                  }
                                                  setPendingReportIds(prev => { const n = new Set(prev); n.delete(post.id); return n })
                                                }}>{t('common.yes','예')}</AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                          {user?.uid === post.authorId && (
                                            <>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-red-600">
                                                <Trash2 className="w-4 h-4" /> {t('common.delete','삭제')}
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
								</CardHeader>
                                <CardContent>
							{post.hidden && (
								<div className="mb-2 p-2 text-xs bg-yellow-50 border border-yellow-200 rounded text-yellow-700">{t('community.hiddenNotice', '신고 누적으로 숨김 처리된 게시글입니다.')}</div>
							)}
                                    <div className="whitespace-pre-line">{post.content}</div>
                                    <div className="flex items-center gap-4 mt-2">
										<Button
											variant={post.likedUserIds?.includes(user?.uid) ? "solid" : "ghost"}
											size="sm"
											onClick={() => handleLike(post.id)}
											disabled={pendingLikeIds.has(post.id)}
											className="dark:hover:bg-gray-700"
										>
											<Heart className={post.likedUserIds?.includes(user?.uid) ? "h-4 w-4 text-pink-500 fill-pink-500" : "h-4 w-4 text-pink-500"} />
											{post.likes}
										</Button>
									</div>
									<div className="mt-4 space-y-2">
										{(post.comments||[]).map((c: Comment) => (
											<div key={c.id} className="text-xs text-gray-700 pl-2 border-l flex items-center gap-1">
												{c.isPublicProfile && user && user.uid === c.authorId ? (
													<Avatar className="w-5 h-5">
														<AvatarImage src={user.photoURL || undefined} />
                                            <AvatarFallback>{user.displayName?.[0] || (t('community.anon', '익명')[0] || 'N')}</AvatarFallback>
													</Avatar>
												) : null}
                                                <span className="font-semibold">{c.isPublicProfile && user && user.uid === c.authorId ? (user.displayName || t('nav.profile', '프로필')) : (c.nickname || t('community.anon', '익명'))}:</span> {c.text}
											</div>
										))}
									</div>
									<CommentInput postId={post.id} onComment={handleComment} />
								</CardContent>
							</Card>
						))}
					</div>
				</main>
						</div>

					<div className="flex justify-center py-4">
                        <Button variant="outline" onClick={loadMore} disabled={loadingMore} id="load-more-btn">
                                {loadingMore ? t('common.loading', '로딩 중...') : t('common.more', '더 보기')}
							</Button>
						</div>
		</div>
	)
}

function NavButton({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
	return (
		<Link href={href} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-100 transition text-indigo-700 font-medium text-sm w-full">
			{icon}
			<span>{label}</span>
		</Link>
	)
}

function CommentInput({ postId, onComment }: { postId: string; onComment: (id: string, comment: string, isPublicProfile: boolean) => void }) {
	const [comment, setComment] = useState("")
	const [isPublicProfile, setIsPublicProfile] = useState(false)
	const { t } = useTranslation()
	return (
		<form onSubmit={e => { e.preventDefault(); onComment(postId, comment, isPublicProfile); setComment(""); setIsPublicProfile(false); }} className="flex gap-2 mt-1 items-center">
			<Input value={comment} onChange={e => setComment(e.target.value)} placeholder={t('community.commentPlaceholder', '댓글 달기')} className="text-xs" />
			<input type="checkbox" id={`comment-public-${postId}`} checked={isPublicProfile} onChange={e => setIsPublicProfile(e.target.checked)} />
			<label htmlFor={`comment-public-${postId}`} className="text-xs select-none">{t('community.publicProfileShort', '공개 프로필로')}</label>
			<Button type="submit" size="sm" variant="outline">{t('community.submit', '등록')}</Button>
		</form>
	)
}
