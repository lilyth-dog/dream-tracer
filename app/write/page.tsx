"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDreams } from "@/hooks/useDreams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Moon,
  CalendarIcon,
  ImagePlus,
  Save,
  FileText,
  Smile,
  Frown,
  Meh,
  Zap,
  Star,
  X,
  ArrowLeft,
  Sparkles,
  Eye,
  Brain,
  Wand2,
  CheckCircle,
  Mic,
  MicOff,
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default function WriteDreamPage() {
  const router = useRouter()
  const { addDream } = useDreams()
  const [saving, setSaving] = useState(false)
  const [dreamData, setDreamData] = useState({
    title: "",
    content: "",
    date: new Date(),
    emotion: "",
    tags: [] as string[],
    vividness: [3],
    isLucid: false,
    sleepQuality: "",
    dreamType: "",
  })

  const [newTag, setNewTag] = useState("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [completionScore, setCompletionScore] = useState(0)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showAiHelp, setShowAiHelp] = useState(false)

  // 음성 입력 & AI 보조 상태
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported =
        // @ts-expect-error - webkitSpeechRecognition는 브라우저 벤더 프리픽스 API
        !!(window.webkitSpeechRecognition || (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition)
      setIsSpeechSupported(supported)
    }
  }, [])

  const startVoiceInput = () => {
    if (!isSpeechSupported) {
      alert("이 브라우저에서는 음성 인식을 지원하지 않습니다.")
      return
    }
    try {
      // @ts-expect-error - webkitSpeechRecognition는 런타임에서만 존재
      const SR = window.webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SR()
      recognition.lang = "ko-KR"
      recognition.interimResults = true
      recognition.continuous = true
      recognition.onresult = (event: any) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setDreamData((prev) => ({ ...prev, content: (prev.content + " " + transcript).trim() }))
        }
      }
      recognition.onerror = () => {
        setIsRecording(false)
      }
      recognition.onend = () => {
        setIsRecording(false)
      }
      recognitionRef.current = recognition
      setIsRecording(true)
      recognition.start()
    } catch (err) {
      console.error("Speech start error", err)
      setIsRecording(false)
    }
  }

  const stopVoiceInput = () => {
    try {
      const r = recognitionRef.current
      if (r) r.stop()
    } catch (err) {
      console.error("Speech stop error", err)
    } finally {
      setIsRecording(false)
    }
  }

  const rewriteWithAI = async (mode: "rewrite" | "expand" | "draft") => {
    if (mode !== "draft" && !dreamData.content) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          content: dreamData.content,
          context: {
            title: dreamData.title,
            emotion: dreamData.emotion,
            dreamType: dreamData.dreamType,
            tags: dreamData.tags,
          },
        }),
      })
      const data = await res.json()
      if (data?.text) {
        setDreamData((prev) => ({
          ...prev,
          content:
            mode === "draft"
              ? (prev.content ? prev.content + "\n\n" : "") + data.text
              : data.text,
        }))
      } else {
        alert("AI 처리에 실패했습니다.")
      }
    } catch (error) {
      console.error("AI rewrite error", error)
      alert("AI 처리 중 오류가 발생했습니다.")
    } finally {
      setAiLoading(false)
    }
  }

  const emotions = [
    { value: "joy", label: "기쁨", icon: Smile, color: "text-yellow-500", bg: "bg-yellow-50" },
    { value: "peace", label: "평온", icon: Meh, color: "text-blue-500", bg: "bg-blue-50" },
    { value: "fear", label: "두려움", icon: Frown, color: "text-red-500", bg: "bg-red-50" },
    { value: "sadness", label: "슬픔", icon: Frown, color: "text-gray-500", bg: "bg-gray-50" },
    { value: "excitement", label: "흥분", icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
    { value: "wonder", label: "경이", icon: Star, color: "text-purple-500", bg: "bg-purple-50" },
  ]

  const dreamTypes = [
    { value: "normal", label: "일반적인 꿈", emoji: "😴" },
    { value: "nightmare", label: "악몽", emoji: "😰" },
    { value: "lucid", label: "루시드 드림", emoji: "✨" },
    { value: "recurring", label: "반복되는 꿈", emoji: "🔄" },
    { value: "prophetic", label: "예지몽", emoji: "🔮" },
    { value: "healing", label: "치유의 꿈", emoji: "🌸" },
  ]

  const sleepQualities = [
    { value: "excellent", label: "매우 좋음", emoji: "😴" },
    { value: "good", label: "좋음", emoji: "😊" },
    { value: "fair", label: "보통", emoji: "😐" },
    { value: "poor", label: "나쁨", emoji: "😔" },
    { value: "terrible", label: "매우 나쁨", emoji: "😵" },
  ]

  const suggestedTags = [
    "비행",
    "바다",
    "가족",
    "학교",
    "동물",
    "음식",
    "자연",
    "도시",
    "과거",
    "미래",
    "친구",
    "모험",
    "집",
    "여행",
    "색깔",
    "음악",
    "춤",
    "운동",
    "책",
    "영화",
  ]

  // 완성도 계산
  useEffect(() => {
    let score = 0
    if (dreamData.title) score += 20
    if (dreamData.content) score += 30
    if (dreamData.emotion) score += 15
    if (dreamData.dreamType) score += 10
    if (dreamData.sleepQuality) score += 10
    if (dreamData.tags.length > 0) score += 10
    if (uploadedImages.length > 0) score += 5
    setCompletionScore(score)
  }, [dreamData, uploadedImages])

  // AI 제안 생성
  const generateAiSuggestions = async () => {
    if (!dreamData.content) return

    setShowAiHelp(true)
    // 실제로는 AI API 호출
    setTimeout(() => {
      const suggestions = [
        "꿈에서 느낀 감정을 더 자세히 설명해보세요",
        "꿈 속 색깔이나 소리도 기록해보면 좋겠어요",
        "다른 사람들과의 대화 내용도 중요한 단서가 될 수 있어요",
        "꿈의 시작과 끝 부분을 더 구체적으로 적어보세요",
      ]
      setAiSuggestions(suggestions)
    }, 1000)
  }

  const addTag = () => {
    if (newTag.trim() && !dreamData.tags.includes(newTag.trim())) {
      setDreamData({
        ...dreamData,
        tags: [...dreamData.tags, newTag.trim()],
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setDreamData({
      ...dreamData,
      tags: dreamData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const addSuggestedTag = (tag: string) => {
    if (!dreamData.tags.includes(tag)) {
      setDreamData({
        ...dreamData,
        tags: [...dreamData.tags, tag],
      })
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setUploadedImages([...uploadedImages, ...newImages])
    }
  }

  const handleSave = async () => {
    if (!dreamData.title || !dreamData.content) {
      alert("제목과 내용을 입력해주세요.")
      return
    }

    setSaving(true)
    try {
      await addDream({
        title: dreamData.title,
        content: dreamData.content,
        date: dreamData.date,
        emotion: dreamData.emotion,
        tags: dreamData.tags,
        vividness: dreamData.vividness[0],
        isLucid: dreamData.isLucid,
        sleepQuality: dreamData.sleepQuality,
        dreamType: dreamData.dreamType,
        images: uploadedImages,
      })

      // 성공 애니메이션
      alert("꿈 일기가 저장되었습니다! ✨")
      router.push("/")
    } catch (error) {
      console.error("Save error:", error)
      alert("저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  const handleDraft = () => {
    localStorage.setItem("dreamDraft", JSON.stringify(dreamData))
    alert("임시저장되었습니다!")
  }

  // 임시저장된 데이터 불러오기
  useEffect(() => {
    const draft = localStorage.getItem("dreamDraft")
    if (draft) {
      const parsedDraft = JSON.parse(draft)
      setDreamData({ ...parsedDraft, date: new Date(parsedDraft.date) })
    }
  }, [])

  return (
    <div className="min-h-screen dreamy-bg pt-20 pb-28">
      <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="details">세부사항</TabsTrigger>
                <TabsTrigger value="media">미디어</TabsTrigger>
                <TabsTrigger value="ai">AI 도움</TabsTrigger>
              </TabsList>

              {/* 기본 정보 탭 */}
              <TabsContent value="basic" className="space-y-6">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      기본 정보
                    </CardTitle>
                    <CardDescription>꿈의 기본적인 정보를 입력해주세요</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">꿈의 제목 *</Label>
                      <Input
                        id="title"
                        placeholder="예: 하늘을 나는 꿈"
                        value={dreamData.title}
                        onChange={(e) => setDreamData({ ...dreamData, title: e.target.value })}
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>꿈을 꾼 날짜</Label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(dreamData.date, "PPP", { locale: ko })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dreamData.date}
                            onSelect={(date) => {
                              if (date) {
                                setDreamData({ ...dreamData, date })
                                setIsCalendarOpen(false)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">꿈의 내용 *</Label>
                      <Textarea
                        id="content"
                        placeholder="꿈의 내용을 자세히 적어주세요. 장소, 인물, 상황, 느낌 등을 포함해서 작성하면 더 좋습니다..."
                        className="min-h-[200px] text-base leading-relaxed"
                        value={dreamData.content}
                        onChange={(e) => setDreamData({ ...dreamData, content: e.target.value })}
                      />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                      <span>{dreamData.content.length}자</span>
                      <div className="flex gap-2">
                        {isSpeechSupported && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={isRecording ? stopVoiceInput : startVoiceInput}
                          >
                            {isRecording ? (
                              <>
                                <MicOff className="h-4 w-4 mr-1" /> 녹음 중지
                              </>
                            ) : (
                              <>
                                <Mic className="h-4 w-4 mr-1" /> 음성 입력
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generateAiSuggestions}
                          disabled={!dreamData.content}
                        >
                          <Brain className="h-4 w-4 mr-1" />
                          AI 도움받기
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => rewriteWithAI("rewrite")}
                          disabled={!dreamData.content || aiLoading}
                        >
                          <Wand2 className="h-4 w-4 mr-1" /> AI로 정리
                        </Button>
                        {!dreamData.content && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => rewriteWithAI("draft")}
                            disabled={aiLoading}
                          >
                            <Sparkles className="h-4 w-4 mr-1" /> AI 초안
                          </Button>
                        )}
                      </div>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 세부사항 탭 */}
              <TabsContent value="details" className="space-y-6">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      꿈의 세부사항
                    </CardTitle>
                    <CardDescription>꿈의 특성과 느낌을 기록해주세요</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 감정 선택 */}
                    <div className="space-y-3">
                      <Label>주된 감정</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {emotions.map((emotion) => {
                          const IconComponent = emotion.icon
                          const isSelected = dreamData.emotion === emotion.value
                          return (
                            <Button
                              key={emotion.value}
                              variant={isSelected ? "default" : "outline"}
                              className={`h-auto p-4 flex flex-col gap-2 ${isSelected ? "ring-2 ring-purple-300" : ""} ${emotion.bg} hover:${emotion.bg}`}
                              onClick={() => setDreamData({ ...dreamData, emotion: emotion.value })}
                            >
                              <IconComponent className={`h-6 w-6 ${emotion.color}`} />
                              <span className="text-sm font-medium">{emotion.label}</span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>

                    {/* 꿈 유형 */}
                    <div className="space-y-2">
                      <Label>꿈의 유형</Label>
                      <Select
                        value={dreamData.dreamType}
                        onValueChange={(value) => setDreamData({ ...dreamData, dreamType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="꿈의 유형을 선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {dreamTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <span>{type.emoji}</span>
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 생생함 */}
                    <div className="space-y-3">
                      <Label>꿈의 생생함 정도</Label>
                      <div className="px-3">
                        <Slider
                          value={dreamData.vividness}
                          onValueChange={(value) => setDreamData({ ...dreamData, vividness: value })}
                          max={5}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>흐릿함</span>
                          <span>매우 생생함</span>
                        </div>
                        <p className="text-center text-sm text-gray-600 mt-2">
                          현재: {dreamData.vividness[0]}/5
                          {dreamData.vividness[0] >= 4 && " ✨"}
                        </p>
                      </div>
                    </div>

                    {/* 루시드 드림 */}
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          루시드 드림 (자각몽)
                        </Label>
                        <p className="text-sm text-gray-500">꿈 속에서 꿈인 것을 알고 있었나요?</p>
                      </div>
                      <Switch
                        checked={dreamData.isLucid}
                        onCheckedChange={(checked) => setDreamData({ ...dreamData, isLucid: checked })}
                      />
                    </div>

                    {/* 수면의 질 */}
                    <div className="space-y-2">
                      <Label>수면의 질</Label>
                      <Select
                        value={dreamData.sleepQuality}
                        onValueChange={(value) => setDreamData({ ...dreamData, sleepQuality: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="수면의 질을 선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {sleepQualities.map((quality) => (
                            <SelectItem key={quality.value} value={quality.value}>
                              <div className="flex items-center gap-2">
                                <span>{quality.emoji}</span>
                                <span>{quality.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* 태그 */}
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle>태그</CardTitle>
                    <CardDescription>꿈과 관련된 키워드를 추가해주세요</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="태그 입력 (예: 비행, 바다, 가족)"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button onClick={addTag} variant="outline">
                        추가
                      </Button>
                    </div>

                    {/* 현재 태그들 */}
                    <div className="flex flex-wrap gap-2">
                      {dreamData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          {tag}
                          <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>

                    {/* 추천 태그 */}
                    <div className="space-y-2">
                      <Label className="text-sm">추천 태그</Label>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTags
                          .filter((tag) => !dreamData.tags.includes(tag))
                          .slice(0, 10)
                          .map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-purple-50 hover:border-purple-300"
                              onClick={() => addSuggestedTag(tag)}
                            >
                              + {tag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 미디어 탭 */}
              <TabsContent value="media" className="space-y-6">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImagePlus className="h-5 w-5 text-green-600" />
                      이미지 업로드
                    </CardTitle>
                    <CardDescription>꿈과 관련된 이미지나 그림을 업로드해주세요</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <ImagePlus className="h-16 w-16 text-purple-400 mx-auto mb-4 float-animation" />
                          <p className="text-gray-600 text-lg mb-2">클릭하여 이미지를 업로드하세요</p>
                          <p className="text-sm text-gray-400">PNG, JPG, GIF 파일 지원 (최대 10MB)</p>
                        </label>
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {uploadedImages.map((image) => (
                            <div key={image.url || image.name} className="relative group">
                              <img
                                src={image.url}
                                alt={`업로드된 이미지 ${image.name || image.url}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setUploadedImages(uploadedImages.filter((img) => img.url !== image.url))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI 도움 탭 */}
              <TabsContent value="ai" className="space-y-6">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      AI 작성 도우미
                    </CardTitle>
                    <CardDescription>AI가 더 나은 꿈 일기 작성을 도와드립니다</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Button
                        onClick={generateAiSuggestions}
                        disabled={!dreamData.content || showAiHelp}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        AI 제안 받기
                      </Button>
                      <Button variant="outline">
                        <Sparkles className="h-4 w-4 mr-2" />
                        감정 분석
                      </Button>
                    </div>

                    {showAiHelp && (
                      <div className="space-y-4">
                        {aiSuggestions.length === 0 ? (
                          <div className="text-center py-8">
                            <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
                            <p className="text-gray-600">AI가 분석하고 있습니다...</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <h4 className="font-medium text-purple-800">AI 제안사항</h4>
                            {aiSuggestions.map((suggestion) => (
                              <div key={suggestion.text || suggestion} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-purple-800">{suggestion}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          {/* Sidebar: 진행도+팁+저장버튼, lg 이상에서만 스크롤 */}
          <div className="hidden lg:flex flex-col gap-6 max-h-[calc(100vh-120px)] overflow-y-auto sticky top-24">
            {/* 진행도 */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  작성 진행도
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{completionScore}%</div>
                  <Progress value={completionScore} className="h-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>제목</span>
                    <span className={dreamData.title ? "text-green-600" : "text-gray-400"}>
                      {dreamData.title ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>내용</span>
                    <span className={dreamData.content ? "text-green-600" : "text-gray-400"}>
                      {dreamData.content ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>감정</span>
                    <span className={dreamData.emotion ? "text-green-600" : "text-gray-400"}>
                      {dreamData.emotion ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>꿈 유형</span>
                    <span className={dreamData.dreamType ? "text-green-600" : "text-gray-400"}>
                      {dreamData.dreamType ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>태그</span>
                    <span className={dreamData.tags.length > 0 ? "text-green-600" : "text-gray-400"}>
                      {dreamData.tags.length > 0 ? "✓" : "○"}
                    </span>
                  </div>
                </div>

                {completionScore >= 80 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">완성도가 높아요!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* 작성 팁 */}
            <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  작성 팁
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-purple-700 space-y-2">
                  <p>• 꿈에서 본 색깔, 소리, 냄새도 기록해보세요</p>
                  <p>• 꿈 속 인물들과의 대화 내용도 중요합니다</p>
                  <p>• 꿈에서 느낀 감정을 구체적으로 표현해보세요</p>
                  <p>• 현실과 다른 점들을 특별히 기록해두세요</p>
                </div>
              </CardContent>
            </Card>
            {/* 저장/임시저장 버튼 */}
            <Card className="glass-effect">
              <CardContent className="p-4 space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || !dreamData.title || !dreamData.content}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      저장하기
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleDraft} className="w-full bg-transparent" disabled={saving}>
                  <FileText className="h-4 w-4 mr-2" />
                  임시저장
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Mobile Save Bar (always visible on /write) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-[60] pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="container mx-auto max-w-6xl">
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving || !dreamData.title || !dreamData.content}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    저장하기
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleDraft} disabled={saving} aria-label="임시저장">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
