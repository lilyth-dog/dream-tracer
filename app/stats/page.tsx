// 통계 대시보드 페이지
"use client"

import { useState, useEffect } from "react"
import { useDreams } from "@/hooks/useDreams"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Moon, ArrowLeft, TrendingUp, Calendar, Heart, Eye, Sparkles, BarChart3, PieChart } from "lucide-react"
import Link from "next/link"

export default function StatsPage() {
  const { dreams, loading } = useDreams()
  const [stats, setStats] = useState({
    totalDreams: 0,
    thisMonth: 0,
    thisWeek: 0,
    streak: 0,
    averageVividness: 0,
    lucidDreamCount: 0,
    emotionStats: {} as Record<string, number>,
    tagStats: {} as Record<string, number>,
    dreamTypeStats: {} as Record<string, number>,
    monthlyStats: [] as { month: string; count: number }[],
  })

  useEffect(() => {
    if (!dreams.length) return

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 기본 통계
    const totalDreams = dreams.length
    const thisMonthDreams = dreams.filter((dream) => dream.date >= thisMonth).length
    const thisWeekDreams = dreams.filter((dream) => dream.date >= thisWeek).length
    const lucidDreams = dreams.filter((dream) => dream.isLucid).length
    const averageVividness = dreams.reduce((sum, dream) => sum + dream.vividness, 0) / dreams.length

    // 연속 기록 계산
    const sortedDreams = [...dreams].sort((a, b) => b.date.getTime() - a.date.getTime())
    let streak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const dream of sortedDreams) {
      const dreamDate = new Date(dream.date)
      dreamDate.setHours(0, 0, 0, 0)

      const diffDays = Math.floor((currentDate.getTime() - dreamDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === streak) {
        streak++
      } else if (diffDays === streak + 1) {
        streak++
      } else {
        break
      }
    }

    // 감정 통계
    const emotionStats: Record<string, number> = {}
    dreams.forEach((dream) => {
      emotionStats[dream.emotion] = (emotionStats[dream.emotion] || 0) + 1
    })

    // 태그 통계
    const tagStats: Record<string, number> = {}
    dreams.forEach((dream) => {
      dream.tags.forEach((tag) => {
        tagStats[tag] = (tagStats[tag] || 0) + 1
      })
    })

    // 꿈 유형 통계
    const dreamTypeStats: Record<string, number> = {}
    dreams.forEach((dream) => {
      dreamTypeStats[dream.dreamType] = (dreamTypeStats[dream.dreamType] || 0) + 1
    })

    // 월별 통계
    const monthlyStats: Record<string, number> = {}
    dreams.forEach((dream) => {
      const monthKey = dream.date.toISOString().slice(0, 7) // YYYY-MM
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1
    })

    const monthlyStatsArray = Object.entries(monthlyStats)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // 최근 6개월

    setStats({
      totalDreams,
      thisMonth: thisMonthDreams,
      thisWeek: thisWeekDreams,
      streak,
      averageVividness: Math.round(averageVividness * 10) / 10,
      lucidDreamCount: lucidDreams,
      emotionStats,
      tagStats,
      dreamTypeStats,
      monthlyStats: monthlyStatsArray,
    })
  }, [dreams])

  const emotions = {
    joy: { label: "기쁨", color: "bg-yellow-500" },
    peace: { label: "평온", color: "bg-blue-500" },
    fear: { label: "두려움", color: "bg-red-500" },
    sadness: { label: "슬픔", color: "bg-gray-500" },
    excitement: { label: "흥분", color: "bg-orange-500" },
    wonder: { label: "경이", color: "bg-purple-500" },
  }

  const dreamTypes = {
    normal: "일반적인 꿈",
    nightmare: "악몽",
    lucid: "루시드 드림",
    recurring: "반복되는 꿈",
    prophetic: "예지몽",
    healing: "치유의 꿈",
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">통계를 계산하는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dreamy-bg pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 꿈 일기</p>
                  <p className="text-2xl font-bold">{stats.totalDreams}</p>
                </div>
                <Moon className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">이번 달</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">연속 기록</p>
                  <p className="text-2xl font-bold">{stats.streak}일</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">루시드 드림</p>
                  <p className="text-2xl font-bold">{stats.lucidDreamCount}</p>
                </div>
                <Sparkles className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emotion Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                감정 분포
              </CardTitle>
              <CardDescription>꿈에서 느낀 감정들의 분포입니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.emotionStats)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, count]) => {
                  const percentage = (count / stats.totalDreams) * 100
                  const emotionData = emotions[emotion as keyof typeof emotions]
                  return (
                    <div key={emotion} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{emotionData?.label || emotion}</span>
                        <span className="text-sm text-gray-500">
                          {count}회 ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
            </CardContent>
          </Card>

          {/* Dream Type Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />꿈 유형 분포
              </CardTitle>
              <CardDescription>꿈의 유형별 분포입니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.dreamTypeStats)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percentage = (count / stats.totalDreams) * 100
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {dreamTypes[type as keyof typeof dreamTypes] || type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {count}회 ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
            </CardContent>
          </Card>

          {/* Top Tags */}
          <Card>
            <CardHeader>
              <CardTitle>자주 사용하는 태그</CardTitle>
              <CardDescription>가장 많이 사용된 태그들입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.tagStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 15)
                  .map(([tag, count]) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      {tag} ({count})
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                추가 통계
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">평균 생생함</span>
                <span className="text-sm font-medium">{stats.averageVividness}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">이번 주 기록</span>
                <span className="text-sm font-medium">{stats.thisWeek}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">루시드 드림 비율</span>
                <span className="text-sm font-medium">
                  {stats.totalDreams > 0 ? Math.round((stats.lucidDreamCount / stats.totalDreams) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">월 평균 기록</span>
                <span className="text-sm font-medium">
                  {stats.monthlyStats.length > 0
                    ? Math.round(
                        stats.monthlyStats.reduce((sum, stat) => sum + stat.count, 0) / stats.monthlyStats.length,
                      )
                    : 0}
                  개
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        {stats.monthlyStats.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>월별 기록 추이</CardTitle>
              <CardDescription>최근 6개월간의 꿈 기록 추이입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.monthlyStats.map(({ month, count }) => {
                  const maxCount = Math.max(...stats.monthlyStats.map((s) => s.count))
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {new Date(month + "-01").toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                          })}
                        </span>
                        <span className="text-sm text-gray-500">{count}개</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
