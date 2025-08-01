// 설정 페이지
"use client"

import { useState } from "react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Settings, Bell, Shield, Palette, Download, Trash2, LogOut, HelpCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    notifications: {
      dreamReminder: true,
      weeklyReport: true,
      aiInsights: true,
    },
    privacy: {
      dataCollection: true,
      analytics: false,
    },
    display: {
      darkMode: false,
      compactView: false,
    },
  })

  const handleLogout = async () => {
    if (confirm("정말 로그아웃하시겠습니까?")) {
      try {
        await signOut(auth)
      } catch (error) {
        console.error("Logout error:", error)
        alert("로그아웃에 실패했습니다.")
      }
    }
  }

  const handleDeleteAccount = () => {
    if (confirm("정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      alert("계정 삭제 기능은 곧 제공됩니다.")
    }
  }

  const handleExportData = () => {
    alert("데이터 내보내기 기능이 곧 제공됩니다.")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                알림 설정
              </CardTitle>
              <CardDescription>다양한 알림을 설정하여 꿈 기록을 놓치지 마세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>꿈 기록 리마인더</Label>
                  <p className="text-sm text-gray-500">매일 저녁 꿈 기록을 알려드립니다</p>
                </div>
                <Switch
                  checked={settings.notifications.dreamReminder}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, dreamReminder: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>주간 리포트</Label>
                  <p className="text-sm text-gray-500">일주일간의 꿈 패턴을 분석해드립니다</p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyReport}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, weeklyReport: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>AI 인사이트</Label>
                  <p className="text-sm text-gray-500">AI가 발견한 흥미로운 패턴을 알려드립니다</p>
                </div>
                <Switch
                  checked={settings.notifications.aiInsights}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, aiInsights: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                개인정보 및 보안
              </CardTitle>
              <CardDescription>개인정보 보호 및 데이터 사용에 대한 설정입니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>데이터 수집 동의</Label>
                  <p className="text-sm text-gray-500">서비스 개선을 위한 익명 데이터 수집</p>
                </div>
                <Switch
                  checked={settings.privacy.dataCollection}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, dataCollection: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>분석 데이터</Label>
                  <p className="text-sm text-gray-500">사용 패턴 분석을 위한 데이터 수집</p>
                </div>
                <Switch
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, analytics: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" />
                화면 설정
              </CardTitle>
              <CardDescription>앱의 외관과 표시 방식을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>다크 모드</Label>
                  <p className="text-sm text-gray-500">어두운 테마로 변경합니다</p>
                </div>
                <Switch
                  checked={settings.display.darkMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, darkMode: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>컴팩트 뷰</Label>
                  <p className="text-sm text-gray-500">더 많은 정보를 한 화면에 표시합니다</p>
                </div>
                <Switch
                  checked={settings.display.compactView}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, compactView: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>데이터 관리</CardTitle>
              <CardDescription>꿈 일기 데이터를 관리하고 백업할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={handleExportData} className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                모든 데이터 내보내기
              </Button>
              <p className="text-xs text-gray-500">모든 꿈 일기와 설정을 JSON 파일로 다운로드합니다</p>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>지원 및 도움말</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <HelpCircle className="h-4 w-4 mr-2" />
                도움말 센터
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Mail className="h-4 w-4 mr-2" />
                문의하기
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>계정 관리</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={handleLogout} className="w-full justify-start bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>

              <Separator />

              <div className="space-y-2">
                <Button variant="destructive" onClick={handleDeleteAccount} className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  계정 삭제
                </Button>
                <p className="text-xs text-gray-500">계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
