// 꿈 시각화 페이지
"use client"

import { useState } from "react"
import { useDreams } from "@/hooks/useDreams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, ArrowLeft, Wand2, Download, Share2, Sparkles, ImageIcon, Loader2, Star } from "lucide-react"
import Link from "next/link"

interface GeneratedImage {
  id: string
  dreamId: string
  dreamTitle: string
  prompt: string
  imageUrl: string
  style: string
  createdAt: Date
}

export default function VisualizePage() {
  const { dreams } = useDreams()
  const [selectedDream, setSelectedDream] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("realistic")
  const [generating, setGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [progress, setProgress] = useState(0)

  const imageStyles = [
    { value: "realistic", label: "사실적", description: "실제 사진처럼 생생한 이미지" },
    { value: "artistic", label: "예술적", description: "회화 같은 아름다운 스타일" },
    { value: "dreamy", label: "몽환적", description: "꿈같이 부드럽고 신비로운 느낌" },
    { value: "fantasy", label: "판타지", description: "마법적이고 환상적인 세계" },
    { value: "minimalist", label: "미니멀", description: "간결하고 깔끔한 스타일" },
    { value: "surreal", label: "초현실주의", description: "달리 같은 초현실적 표현" },
  ]

  // 샘플 생성된 이미지들
  const sampleImages: GeneratedImage[] = [
    {
      id: "1",
      dreamId: "1",
      dreamTitle: "하늘을 나는 꿈",
      prompt: "구름 위를 자유롭게 날아다니는 사람, 푸른 하늘, 바람, 평화로운 분위기",
      imageUrl: "/placeholder.svg?height=400&width=400",
      style: "dreamy",
      createdAt: new Date(),
    },
    {
      id: "2",
      dreamId: "2",
      dreamTitle: "바다 속 여행",
      prompt: "깊은 바다 속, 형형색색의 물고기들, 산호초, 신비로운 수중 세계",
      imageUrl: "/placeholder.svg?height=400&width=400",
      style: "fantasy",
      createdAt: new Date(),
    },
  ]

  const selectedDreamData = dreams.find((dream) => dream.id === selectedDream)

  const generateImage = async () => {
    if (!selectedDream && !customPrompt) {
      alert("꿈을 선택하거나 직접 설명을 입력해주세요.")
      return
    }

    setGenerating(true)
    setProgress(0)

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, 500)

    try {
      const prompt = customPrompt || `${selectedDreamData?.title}: ${selectedDreamData?.content.slice(0, 200)}`
      // OpenAI DALL·E 3 이미지 생성 API 호출
      const res = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: selectedStyle })
      })
      const data = await res.json()
      if (!data.imageUrl) throw new Error("이미지 생성 실패")
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        dreamId: selectedDream,
        dreamTitle: selectedDreamData?.title || "커스텀 꿈",
        prompt,
        imageUrl: data.imageUrl,
        style: selectedStyle,
        createdAt: new Date(),
      }
      setGeneratedImages((prev) => [newImage, ...prev])
      alert("이미지가 성공적으로 생성되었습니다!")
    } catch (error) {
      console.error("Image generation error:", error)
      alert("이미지 생성에 실패했습니다.")
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  const downloadImage = (imageUrl: string, title: string) => {
    // 실제 구현에서는 이미지 다운로드 기능
    alert(`"${title}" 이미지 다운로드 기능이 곧 제공됩니다.`)
  }

  const shareImage = (image: GeneratedImage) => {
    // 실제 구현에서는 소셜 공유 기능
    alert(`"${image.dreamTitle}" 이미지 공유 기능이 곧 제공됩니다.`)
  }

  return (
    <div className="min-h-screen dreamy-bg pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 소개 섹션 */}
        <Card className="mb-8 bg-gradient-to-r from-pink-100 to-purple-100 border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Wand2 className="h-12 w-12 text-pink-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-pink-800 mb-2">AI 꿈 시각화</h2>
                <p className="text-pink-700 mb-4">
                  인공지능이 당신의 꿈을 아름다운 이미지로 변환해드립니다. 꿈 속 장면을 다양한 스타일로 시각화하여 꿈의
                  기억을 더욱 생생하게 보존하세요.
                </p>
                <div className="flex items-center gap-4 text-sm text-pink-600">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>생성 가능한 꿈: {dreams.length}개</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    <span>생성된 이미지: {generatedImages.length + sampleImages.length}개</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 이미지 생성 설정 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-purple-600" />
                  이미지 생성
                </CardTitle>
                <CardDescription>꿈을 선택하거나 직접 설명을 입력하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 꿈 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">꿈 선택</label>
                  <Select value={selectedDream} onValueChange={setSelectedDream}>
                    <SelectTrigger>
                      <SelectValue placeholder="시각화할 꿈을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {dreams.map((dream) => (
                        <SelectItem key={dream.id} value={dream.id}>
                          {dream.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 선택된 꿈 미리보기 */}
                {selectedDreamData && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">{selectedDreamData.title}</h4>
                    <p className="text-sm text-blue-700 line-clamp-3">{selectedDreamData.content}</p>
                  </div>
                )}

                {/* 커스텀 프롬프트 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">또는 직접 설명 입력</label>
                  <Textarea
                    placeholder="꿈의 장면을 자세히 설명해주세요..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* 스타일 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">이미지 스타일</label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {imageStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-xs text-gray-500">{style.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 생성 버튼 */}
                <Button
                  onClick={generateImage}
                  disabled={generating || (!selectedDream && !customPrompt)}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      이미지 생성
                    </>
                  )}
                </Button>

                {/* 생성 진행률 */}
                {generating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>생성 진행률</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 생성된 이미지 갤러리 */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="generated" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generated">생성된 이미지</TabsTrigger>
                <TabsTrigger value="gallery">갤러리</TabsTrigger>
              </TabsList>

              <TabsContent value="generated" className="space-y-6">
                {generatedImages.length === 0 && !generating && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">생성된 이미지가 없습니다</h3>
                      <p className="text-gray-500 mb-4">꿈을 선택하고 이미지를 생성해보세요!</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedImages.map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={image.imageUrl || "/placeholder.svg"}
                          alt={image.dreamTitle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-white/80 hover:bg-white"
                            onClick={() => downloadImage(image.imageUrl, image.dreamTitle)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-white/80 hover:bg-white"
                            onClick={() => shareImage(image)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{image.dreamTitle}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{image.prompt}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{imageStyles.find((s) => s.value === image.style)?.label}</Badge>
                          <span className="text-xs text-gray-500">{image.createdAt.toLocaleDateString("ko-KR")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sampleImages.map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={image.imageUrl || "/placeholder.svg"}
                          alt={image.dreamTitle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            샘플
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-white/80 hover:bg-white"
                            onClick={() => downloadImage(image.imageUrl, image.dreamTitle)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-white/80 hover:bg-white"
                            onClick={() => shareImage(image)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{image.dreamTitle}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{image.prompt}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{imageStyles.find((s) => s.value === image.style)?.label}</Badge>
                          <span className="text-xs text-gray-500">{image.createdAt.toLocaleDateString("ko-KR")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
