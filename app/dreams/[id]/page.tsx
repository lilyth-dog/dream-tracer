"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDreams } from "@/hooks/useDreams"
import type { Dream } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Moon,
  ArrowLeft,
  Calendar,
  Heart,
  Eye,
  Sparkles,
  Edit,
  Trash2,
  Share2,
  Download,
  Brain,
  Palette,
  MessageCircle,
  ThumbsUp,
  Bookmark,
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default function DreamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { dreams, deleteDream } = useDreams()
  const [dream, setDream] = useState<Dream | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null)
  const [interpretationLoading, setInterpretationLoading] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (params.id && dreams.length > 0) {
      const foundDream = dreams.find((d) => d.id === params.id)
      if (foundDream) {
        setDream(foundDream)
        setLikes(Math.floor(Math.random() * 20) + 1) // 임시 좋아요 수
      } else {
        router.push("/dreams")
      }
      setLoading(false)
    }
  }, [params.id, dreams, router])

  const handleAiInterpretation = async () => {
    if (!dream) return

    setInterpretationLoading(true)
    try {
      // 실제 구현에서는 AI API 호출
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const interpretation = `이 꿈은 당신의 무의식이 전하는 중요한 메시지를 담고 있습니다. 

**상징적 의미:**
${dream.title}에서 나타나는 주요 요소들은 자유와 해방에 대한 깊은 갈망을 상징합니다. 

**심리적 분석:**
현재 당신은 일상의 제약에서 벗어나고 싶은 강한 욕구를 가지고 있으며, 이는 매우 자연스러운 감정입니다.

**개인적 성장:**
이 꿈은 당신이 새로운 가능성을 탐색하고 자아실현을 추구할 준비가 되어있음을 시사합니다.

**실천 방안:**
꿈에서 느낀 자유로움을 현실에서도 경험할 수 있는 작은 변화들을 시도해보세요.`

      setAiInterpretation(interpretation)
    } catch (error) {
      console.error("Error getting AI interpretation:", error)
      alert("AI 해석을 가져오는데 실패했습니다.")
    } finally {
      setInterpretationLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!dream) return

    try {
      await deleteDream(dream.id)
      alert("꿈 일기가 삭제되었습니다.")
      router.push("/dreams")
    } catch (error) {
      console.error("Delete error:", error)
      alert("삭제에 실패했습니다.")
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: dream?.title,
        text: dream?.content.slice(0, 100) + "...",
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("링크가 클립보드에 복사되었습니다!")
    }
  }

  const handleDownload = () => {
    if (!dream) return

    const content = `
꿈 제목: ${dream.title}
날짜: ${format(new Date(dream.date), "PPP", { locale: ko })}
감정: ${dream.emotion}
생생함: ${dream.vividness}/5
루시드 드림: ${dream.isLucid ? "예" : "아니오"}

내용:
${dream.content}

태그: ${dream.tags.join(", ")}
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${dream.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const emotions = {
    joy: { label: "기쁨", color: "text-yellow-500", bg: "bg-yellow-50" },
    peace: { label: "평온", color: "text-blue-500", bg: "bg-blue-50" },
    fear: { label: "두려움", color: "text-red-500", bg: "bg-red-50" },
    sadness: { label: "슬픔", color: "text-gray-500", bg: "bg-gray-50" },
    excitement: { label: "흥분", color: "text-orange-500", bg: "bg-orange-50" },
    wonder: { label: "경이", color: "text-purple-500", bg: "bg-purple-50" },
  }

  const dreamTypes = {
    normal: "일반적인 꿈",
    nightmare: "악몽",
    lucid: "루시드 드림",
    recurring: "반복되는 꿈",
    prophetic: "예지몽",
    healing: "치유의 꿈",
  }

  const sleepQualities = {
    excellent: "매우 좋음",
    good: "좋음",
    fair: "보통",
    poor: "나쁨",
    terrible: "매우 나쁨",
  }

  if (loading) {
    return (
      <div className="min-h-screen dreamy-bg flex items-center justify-center">
        <div className="text-center">
          <Moon className="h-12 w-12 text-indigo-600 animate-pulse mx-auto mb-4 float-animation" />
          <p className="text-gray-600">꿈을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!dream) {
    return null
  }

  return (
    <div className="min-h-screen dreamy-bg">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Dream Header */}
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {dream.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-base">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(dream.date), "PPP", { locale: ko })}
                      </div>
                      {dream.isLucid && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Sparkles className="h-4 w-4" />
                          루시드 드림
                        </div>
                      )}
                    </CardDescription>
                  </div>
                </div>

                {/* 상호작용 버튼들 */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLikes(likes + 1)}
                    className="text-gray-600 hover:text-red-500"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-500">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    댓글
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/visualize?dream=${dream.id}`)}
                    className="text-gray-600 hover:text-purple-500"
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    시각화
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="content" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">꿈 내용</TabsTrigger>
                <TabsTrigger value="analysis">AI 분석</TabsTrigger>
                <TabsTrigger value="media">미디어</TabsTrigger>
              </TabsList>

              {/* 꿈 내용 */}
              <TabsContent value="content">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle>꿈의 내용</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">{dream.content}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI 분석 */}
              <TabsContent value="analysis">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      AI 꿈 해석
                    </CardTitle>
                    <CardDescription>인공지능이 분석한 꿈의 의미와 해석입니다</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiInterpretation ? (
                      <div className="prose max-w-none">
                        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                          <pre className="text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                            {aiInterpretation}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4 float-animation" />
                        <p className="text-gray-500 mb-4">아직 AI 해석이 생성되지 않았습니다</p>
                        <Button
                          onClick={handleAiInterpretation}
                          disabled={interpretationLoading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          {interpretationLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              해석 생성 중...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              AI 해석 생성
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 미디어 */}
              <TabsContent value="media">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle>관련 이미지</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dream.images.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dream.images.map((image) => (
                          <img key={image.url || image} src={image.url || image} alt={`꿈 이미지 ${image.url || image}`} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">업로드된 이미지가 없습니다</p>
                        <Button
                          onClick={() => router.push(`/visualize?dream=${dream.id}`)}
                          className="bg-gradient-to-r from-pink-600 to-purple-600"
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          AI로 꿈 시각화하기
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dream Stats */}
            <Card className="glass-effect sticky top-24">
              <CardHeader>
                <CardTitle>꿈의 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">감정</span>
                  <Badge
                    variant="secondary"
                    className={`flex items-center gap-1 ${emotions[dream.emotion as keyof typeof emotions]?.bg}`}
                  >
                    <Heart className="h-3 w-3" />
                    {emotions[dream.emotion as keyof typeof emotions]?.label || dream.emotion}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">꿈의 유형</span>
                  <span className="text-sm font-medium">
                    {dreamTypes[dream.dreamType as keyof typeof dreamTypes] || dream.dreamType}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">생생함</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{dream.vividness}/5</span>
                    <div className="flex gap-1 ml-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${i < dream.vividness ? "bg-purple-500" : "bg-gray-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">수면의 질</span>
                  <span className="text-sm font-medium">
                    {sleepQualities[dream.sleepQuality as keyof typeof sleepQualities] || dream.sleepQuality}
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <span className="text-sm text-gray-600">작성일</span>
                  <p className="text-sm">{format(new Date(dream.createdAt), "PPP p", { locale: ko })}</p>
                </div>

                {new Date(dream.updatedAt).getTime() !== new Date(dream.createdAt).getTime() && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">수정일</span>
                    <p className="text-sm">{format(new Date(dream.updatedAt), "PPP p", { locale: ko })}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>태그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dream.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => router.push(`/dreams?tag=${tag}`)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/write?edit=${dream.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />꿈 수정하기
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />꿈 공유하기
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  텍스트로 내보내기
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/visualize?dream=${dream.id}`)}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  AI 시각화
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
