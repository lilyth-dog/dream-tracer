"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDreams } from "@/hooks/useDreams"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Moon,
  Search,
  Calendar,
  Heart,
  Eye,
  Sparkles,
  ImageIcon,
  Plus,
  ArrowLeft,
  Filter,
  SortAsc,
  Grid,
  List,
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

export default function DreamsListPage() {
  const router = useRouter()
  const { dreams, loading } = useDreams()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEmotion, setFilterEmotion] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const emotions = [
    { value: "all", label: "모든 감정" },
    { value: "joy", label: "기쁨" },
    { value: "peace", label: "평온" },
    { value: "fear", label: "두려움" },
    { value: "sadness", label: "슬픔" },
    { value: "excitement", label: "흥분" },
    { value: "wonder", label: "경이" },
  ]

  const dreamTypes = [
    { value: "all", label: "모든 유형" },
    { value: "normal", label: "일반적인 꿈" },
    { value: "nightmare", label: "악몽" },
    { value: "lucid", label: "루시드 드림" },
    { value: "recurring", label: "반복되는 꿈" },
    { value: "prophetic", label: "예지몽" },
    { value: "healing", label: "치유의 꿈" },
  ]

  const sortOptions = [
    { value: "date", label: "날짜순" },
    { value: "title", label: "제목순" },
    { value: "vividness", label: "생생함순" },
    { value: "emotion", label: "감정순" },
  ]

  // 모든 태그 추출
  const allTags = Array.from(new Set(dreams.flatMap((dream) => dream.tags)))

  // 꿈 일기 작성 날짜 모음 (중복 제거)
  const dreamDates = Array.from(
    new Set(
      dreams.map((d) => {
        const date = new Date(d.date)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
    )
  ).map((ts) => new Date(ts))

  const filteredDreams = dreams
    .filter((dream) => {
      const matchesSearch =
        dream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dream.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dream.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesEmotion = filterEmotion === "all" || dream.emotion === filterEmotion
      const matchesType = filterType === "all" || dream.dreamType === filterType
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => dream.tags.includes(tag))

      return matchesSearch && matchesEmotion && matchesType && matchesTags
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "vividness":
          return b.vividness - a.vividness
        case "emotion":
          return a.emotion.localeCompare(b.emotion)
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  if (loading) {
    return (
      <div className="min-h-screen dreamy-bg flex items-center justify-center">
        <div className="text-center">
          <Moon className="h-12 w-12 text-indigo-600 animate-pulse mx-auto mb-4 float-animation" />
          <p className="text-gray-600">꿈들을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dreamy-bg">
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* 검색 및 필터 */}
        <Card className="mb-8 glass-effect">
          <CardContent className="p-6">
            <Tabs defaultValue="search" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="search">검색</TabsTrigger>
                <TabsTrigger value="filter">필터</TabsTrigger>
                <TabsTrigger value="tags">태그</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="꿈 제목, 내용, 태그로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-48">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="filter" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">감정</label>
                    <Select value={filterEmotion} onValueChange={setFilterEmotion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {emotions.map((emotion) => (
                          <SelectItem key={emotion.value} value={emotion.value}>
                            {emotion.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">꿈 유형</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dreamTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tags" className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">태그로 필터링</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 20).map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-purple-100 transition-colors"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">선택된 태그:</span>
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => toggleTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])}>
                        모두 해제
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 달력과 최근 꿈 일기 리스트를 2단 레이아웃으로 배치 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* 달력 카드 - 왼쪽 */}
          <Card className="glass-effect w-full max-w-md mx-auto text-base">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                꿈 일기 달력
              </CardTitle>
              <CardDescription>꿈을 기록한 날짜를 한눈에 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="multiple"
                selected={dreamDates}
                showOutsideDays
                className="rounded-md border text-base"
                disabled={() => true}
              />
            </CardContent>
          </Card>
          {/* 최근 꿈 일기 리스트 - 오른쪽 */}
          <Card className="glass-effect w-full">
            <CardHeader>
              <CardTitle>최근 꿈 일기</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDreams.length === 0 ? (
                <div className="text-gray-400 text-sm py-8 text-center">최근 꿈 일기가 없습니다.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredDreams.slice(0, 5).map((dream) => (
                    <li key={dream.id} className="py-3 cursor-pointer hover:bg-purple-50 px-2 rounded transition" onClick={() => router.push(`/dreams/${dream.id}`)}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-700 line-clamp-1">{dream.title}</span>
                        <span className="text-xs text-gray-400 ml-2">{format(new Date(dream.date), "yyyy.MM.dd", { locale: ko })}</span>
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2 mt-0.5">{dream.content}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 결과 요약 */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            총{" "}
            <span className="font-semibold text-purple-600">
              {filteredDreams.length}
            </span>
            개의 꿈을 찾았습니다
          </p>
          {(searchTerm || filterEmotion !== "all" || filterType !== "all" || selectedTags.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setFilterEmotion("all")
                setFilterType("all")
                setSelectedTags([])
              }}
            >
              <Filter className="h-4 w-4 mr-1" />
              필터 초기화
            </Button>
          )}
        </div>

        {/* 꿈 목록 */}
        {filteredDreams.length === 0 ? (
          <Card className="text-center py-12 glass-effect">
            <CardContent>
              <Moon className="h-16 w-16 text-gray-300 mx-auto mb-4 float-animation" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">꿈이 없습니다</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterEmotion !== "all" || filterType !== "all" || selectedTags.length > 0
                  ? "검색 조건에 맞는 꿈을 찾을 수 없습니다."
                  : "아직 기록된 꿈이 없습니다. 첫 번째 꿈을 기록해보세요!"}
              </p>
              <Button onClick={() => router.push("/write")}>
                <Plus className="h-4 w-4 mr-2" />첫 꿈 기록하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredDreams.map((dream) => (
              <Card
                key={dream.id}
                className={`hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-102 glass-effect ${
                  viewMode === "list" ? "flex" : ""
                }`}
                onClick={() => router.push(`/dreams/${dream.id}`)}
              >
                {viewMode === "grid" ? (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{dream.title}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {dream.images.length > 0 && <ImageIcon className="h-4 w-4" />}
                          {dream.isLucid && <Sparkles className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(dream.date), "PPP", { locale: ko })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 line-clamp-3 mb-4">{dream.content}</p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {emotions.find((e) => e.value === dream.emotion)?.label || dream.emotion}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Eye className="h-4 w-4" />
                            {dream.vividness}/5
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {dream.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {dream.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{dream.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex w-full">
                    <CardContent className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold">{dream.title}</h3>
                        <div className="flex items-center gap-2">
                          {dream.images.length > 0 && <ImageIcon className="h-4 w-4 text-gray-400" />}
                          {dream.isLucid && <Sparkles className="h-4 w-4 text-yellow-500" />}
                          <span className="text-sm text-gray-500">
                            {format(new Date(dream.date), "MM/dd", { locale: ko })}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-2 mb-3">{dream.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {emotions.find((e) => e.value === dream.emotion)?.label || dream.emotion}
                          </Badge>
                          {dream.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Eye className="h-4 w-4" />
                          {dream.vividness}/5
                        </div>
                      </div>
                    </CardContent>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
