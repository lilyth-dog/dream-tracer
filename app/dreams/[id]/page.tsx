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
  Bookmark,
} from "lucide-react"
import { format } from "date-fns"
import { enUS, ko, ja, zhCN } from "date-fns/locale"
import { useTranslation } from 'react-i18next'

export default function DreamDetailPage() {
  const { t } = useTranslation()
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

  const getDateFnsLocale = () => {
    const lng = (typeof window !== 'undefined' ? (localStorage.getItem('lang') || 'ko') : 'ko') as string
    switch (lng) {
      case 'en': return enUS
      case 'ja': return ja
      case 'zh': return zhCN
      default: return ko
    }
  }
  const dateLocale = getDateFnsLocale()

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

      const interpretation = t('dreamDetail.ai.sample', `이 꿈은 당신의 무의식이 전하는 중요한 메시지를 담고 있습니다.\n\n**상징적 의미:**\n${dream.title}에서 나타나는 주요 요소들은 자유와 해방에 대한 깊은 갈망을 상징합니다.\n\n**심리적 분석:**\n현재 당신은 일상의 제약에서 벗어나고 싶은 강한 욕구를 가지고 있으며, 이는 매우 자연스러운 감정입니다.\n\n**개인적 성장:**\n이 꿈은 당신이 새로운 가능성을 탐색하고 자아실현을 추구할 준비가 되어있음을 시사합니다.\n\n**실천 방안:**\n꿈에서 느낀 자유로움을 현실에서도 경험할 수 있는 작은 변화들을 시도해보세요.`)

      setAiInterpretation(interpretation)
    } catch (error) {
      console.error("Error getting AI interpretation:", error)
      alert(t('dreamDetail.aiInterpretationFailed', 'AI 해석을 가져오는데 실패했습니다.'))
    } finally {
      setInterpretationLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!dream) return

    try {
      await deleteDream(dream.id)
      alert(t('dreamDetail.deleteSuccess', '꿈 일기가 삭제되었습니다.'))
      router.push("/dreams")
    } catch (error) {
      console.error("Delete error:", error)
      alert(t('common.deleteFailed', '삭제에 실패했습니다.'))
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
      alert(t('dreamDetail.share.copied', '링크가 클립보드에 복사되었습니다!'))
    }
  }

  const handleDownload = () => {
    if (!dream) return

    const content = `
${t('dreamDetail.export.titleLabel', '꿈 제목')}: ${dream.title}
${t('dreamDetail.export.dateLabel', '날짜')}: ${format(new Date(dream.date), "PPP", { locale: dateLocale })}
${t('dreamDetail.export.emotionLabel', '감정')}: ${dream.emotion}
${t('dreamDetail.export.vividnessLabel', '생생함')}: ${dream.vividness}/5
${t('dreamDetail.export.lucidLabel', '루시드 드림')}: ${dream.isLucid ? t('common.yes', '예') : t('common.no', '아니오')}

${t('dreamDetail.export.contentLabel', '내용')}:
${dream.content}

${t('dreamDetail.export.tagsLabel', '태그')}: ${dream.tags.join(", ")}
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
    joy: { label: t('emotions.joy', '기쁨'), color: "text-yellow-500", bg: "bg-yellow-50" },
    peace: { label: t('emotions.peace', '평온'), color: "text-blue-500", bg: "bg-blue-50" },
    fear: { label: t('emotions.fear', '두려움'), color: "text-red-500", bg: "bg-red-50" },
    sadness: { label: t('emotions.sadness', '슬픔'), color: "text-gray-500", bg: "bg-gray-50" },
    excitement: { label: t('emotions.excitement', '흥분'), color: "text-orange-500", bg: "bg-orange-50" },
    wonder: { label: t('emotions.wonder', '경이'), color: "text-purple-500", bg: "bg-purple-50" },
  }

  const dreamTypes = {
    normal: t('dreamTypes.normal', '일반적인 꿈'),
    nightmare: t('dreamTypes.nightmare', '악몽'),
    lucid: t('dreamTypes.lucid', '루시드 드림'),
    recurring: t('dreamTypes.recurring', '반복되는 꿈'),
    prophetic: t('dreamTypes.prophetic', '예지몽'),
    healing: t('dreamTypes.healing', '치유의 꿈'),
  }

  const sleepQualities = {
    excellent: t('sleepQualities.excellent', '매우 좋음'),
    good: t('sleepQualities.good', '좋음'),
    fair: t('sleepQualities.fair', '보통'),
    poor: t('sleepQualities.poor', '나쁨'),
    terrible: t('sleepQualities.terrible', '매우 나쁨'),
  }

  if (loading) {
    return (
      <div className="min-h-screen dreamy-bg flex items-center justify-center">
        <div className="text-center">
          <Moon className="h-12 w-12 text-indigo-600 animate-pulse mx-auto mb-4 float-animation" />
          <p className="text-gray-600">{t('dreamDetail.loading', '꿈을 불러오는 중...')}</p>
        </div>
      </div>
    )
  }

  if (!dream) {
    return null
  }

  return (
    <div className="min-h-screen dreamy-bg overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Dream Header */}
            <Card className="glass-effect dark:bg-gray-800/70">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {dream.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-base">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                         {format(new Date(dream.date), "PPP", { locale: dateLocale })}
                      </div>
                    {dream.isLucid && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Sparkles className="h-4 w-4" />
                          {t('dreamDetail.header.lucid', '루시드 드림')}
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
                    <Heart className="h-4 w-4 mr-1" />
                    {likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-500">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {t('dreamDetail.header.comment', '댓글')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/visualize?dream=${dream.id}`)}
                    className="text-gray-600 hover:text-purple-500"
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    {t('dreamDetail.header.visualize', '시각화')}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="content" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">{t('dreamDetail.tabs.content', '꿈 내용')}</TabsTrigger>
                <TabsTrigger value="analysis">{t('dreamDetail.tabs.analysis', 'AI 분석')}</TabsTrigger>
                <TabsTrigger value="media">{t('dreamDetail.tabs.media', '미디어')}</TabsTrigger>
              </TabsList>

              {/* 꿈 내용 */}
              <TabsContent value="content">
                <Card className="glass-effect dark:bg-gray-800/70">
                  <CardHeader>
                    <CardTitle>{t('dreamDetail.content.title', '꿈의 내용')}</CardTitle>
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
                <Card className="glass-effect dark:bg-gray-800/70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      {t('dreamDetail.ai.title', 'AI 꿈 해석')}
                    </CardTitle>
                    <CardDescription>{t('dreamDetail.ai.desc', '인공지능이 분석한 꿈의 의미와 해석입니다')}</CardDescription>
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
                        <p className="text-gray-500 mb-4">{t('dreamDetail.ai.empty', '아직 AI 해석이 생성되지 않았습니다')}</p>
                        <Button
                          onClick={handleAiInterpretation}
                          disabled={interpretationLoading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          {interpretationLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {t('dreamDetail.ai.generating', '해석 생성 중...')}
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              {t('dreamDetail.ai.generate', 'AI 해석 생성')}
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
                    <CardTitle>{t('dreamDetail.media.title', '관련 이미지')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dream.images.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dream.images.map((image) => (
                          <img key={image.url || image} src={image.url || image} alt={`${t('dreamDetail.media.imageAlt', '꿈 이미지')} ${image.url || image}`} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">{t('dreamDetail.media.empty', '업로드된 이미지가 없습니다')}</p>
                        <Button
                          onClick={() => router.push(`/visualize?dream=${dream.id}`)}
                          className="bg-gradient-to-r from-pink-600 to-purple-600"
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          {t('dreamDetail.media.visualizeCta', 'AI로 꿈 시각화하기')}
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
            <Card className="glass-effect dark:bg-gray-800/70 sticky top-24">
              <CardHeader>
                <CardTitle>{t('dreamDetail.info.title', '꿈의 정보')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('dreamDetail.info.emotion', '감정')}</span>
                  <Badge
                    variant="secondary"
                    className={`flex items-center gap-1 ${emotions[dream.emotion as keyof typeof emotions]?.bg} dark:bg-gray-800 dark:text-gray-100`}
                  >
                    <Heart className="h-3 w-3" />
                    {emotions[dream.emotion as keyof typeof emotions]?.label || dream.emotion}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('dreamDetail.info.dreamType', '꿈의 유형')}</span>
                  <span className="text-sm font-medium">
                    {dreamTypes[dream.dreamType as keyof typeof dreamTypes] || dream.dreamType}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('dreamDetail.info.vividness', '생생함')}</span>
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
                  <span className="text-sm text-gray-600">{t('dreamDetail.info.sleepQuality', '수면의 질')}</span>
                  <span className="text-sm font-medium">
                    {sleepQualities[dream.sleepQuality as keyof typeof sleepQualities] || dream.sleepQuality}
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <span className="text-sm text-gray-600">{t('dreamDetail.info.createdAt', '작성일')}</span>
                  <p className="text-sm">{format(new Date(dream.createdAt), "PPP p", { locale: dateLocale })}</p>
                </div>

                {new Date(dream.updatedAt).getTime() !== new Date(dream.createdAt).getTime() && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">{t('dreamDetail.info.updatedAt', '수정일')}</span>
                    <p className="text-sm">{format(new Date(dream.updatedAt), "PPP p", { locale: dateLocale })}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="glass-effect dark:bg-gray-800/70">
              <CardHeader>
                <CardTitle>{t('dreamDetail.tags.title', '태그')}</CardTitle>
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
            <Card className="glass-effect dark:bg-gray-800/70">
              <CardHeader>
                <CardTitle>{t('dreamDetail.quick.title', '빠른 작업')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/write?edit=${dream.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />{t('dreamDetail.quick.edit', '꿈 수정하기')}
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />{t('dreamDetail.quick.share', '꿈 공유하기')}
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('dreamDetail.quick.export', '텍스트로 내보내기')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push(`/visualize?dream=${dream.id}`)}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  {t('dreamDetail.quick.visualize', 'AI 시각화')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
