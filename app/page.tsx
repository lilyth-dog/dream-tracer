"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDreams } from "@/hooks/useDreams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import {
  Moon,
  PlusCircle,
  BookOpen,
  Calendar as CalendarIcon,
  Heart,
  Sparkles,
  TrendingUp,
  Clock,
  ImageIcon,
  Brain,
  Palette,
  Users,
  Zap,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Navigation } from "@/components/layout/navigation"
import type { Dream } from "@/lib/types"
import FeatureCards from "@/components/ui/feature-cards"
import InfoWidgets from "@/components/ui/info-widgets"

// 슈팅스타 컴포넌트
type ShootingStarProps = Readonly<{ top: number; left: number; animationDelay: string }>
function ShootingStar({ top, left, animationDelay }: ShootingStarProps) {
  return (
    <div
      className="shooting-star"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        animationDelay,
      }}
      aria-hidden="true"
    />
  )
}
// 별 컴포넌트
type DreamStarProps = Readonly<{ left: number; top: number; animationDelay: string; id: string }>
function DreamStar({ left, top, animationDelay, id }: DreamStarProps) {
  return (
    <div
      key={id}
      className="dream-star"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        animationDelay,
      }}
      aria-hidden="true"
    />
  )
}

export default function LucidDreamDiary() {
  const router = useRouter()
  const { dreams, loading } = useDreams()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [dreamTipIdx, setDreamTipIdx] = useState(0);

  const dreamTips = [
    "꿈을 더 생생하게 기억하려면 잠에서 깨자마자 바로 기록하는 것이 좋습니다.",
    "루시드 드림을 위해 하루 종일 '지금 꿈을 꾸고 있나?'라고 자문해보세요.",
    "꿈 일기를 쓸 때는 감정과 색깔, 소리 등 세부사항도 함께 적어보세요.",
    "명상과 규칙적인 수면 패턴이 꿈의 질을 향상시킵니다.",
    "꿈 속에서 손을 보는 연습을 하면 루시드 드림에 도움이 됩니다.",
  ]

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    setDreamTipIdx(0); // Initialize dreamTipIdx
    return () => clearInterval(timer)
  }, [])

  const recentDreams = dreams.slice(0, 3)

  function calculateStreak(dreams: Dream[]): number {
    if (!dreams || dreams.length === 0) return 0
    const days = Array.from(
      new Set(
        dreams.map((d: Dream) => {
          const date = new Date(d.date)
          date.setHours(0, 0, 0, 0)
          return date.getTime()
        })
      )
    ).sort((a: number, b: number) => b - a)
    let streak = 0
    let today = new Date()
    today.setHours(0, 0, 0, 0)
    for (const day of days) {
      if (day === today.getTime() - 86400000 * streak) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const dreamDates = Array.from(
    new Set(
      dreams.map((d: Dream) => {
        const date = new Date(d.date)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
    )
  ).map((ts: number) => new Date(ts))

  const stats = {
    totalDreams: dreams.length,
    thisMonth: dreams.filter((dream) => {
      const now = new Date()
      const dreamDate = new Date(dream.date)
      return dreamDate.getMonth() === now.getMonth() && dreamDate.getFullYear() === now.getFullYear()
    }).length,
    streak: calculateStreak(dreams),
    favoriteEmotion: "기쁨",
    lucidDreams: dreams.filter((dream) => dream.isLucid).length,
  }

  const getMoonPhase = () => {
    const phases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"]
    const day = currentTime.getDate()
    return phases[day % 8]
  }

  // 별 위치 useMemo로 고정
  const stars = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        id: crypto.randomUUID(),
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: `${Math.random() * 3}s`,
      })),
    []
  )

  const getRelatedTip = () => {
    if (recentDreams.length === 0) return dreamTips[dreamTipIdx % dreamTips.length];
    const lastDream = recentDreams[0];
    // 감정/태그/루시드 등과 연관된 팁 추천(간단 예시)
    if (lastDream.isLucid) return "루시드 드림을 자주 경험한다면, 꿈에서 현실 자각 연습을 해보세요.";
    if (lastDream.emotion === "fear") return "두려운 꿈을 꿨다면, 꿈 내용을 기록하고 감정을 정리해보세요.";
    if (lastDream.tags?.includes("가족")) return "가족이 등장하는 꿈은 관계에 대한 메시지일 수 있어요.";
    return dreamTips[dreamTipIdx % dreamTips.length];
  };
  const handleNextTip = () => setDreamTipIdx(i => i + 1);

  if (loading) {
    return (
      <div className="min-h-screen dreamy-bg flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Moon className="h-16 w-16 text-purple-600 animate-pulse mx-auto mb-4 float-animation" />
            <ShootingStar top={20} left={20} animationDelay="0s" />
            <ShootingStar top={40} left={60} animationDelay="1s" />
            <ShootingStar top={10} left={100} animationDelay="2s" />
          </div>
          <p className="text-gray-600 neon-text">꿈의 세계로 들어가는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative pb-16">      
      {/* 배경 별들 */}
      <div className="fixed inset-0 pointer-events-none -z-5">
        {stars.map((star) => (
          <DreamStar key={star.id} id={star.id} left={star.left} top={star.top} animationDelay={star.animationDelay} />
        ))}
      </div>

      <div className="container mx-auto px-2 py-6 space-y-8 max-w-7xl pt-20">
        {/* 헤더(알림 버튼 삭제, 프로필/새 기록만 남김) */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">나의 꿈 일기장</h1>
            <p className="text-sm text-gray-500">{currentTime.toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {/* 프로필/새 기록만 */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs ml-2">
              <PlusCircle className="h-4 w-4 mr-1" />새 기록
            </Button>
          </div>
        </div>
        {/* 주요 기능 카드 그리드 부분 수정 */}
        {/* 2*2, 2*3 등에서 옆 공간이 남지 않도록 grid-cols-4까지 확장 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          <FeatureCards />
        </div>
        {/* AI 추천/분석 섹션 */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 shadow p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-indigo-700 mb-1 flex items-center gap-2"><Sparkles className="h-5 w-5" />오늘의 AI 꿈 해석</h2>
            <p className="text-gray-700 text-sm mb-2">AI가 최근 꿈 기록을 분석해 오늘의 꿈 패턴과 해석을 추천합니다.</p>
            <Button size="sm" variant="secondary" className="bg-indigo-500 text-white">AI 해석 보기</Button>
          </div>
          <div className="flex flex-col items-center">
            <Brain className="h-12 w-12 text-indigo-400 mb-2" />
            <span className="text-xs text-indigo-600">AI 추천 활성화</span>
          </div>
        </div>

        {/* 최근 꿈 일기/샘플/가이드 */}
        <div className="rounded-xl bg-white/80 shadow p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">최근 꿈 일기</h2>
            <Link href="/dreams" className="text-xs text-indigo-600 hover:underline">모두 보기</Link>
          </div>
          {recentDreams.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <ImageIcon className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">아직 꿈 일기가 없습니다.</p>
              <Button asChild variant="outline"><Link href="/write">꿈 기록하러 가기</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentDreams.map((dream) => (
                <Card key={dream.id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-purple-800 line-clamp-1">{dream.title}</CardTitle>
                    <CardDescription className="text-xs text-gray-500">{new Date(dream.date).toLocaleDateString('ko-KR')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 line-clamp-3 mb-2">{dream.content}</p>
                    <div className="flex items-center gap-2">
                      {dream.isLucid && <Badge className="bg-orange-200 text-orange-700">루시드</Badge>}
                      <Badge className="bg-indigo-100 text-indigo-700">{dream.emotion}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 정보/통계/팁 위젯 강조 */}
        <InfoWidgets stats={stats} currentTime={currentTime} dreamTip={getRelatedTip()} onNextTip={handleNextTip} />
      </div>
    </div>
  )
}
