import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, BookOpen, Users, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/write", icon: PlusCircle, label: "작성" },
  { href: "/dreams", icon: BookOpen, label: "꿈 일기" },
  { href: "/community", icon: Users, label: "커뮤니티" },
  { href: "/stats", icon: BarChart3, label: "통계" },
];

export function Navigation() {
  const pathname = usePathname();
  const isWrite = pathname === "/write";
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 py-1 flex justify-between md:hidden shadow
      ${isWrite ? "hidden" : ""}
      `}
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className="flex-1">
            <button
              className={`flex flex-col items-center justify-center w-full py-1.5 ${isActive ? "text-indigo-600 font-bold" : "text-gray-500"}`}
            >
              <IconComponent className="h-6 w-6 mb-0.5" />
              <span className="text-xs leading-none">{item.label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
