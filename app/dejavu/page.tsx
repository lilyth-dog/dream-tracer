// 데자뷰 찾기 (현실-꿈 매칭) 페이지
"use client"

import { useState, useEffect } from "react"
import { useDreams } from "@/hooks/useDreams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, ArrowLeft, Zap, Search, Calendar, Eye, TrendingUp, Star, AlertCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from 'react-i18next'

// DreamMatch 타입 정의 예시(실제 구조에 맞게 수정)
type DreamMatch = {
  id: string;
  dreamTitle: string;
  dreamDate: Date;
  matchScore: number;
  matchedElements: string[];
  aiAnalysis: string;
};

export default function DejavuFinderPage() {
  const { dreams, loading } = useDreams()
  const { t, i18n } = useTranslation()
  const [realEvent, setRealEvent] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [dejavuMatches, setDejavuMatches] = useState<DreamMatch[]>([])
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // 샘플: 현실-꿈 매칭 결과
  const sampleMatches = [
    {
      id: "1",
      dreamTitle: t('dejavu.sample.dream1Title', '하늘을 나는 꿈'),
      dreamDate: new Date(2024, 0, 15),
      matchScore: 92,
      matchedElements: [
        t('dejavu.result.elements.similarPlace', '비슷한 장소'),
        t('dejavu.result.elements.similarPerson', '비슷한 인물'),
        t('dejavu.result.elements.similarEmotion', '비슷한 감정')
      ],
      aiAnalysis: t('dejavu.sample.dream1Analysis', '현실에서 겪은 자유로운 상황이 과거 꿈의 비행 경험과 연결되어 있습니다. 무의식이 현실 경험을 꿈과 연관지어 해석하고 있습니다.'),
    },
    {
      id: "2",
      dreamTitle: t('dejavu.sample.dream2Title', '어린 시절 집'),
      dreamDate: new Date(2024, 0, 13),
      matchScore: 75,
      matchedElements: [
        t('dejavu.result.elements.placeSimilarity', '장소 유사성'),
        t('dejavu.result.elements.emotionSimilarity', '감정 유사성')
      ],
      aiAnalysis: t('dejavu.sample.dream2Analysis', '현실의 익숙한 공간에서 느낀 감정이 과거 꿈의 안전감과 연결되어 있습니다.'),
    },
  ]

  const startAnalysis = async () => {
    if (!realEvent.trim()) {
      alert(t('dejavu.input.required', '현실에서 겪은 일을 입력해 주세요.'))
      return
    }
    setAnalyzing(true)
    setAnalysisProgress(0)
    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setAnalyzing(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
    // OpenAI Embedding + Claude 해설 API 호출
    try {
      const res = await fetch("/api/dejavu-vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreams, realEvent, topN: 3 })
      })
      const data = await res.json()
      const normalized = (data.result || []).map((m: any) => ({
        ...m,
        dreamDate: m.dreamDate ? new Date(m.dreamDate) : new Date(),
        matchedElements: Array.isArray(m.matchedElements) ? m.matchedElements : [],
        matchScore: typeof m.matchScore === 'number' ? m.matchScore : 0,
      }))
      setDejavuMatches(normalized)
    } catch (error) {
      alert(t('dejavu.error', '분석 중 오류가 발생했습니다.'))
    }
  }

  return (
    <div className="min-h-screen dreamy-bg pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 소개 섹션 */}
            <Card className="mb-8 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Brain className="h-12 w-12 text-purple-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-purple-800 mb-2">{t('dejavu.title', '현실-꿈 데자뷰 찾기')}</h2>
                <p className="text-purple-700 mb-4">
                  {t('dejavu.desc', '최근 현실에서 겪은 인상적인 사건이나 장면을 입력하면, AI가 과거 꿈 기록 중 유사한 내용을 찾아 연결해줍니다.')}<br />
                  {t('dejavu.hint', '"이 장면, 꿈에서 본 적 있는데?" 싶은 순간을 과학적으로 탐구해보세요.')}
                </p>
                    <p className="text-xs text-purple-600/80">
                      {t('dejavu.scoreNote', '표시되는 유사도는 내 꿈 목록 내 상대적 퍼센타일 점수입니다. 예: 80%는 상위 20% 유사함을 의미해요.')}
                    </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 현실 사건 입력 폼 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('dejavu.input.title', '현실에서 겪은 일 설명')}</CardTitle>
            <CardDescription>{t('dejavu.input.desc', '최근에 경험한 인상적인 사건, 장면, 대화, 감정 등을 자유롭게 입력해 주세요.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={realEvent}
              onChange={e => setRealEvent(e.target.value)}
              placeholder={t('dejavu.input.placeholder', '예: 오늘 처음 가본 카페에서 낯익은 풍경을 봤다. 누군가와 대화하는데, 이상하게 익숙한 느낌이 들었다...')}
              className="min-h-[120px] mb-4"
            />
            <Button
              onClick={startAnalysis}
              disabled={analyzing || !realEvent.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 w-full"
            >
              {analyzing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  {t('dejavu.progress.running', '분석 중...')}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {t('dejavu.cta', '데자뷰 찾기')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 분석 진행 상황 */}
        {analyzing && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Brain className="h-16 w-16 text-purple-600 animate-pulse mx-auto" />
                <h3 className="text-lg font-semibold">{t('dejavu.progress.title', 'AI가 현실과 꿈을 비교 분석 중입니다...')}</h3>
                <Progress value={analysisProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-gray-600">{analysisProgress}% {t('dejavu.progress.done', '완료')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 결과가 없을 때 */}
        {!analyzing && dejavuMatches.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('dejavu.empty.title', '아직 데자뷰 결과가 없습니다')}</h3>
              <p className="text-gray-500 mb-4">{t('dejavu.empty.hint', '현실에서 겪은 일을 입력하고, 데자뷰 찾기를 눌러보세요.')}</p>
            </CardContent>
          </Card>
        )}

        {/* 데자뷰 매치 결과 */}
        {!analyzing && dejavuMatches.length > 0 && (
          <div className="space-y-6">
            {dejavuMatches.map(match => (
              <Card key={match.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{t('dejavu.result.dream', '꿈')}: {match.dreamTitle}</CardTitle>
                      <CardDescription>{t('dejavu.result.date', '기록일')}: {match.dreamDate.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'ja' ? 'ja-JP' : i18n.language === 'zh' ? 'zh-CN' : 'ko-KR')}</CardDescription>
                    </div>
                    <Badge className="text-lg font-bold bg-purple-100 text-purple-700 border-0">{match.matchScore}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* 매칭 요소 */}
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-800 mb-2">{t('dejavu.result.elements', '유사한 요소')}</h5>
                    <div className="flex flex-wrap gap-2">
                      {match.matchedElements.map((element: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {element}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {/* AI 분석 */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        {t('dejavu.result.ai', 'AI 분석')}
                      </h5>
                    <p className="text-gray-700 text-sm leading-relaxed">{match.aiAnalysis}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
