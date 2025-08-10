import { BarChart3, Calendar, Heart, Sparkles, Info, BookOpen } from "lucide-react"

export default function InfoWidgets({ stats, currentTime, dreamTip, onNextTip }: {
  stats: {
    totalDreams: number
    thisMonth: number
    lucidDreams: number
    streak: number
    favoriteEmotion: string
    monthGoal?: number
  },
  currentTime: Date,
  dreamTip: string,
  onNextTip?: () => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 my-2">
      {/* 꿈 일기 통계 */}
      <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 shadow p-3 flex flex-col gap-1 min-h-[90px]">
        <div className="flex items-center gap-1 mb-1">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-gray-700 dark:text-gray-100 text-sm">꿈 일기 통계</span>
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-gray-700 dark:text-gray-200">
          <div>총 꿈 일기: <span className="font-semibold text-indigo-600 dark:text-indigo-300">{stats.totalDreams}개</span></div>
          <div>이번 달: <span className="font-semibold text-purple-600 dark:text-purple-300">{stats.thisMonth}개</span></div>
          <div>루시드 드림: <span className="font-semibold text-orange-500 dark:text-orange-300">{stats.lucidDreams}개</span></div>
          <div>연속 기록: <span className="font-semibold text-green-600 dark:text-green-300">{stats.streak}일</span></div>
          {typeof stats.monthGoal === "number" && (
            <div>이번 달 목표: <span className="font-semibold text-gray-700 dark:text-gray-200">{stats.thisMonth}/{stats.monthGoal}</span></div>
          )}
        </div>
      </div>
      {/* 오늘의 정보 */}
      <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 shadow p-3 flex flex-col gap-1 min-h-[90px]">
        <div className="flex items-center gap-1 mb-1">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-gray-700 dark:text-gray-100 text-sm">오늘의 정보</span>
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-200">현재 시간: <span className="font-semibold">{currentTime.toLocaleTimeString("ko-KR")}</span></div>
        <div className="text-xs text-gray-700 dark:text-gray-200">오늘의 달: <span className="font-semibold text-indigo-500 dark:text-indigo-300">{getMoonPhase(currentTime)}</span></div>
        <div className="text-xs text-gray-700 dark:text-gray-200">자주 느끼는 감정: <span className="font-semibold text-pink-500 dark:text-pink-300">{stats.favoriteEmotion}</span></div>
        <div className="text-xs text-gray-700 dark:text-gray-200">AI 분석 가능한 꿈: <span className="font-semibold text-indigo-600 dark:text-indigo-300">{stats.totalDreams}</span></div>
      </div>
      {/* 오늘의 꿈 팁 */}
      <div className="rounded-xl bg-gradient-to-br from-purple-200 to-pink-200 dark:from-indigo-900/40 dark:to-pink-900/40 shadow p-3 flex flex-col gap-1 min-h-[90px]">
        <div className="flex items-center gap-1 mb-1">
          <Sparkles className="w-4 h-4 text-pink-500" />
          <span className="font-bold text-purple-700 dark:text-purple-200 text-sm">오늘의 꿈 팁</span>
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-200 mb-1">{dreamTip}</div>
        {onNextTip && (
          <button className="text-[10px] text-purple-500 dark:text-purple-300 underline hover:text-purple-700 dark:hover:text-purple-200" onClick={onNextTip}>✨ 새로운 팁 보기</button>
        )}
      </div>
    </div>
  )
}

function getMoonPhase(date: Date) {
  const phases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"]
  const day = date.getDate()
  return phases[day % 8]
} 