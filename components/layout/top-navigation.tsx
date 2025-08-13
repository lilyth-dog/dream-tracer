"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { Home, BookOpen, PlusCircle, BarChart3, User, Users, Brain, Palette, Bell, LogOut } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import LanguageSwitcher from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "react-i18next"

export default function TopNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()

  const navItems = [
    { href: "/", icon: Home, labelKey: "home" },
    { href: "/dreams", icon: BookOpen, labelKey: "dreamList" },
    { href: "/write", icon: PlusCircle, labelKey: "write" },
    { href: "/stats", icon: BarChart3, labelKey: "stats" },
    { href: "/community", icon: Users, labelKey: "community" },
    { href: "/dejavu", icon: Brain, labelKey: "dejavu" },
    { href: "/visualize", icon: Palette, labelKey: "visualize" },
  ]
  const defaultLabels: Record<string, string> = {
    home: '홈',
    dreamList: '꿈 목록',
    write: '꿈 기록하기',
    stats: '통계',
    community: '커뮤니티',
    dejavu: '데자뷰',
    visualize: '시각화',
    profile: '프로필',
  }

  const handleLogout = async () => {
    if (confirm(t('settings.logoutConfirm', '정말 로그아웃하시겠습니까?'))) {
      try {
        await signOut(auth)
        router.push("/")
      } catch (error) {
        alert(t('settings.logoutFailed', '로그아웃에 실패했습니다.'))
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 justify-between pointer-events-auto overflow-x-hidden">
      {/* 좌측: 로고 */}
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-500 dark:text-indigo-400">
        <span role="img" aria-label="moon">🌙</span> {t('app.title', '꿈결')}
      </Link>
      {/* 중앙: 주요 메뉴 */}
      <nav className="hidden md:flex flex-1 justify-center min-w-0">
        <NavigationMenu>
          <NavigationMenuList>
            {navItems.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.href
              return (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink active={isActive} className="flex items-center gap-1 px-4 py-2 text-base font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
                      <IconComponent className="w-5 h-5" />
                      {t(`nav.${item.labelKey}`, defaultLabels[item.labelKey] || item.labelKey)}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
      {/* 우측: 왼쪽에서 오른쪽으로 [언어 변경] [테마 토글] [알림] [로그아웃] [프로필] 순서 */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={t('notice.title', '알림')}
        >
          <Bell className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={t('common.logout', '로그아웃')}
          onClick={handleLogout}
        >
          <LogOut className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
        <Link href="/profile" className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{user?.displayName?.[0] || 'N'}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-base font-semibold text-gray-700 dark:text-gray-300">{t('nav.profile', defaultLabels.profile)}</span>
        </Link>
      </div>
    </header>
  )
} 