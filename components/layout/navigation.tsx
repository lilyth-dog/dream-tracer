import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, BookOpen, Users, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const navItems = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/write", icon: PlusCircle, labelKey: "write" },
  { href: "/dreams", icon: BookOpen, labelKey: "dreamList" },
  { href: "/community", icon: Users, labelKey: "community" },
  { href: "/stats", icon: BarChart3, labelKey: "stats" },
];

export function Navigation() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 py-1 flex justify-between md:hidden shadow overflow-x-hidden">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className="flex-1">
            <button
              className={`flex flex-col items-center justify-center w-full py-1.5 min-w-0 ${isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-600 dark:text-gray-300"}`}
            >
              <IconComponent className="h-6 w-6 mb-0.5 flex-shrink-0" />
              <span className="text-[11px] leading-none max-w-[56px] truncate">{t(`nav.${item.labelKey || item.label}`)}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
