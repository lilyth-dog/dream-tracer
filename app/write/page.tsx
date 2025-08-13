"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { enUS, ko, ja, zhCN } from "date-fns/locale"
import { useTranslation } from 'react-i18next'

export default function WriteDreamPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const { dreams, addDream, updateDream } = useDreams()
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
  const [isEditMode, setIsEditMode] = useState(false)
  
  // 음성 인식 관련 state
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [isSupported, setIsSupported] = useState(false)

  const emotions = [
    { value: "joy", label: t('emotions.joy', '기쁨'), icon: Smile, color: "text-yellow-500", bg: "bg-yellow-50" },
    { value: "peace", label: t('emotions.peace', '평온'), icon: Meh, color: "text-blue-500", bg: "bg-blue-50" },
    { value: "fear", label: t('emotions.fear', '두려움'), icon: Frown, color: "text-red-500", bg: "bg-red-50" },
    { value: "sadness", label: t('emotions.sadness', '슬픔'), icon: Frown, color: "text-gray-500", bg: "bg-gray-50" },
    { value: "excitement", label: t('emotions.excitement', '흥분'), icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
    { value: "wonder", label: t('emotions.wonder', '경이'), icon: Star, color: "text-purple-500", bg: "bg-purple-50" },
  ]

  const dreamTypes = [
    { value: "normal", label: t('dreamTypes.normal', '일반적인 꿈'), emoji: "😴" },
    { value: "nightmare", label: t('dreamTypes.nightmare', '악몽'), emoji: "😰" },
    { value: "lucid", label: t('dreamTypes.lucid', '루시드 드림'), emoji: "✨" },
    { value: "recurring", label: t('dreamTypes.recurring', '반복되는 꿈'), emoji: "🔄" },
    { value: "prophetic", label: t('dreamTypes.prophetic', '예지몽'), emoji: "🔮" },
    { value: "healing", label: t('dreamTypes.healing', '치유의 꿈'), emoji: "🌸" },
  ]

  const sleepQualities = [
    { value: "excellent", label: t('sleepQualities.excellent', '매우 좋음'), emoji: "😴" },
    { value: "good", label: t('sleepQualities.good', '좋음'), emoji: "😊" },
    { value: "fair", label: t('sleepQualities.fair', '보통'), emoji: "😐" },
    { value: "poor", label: t('sleepQualities.poor', '나쁨'), emoji: "😔" },
    { value: "terrible", label: t('sleepQualities.terrible', '매우 나쁨'), emoji: "😵" },
  ]

  // 언어별 로케일 매핑 및 날짜/단위 포맷 유틸
  const getDateFnsLocale = () => {
    const lng = (i18n?.language || (typeof window !== 'undefined' ? (localStorage.getItem('lang') || 'ko') : 'ko')) as string
    switch (lng) {
      case 'en': return enUS
      case 'ja': return ja
      case 'zh': return zhCN
      default: return ko
    }
  }
  const dateLocale = getDateFnsLocale()
  const countSuffix = t('home.widgets.countSuffix', '개')

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

  // 음성 인식 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'ko-KR'
        
        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          if (finalTranscript) {
            setDreamData(prev => ({
              ...prev,
              content: prev.content + finalTranscript
            }))
          }
        }
        
        recognitionInstance.onerror = (event: any) => {
          console.error('음성 인식 오류:', event.error)
          setIsListening(false)
        }
        
        recognitionInstance.onend = () => {
          setIsListening(false)
        }
        
        setRecognition(recognitionInstance)
        setIsSupported(true)
      } else {
        setIsSupported(false)
      }
    }
  }, [])

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

  // 음성 인식 시작/중지
  const toggleVoiceRecognition = () => {
    if (!recognition || !isSupported) {
      alert(t('write.voice.notSupported', '이 브라우저에서는 음성 인식을 지원하지 않습니다.'))
      return
    }
    
    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      try {
        recognition.start()
        setIsListening(true)
      } catch (error) {
        console.error('음성 인식 시작 실패:', error)
        alert(t('write.voice.cannotStart', '음성 인식을 시작할 수 없습니다. 마이크 권한을 확인해주세요.'))
      }
    }
  }

  // AI 제안 생성
  const generateAiSuggestions = async () => {
    if (!dreamData.content) return

    setShowAiHelp(true)
    // 실제로는 AI API 호출
    setTimeout(() => {
      const suggestions = [
        t('write.tips.ai.1', '꿈에서 느낀 감정을 더 자세히 설명해보세요'),
        t('write.tips.ai.2', '꿈 속 색깔이나 소리도 기록해보면 좋겠어요'),
        t('write.tips.ai.3', '다른 사람들과의 대화 내용도 중요한 단서가 될 수 있어요'),
        t('write.tips.ai.4', '꿈의 시작과 끝 부분을 더 구체적으로 적어보세요'),
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
      alert(t('write.requiredFields', '제목과 내용을 입력해주세요.'))
      return
    }

    setSaving(true)
    try {
      if (isEditMode && editId) {
        await updateDream(editId, {
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
        alert(t('write.saveSuccessEdit', '꿈 일기가 수정되었습니다! ✨'))
      } else {
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
        alert(t('write.saveSuccess', '꿈 일기가 저장되었습니다! ✨'))
      }
      router.push("/")
    } catch (error) {
      console.error("Save error:", error)
      alert(t('common.saveFailed', '저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDraft = () => {
    localStorage.setItem("dreamDraft", JSON.stringify(dreamData))
    alert(t('write.draftSuccess', '임시저장되었습니다!'))
  }

  // 편집 모드/임시저장된 데이터 불러오기
  useEffect(() => {
    if (editId && dreams.length > 0) {
      const target = dreams.find((d) => d.id === editId)
      if (target) {
        setDreamData({
          title: target.title,
          content: target.content,
          date: new Date(target.date),
          emotion: target.emotion,
          tags: target.tags,
          vividness: [target.vividness],
          isLucid: target.isLucid,
          sleepQuality: target.sleepQuality,
          dreamType: target.dreamType,
        })
        setUploadedImages((target.images || []) as any)
        setIsEditMode(true)
      }
    } else {
      const draft = localStorage.getItem("dreamDraft")
      if (draft) {
        const parsedDraft = JSON.parse(draft)
        setDreamData({ ...parsedDraft, date: new Date(parsedDraft.date) })
      }
    }
  }, [editId, dreams])

  return (
    <div className="min-h-screen dreamy-bg pt-20">
      <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">{t('write.tabs.basic', '기본 정보')}</TabsTrigger>
                <TabsTrigger value="details">{t('write.tabs.details', '세부사항')}</TabsTrigger>
                <TabsTrigger value="media">{t('write.tabs.media', '미디어')}</TabsTrigger>
                <TabsTrigger value="ai">{t('write.tabs.ai', 'AI 도움')}</TabsTrigger>
              </TabsList>

              {/* 기본 정보 탭 */}
              <TabsContent value="basic" className="space-y-6">
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      {isEditMode ? t('write.basic.editTitle', '기본 정보 수정') : t('write.basic.title', '기본 정보')}
                    </CardTitle>
                    <CardDescription>{isEditMode ? t('write.basic.editDesc', '선택한 꿈의 정보를 수정하세요') : t('write.basic.desc', '꿈의 기본적인 정보를 입력해주세요')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">{t('write.fields.title.label', '꿈의 제목 *')}</Label>
                      <Input
                        id="title"
                        placeholder={t('write.fields.title.placeholder', '예: 하늘을 나는 꿈')}
                        value={dreamData.title}
                        onChange={(e) => setDreamData({ ...dreamData, title: e.target.value })}
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('write.fields.date.label', '꿈을 꾼 날짜')}</Label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(dreamData.date, "PPP", { locale: dateLocale })}
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
                      <Label htmlFor="content">{t('write.fields.content.label', '꿈의 내용 *')}</Label>
                      <div className="relative">
                        <Textarea
                          id="content"
                          placeholder={t('write.fields.content.placeholder', '꿈의 내용을 자세히 적어주세요. 장소, 인물, 상황, 느낌 등을 포함해서 작성하면 더 좋습니다...')}
                          className="min-h-[200px] text-base leading-relaxed pr-12"
                          value={dreamData.content}
                          onChange={(e) => setDreamData({ ...dreamData, content: e.target.value })}
                        />
                        {isSupported && (
                          <Button
                            type="button"
                            variant={isListening ? "destructive" : "outline"}
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={toggleVoiceRecognition}
                              title={isListening ? t('write.voice.stop', '음성 인식 중지') : t('write.voice.start', '음성으로 작성')}
                          >
                            {isListening ? (
                              <MicOff className="h-4 w-4" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-300">
                        <span>{t('write.content.charCount', '{{count}} chars', { count: dreamData.content.length })}</span>
                        <div className="flex items-center gap-2">
                          {isListening && (
                            <div className="flex items-center gap-1 text-red-500 animate-pulse">
                              <Mic className="h-3 w-3" />
                              <span>{t('write.voice.listening', '음성 인식 중...')}</span>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" onClick={generateAiSuggestions} disabled={!dreamData.content}>
                            <Brain className="h-4 w-4 mr-1" />
                            {t('write.ai.help', 'AI 도움받기')}
                          </Button>
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
                      {t('write.details.title', '꿈의 세부사항')}
                    </CardTitle>
                    <CardDescription>{t('write.details.desc', '꿈의 특성과 느낌을 기록해주세요')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 감정 선택 */}
                    <div className="space-y-3">
                      <Label>{t('write.details.emotion', '주된 감정')}</Label>
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
                      <Label>{t('write.details.dreamType', '꿈의 유형')}</Label>
                      <Select
                        value={dreamData.dreamType}
                        onValueChange={(value) => setDreamData({ ...dreamData, dreamType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('write.details.dreamTypePlaceholder', '꿈의 유형을 선택해주세요')} />
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
                      <Label>{t('write.details.vividness', '꿈의 생생함 정도')}</Label>
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
                          <span>{t('write.details.vividLow', '흐릿함')}</span>
                          <span>{t('write.details.vividHigh', '매우 생생함')}</span>
                        </div>
                        <p className="text-center text-sm text-gray-600 mt-2">
                          {t('write.details.current', '현재')}: {dreamData.vividness[0]}/5
                          {dreamData.vividness[0] >= 4 && " ✨"}
                        </p>
                      </div>
                    </div>

                    {/* 루시드 드림 */}
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          {t('write.details.lucid', '루시드 드림 (자각몽)')}
                        </Label>
                        <p className="text-sm text-gray-500">{t('write.details.lucidHint', '꿈 속에서 꿈인 것을 알고 있었나요?')}</p>
                      </div>
                      <Switch
                        checked={dreamData.isLucid}
                        onCheckedChange={(checked) => setDreamData({ ...dreamData, isLucid: checked })}
                      />
                    </div>

                    {/* 수면의 질 */}
                    <div className="space-y-2">
                      <Label>{t('write.details.sleepQuality', '수면의 질')}</Label>
                      <Select
                        value={dreamData.sleepQuality}
                        onValueChange={(value) => setDreamData({ ...dreamData, sleepQuality: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('write.details.sleepQualityPlaceholder', '수면의 질을 선택해주세요')} />
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
                    <CardTitle>{t('write.tags.title', '태그')}</CardTitle>
                    <CardDescription>{t('write.tags.desc', '꿈과 관련된 키워드를 추가해주세요')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('write.tags.placeholder', '태그 입력 (예: 비행, 바다, 가족)')}
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button onClick={addTag} variant="outline">
                        {t('write.tags.add', '추가')}
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
                      <Label className="text-sm">{t('write.tags.suggested', '추천 태그')}</Label>
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
                      {t('write.media.title', '이미지 업로드')}
                    </CardTitle>
                    <CardDescription>{t('write.media.desc', '꿈과 관련된 이미지나 그림을 업로드해주세요')}</CardDescription>
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
                          <p className="text-gray-600 text-lg mb-2">{t('write.media.cta', '클릭하여 이미지를 업로드하세요')}</p>
                          <p className="text-sm text-gray-400">{t('write.media.hint', 'PNG, JPG, GIF 파일 지원 (최대 10MB)')}</p>
                        </label>
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {uploadedImages.map((image) => (
                            <div key={image} className="relative group">
                              <img
                                src={image}
                                 alt={t('write.media.uploadedAlt', '업로드된 이미지')}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setUploadedImages(uploadedImages.filter((img) => img !== image))}
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
                      {t('write.ai.title', 'AI 작성 도우미')}
                    </CardTitle>
                    <CardDescription>{t('write.ai.desc', 'AI가 더 나은 꿈 일기 작성을 도와드립니다')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Button
                        onClick={generateAiSuggestions}
                        disabled={!dreamData.content || showAiHelp}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {t('write.ai.suggest', 'AI 제안 받기')}
                      </Button>
                      <Button variant="outline">
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t('write.ai.emotion', '감정 분석')}
                      </Button>
                    </div>

                    {showAiHelp && (
                      <div className="space-y-4">
                        {aiSuggestions.length === 0 ? (
                          <div className="text-center py-8">
                            <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
                            <p className="text-gray-600">{t('write.ai.analyzing', 'AI가 분석하고 있습니다...')}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <h4 className="font-medium text-purple-800">{t('write.ai.suggestions', 'AI 제안사항')}</h4>
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
                  {t('write.sidebar.progress', '작성 진행도')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{completionScore}%</div>
                  <Progress value={completionScore} className="h-3" />
                </div>

                <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                     <span>{t('write.sidebar.title', '제목')}</span>
                    <span className={dreamData.title ? "text-green-600" : "text-gray-400"}>
                      {dreamData.title ? (t('common.ok', '✓')) : (t('common.notOk', '○'))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span>{t('write.sidebar.content', '내용')}</span>
                     <span className={dreamData.content ? "text-green-600" : "text-gray-400"}>
                      {dreamData.content ? (t('common.ok', '✓')) : (t('common.notOk', '○'))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span>{t('write.sidebar.emotion', '감정')}</span>
                     <span className={dreamData.emotion ? "text-green-600" : "text-gray-400"}>
                      {dreamData.emotion ? (t('common.ok', '✓')) : (t('common.notOk', '○'))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span>{t('write.sidebar.dreamType', '꿈 유형')}</span>
                     <span className={dreamData.dreamType ? "text-green-600" : "text-gray-400"}>
                      {dreamData.dreamType ? (t('common.ok', '✓')) : (t('common.notOk', '○'))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span>{t('write.sidebar.tags', '태그')}</span>
                     <span className={dreamData.tags.length > 0 ? "text-green-600" : "text-gray-400"}>
                      {dreamData.tags.length > 0 ? (t('common.ok', '✓')) : (t('common.notOk', '○'))}
                    </span>
                  </div>
                </div>

                {completionScore >= 80 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{t('write.sidebar.high', '완성도가 높아요!')}</span>
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
                  {t('write.sidebar.tips', '작성 팁')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-purple-700 space-y-2">
                  <p>{t('write.tips.1', '• 꿈에서 본 색깔, 소리, 냄새도 기록해보세요')}</p>
                  <p>{t('write.tips.2', '• 꿈 속 인물들과의 대화 내용도 중요합니다')}</p>
                  <p>{t('write.tips.3', '• 꿈에서 느낀 감정을 구체적으로 표현해보세요')}</p>
                  <p>{t('write.tips.4', '• 현실과 다른 점들을 특별히 기록해두세요')}</p>
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
                      {t('write.save.saving', '저장 중...')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('write.save.submit', '저장하기')}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleDraft} className="w-full bg-transparent" disabled={saving}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t('write.save.draft', '임시저장')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Mobile Save Button - Only visible on small screens */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
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
                    {t('write.save.saving', '저장 중...')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('write.save.submit', '저장하기')}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleDraft} disabled={saving}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
