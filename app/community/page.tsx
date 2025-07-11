// 커뮤니티 페이지
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Heart, MessageCircle, LayoutDashboard, BookOpen, BarChart2, Palette, Brain, PenLine, Bookmark, ThumbsUp, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth";

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
  recommendedUserIds?: string[]; // 추천한 사용자 ID 배열
  recommends?: number; // 추천 수
};

type Comment = {
  id: string;
  author: string;
  text: string;
  anonId?: string; // 브라우저별 임시 ID
  userId?: string; // 사용자 ID
  nickname?: string; // 댓글 작성자 닉네임
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
	const { user } = useAuth();
	const [posts, setPosts] = useState<Post[]>([])
	const [newContent, setNewContent] = useState("")
	const [loading, setLoading] = useState(false)
	useEffect(() => {
		fetch("/api/community")
			.then((res) => res.json())
			.then((data) => {
				// Ensure all posts have createdAt
				const postsWithCreatedAt = (data.posts || []).map((post: any) => ({
					...post,
					createdAt: post.createdAt || new Date().toISOString(),
				}))
				setPosts(postsWithCreatedAt)
			})
	}, [])
	const handlePost = async () => {
		if (!newContent.trim()) return
		setLoading(true)
		const authorId = user?.uid || ''
		const nickname = '익명' // 추후 익명N 로직 추가 예정
		const res = await fetch("/api/community", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: newContent, authorId, nickname })
		})
		const data = await res.json()
		const postWithCreatedAt = {
			...data.post,
			createdAt: data.post.createdAt || new Date().toISOString(),
		}
		setPosts([postWithCreatedAt, ...posts])
		setNewContent("")
		setLoading(false)
	}
	const handleLike = async (id: string) => {
		if (!user) return;
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
	};
	const handleComment = async (id: string, comment: string) => {
		if (!comment.trim() || !user) return;
		const res = await fetch("/api/community", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ postId: id, comment, userId: user.uid })
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
	const handleRecommend = async (id: string) => {
		if (!user) return;
		const post = posts.find(p => p.id === id);
		const recommended = post?.recommendedUserIds?.includes(user.uid);
		// 서버에 추천 상태 업데이트 요청 (PUT)
		const res = await fetch("/api/community", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ postId: id, recommend: !recommended, userId: user.uid })
		});
		const data = await res.json();
		if (data.ok) {
			setPosts(posts.map(p =>
				p.id === id
					? {
						...p,
						recommends: data.recommends,
						recommendedUserIds: data.recommendedUserIds,
					}
					: p
			));
		}
	};
	const handleDelete = async (id: string) => {
		if (!user) return;
		if (!window.confirm("정말 삭제하시겠습니까?")) return;
		const res = await fetch("/api/community", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ postId: id, userId: user.uid })
		});
		const data = await res.json();
		if (data.ok) {
			setPosts(posts.filter(p => p.id !== id));
		} else {
			alert(data.error || "삭제에 실패했습니다.");
		}
	};
	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
			<div className="container mx-auto px-2 py-8 max-w-3xl pt-20">
				<main className="w-full">
					<Card>
						<CardHeader>
							<CardTitle>꿈 공유하기</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="꿈을 자유롭게 공유해보세요!" />
							<Button onClick={handlePost} disabled={loading}>{loading ? '등록 중...' : '공유하기'}</Button>
						</CardContent>
					</Card>
					<div className="space-y-4 mt-8">
						{posts.map((post) => (
							<Card key={post.id}>
								<CardHeader className="flex flex-row items-center gap-2">
									<Avatar>
										<AvatarFallback>{post.nickname?.[0] || '익'}</AvatarFallback>
									</Avatar>
									<div>
										<CardTitle className="text-base">{post.nickname || '익명'}</CardTitle>
										<CardDescription className="text-xs text-gray-400">{post.createdAt?.toString().slice(0, 10) || ''}</CardDescription>
									</div>
									{user?.uid === post.authorId && (
										<button
											className="ml-auto p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
											onClick={() => handleDelete(post.id)}
											title="삭제"
										>
											<Trash2 className="w-5 h-5" />
										</button>
									)}
								</CardHeader>
								<CardContent>
									<div className="whitespace-pre-line">{post.content}</div>
									<div className="flex items-center gap-4 mt-2">
										<Button
											variant={post.likedUserIds?.includes(user?.uid) ? "solid" : "ghost"}
											size="sm"
											onClick={() => handleLike(post.id)}
										>
											<Heart className={post.likedUserIds?.includes(user?.uid) ? "h-4 w-4 text-pink-500 fill-pink-500" : "h-4 w-4 text-pink-500"} />
											{post.likes}
										</Button>
										<Button
											variant={post.recommendedUserIds?.includes(user?.uid) ? "solid" : "ghost"}
											size="sm"
											onClick={() => handleRecommend(post.id)}
										>
											<ThumbsUp className={post.recommendedUserIds?.includes(user?.uid) ? "h-4 w-4 text-green-500 fill-green-500" : "h-4 w-4 text-green-500"} />
											{post.recommends || 0}
										</Button>
									</div>
									<div className="mt-4 space-y-2">
										{(post.comments||[]).map((c: Comment) => (
											<div key={c.id} className="text-xs text-gray-700 pl-2 border-l">
												<span className="font-semibold">{c.nickname || '익명'}:</span> {c.text}
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

function CommentInput({ postId, onComment }: { postId: string; onComment: (id: string, comment: string) => void }) {
	const [comment, setComment] = useState("")
	return (
		<form onSubmit={e => { e.preventDefault(); onComment(postId, comment); setComment("") }} className="flex gap-2 mt-1">
			<Input value={comment} onChange={e => setComment(e.target.value)} placeholder="댓글 달기" className="text-xs" />
			<Button type="submit" size="sm" variant="outline">등록</Button>
		</form>
	)
}
