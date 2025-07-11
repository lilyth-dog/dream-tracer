import Link from "next/link"
import { PlusCircle, BookOpen, Brain, Palette } from "lucide-react"

const features = [
  {
    href: "/write",
    icon: <PlusCircle className="w-7 h-7" />,
    title: "새 꿈 일기 작성",
    desc: "오늘의 꿈을 기록해보세요",
    color: "from-indigo-400 to-purple-400"
  },
  {
    href: "/dreams",
    icon: <BookOpen className="w-7 h-7" />,
    title: "꿈 일기 보기",
    desc: "지난 꿈들을 다시 살펴보세요",
    color: "from-pink-400 to-orange-300"
  },
  {
    href: "/dejavu",
    icon: <Brain className="w-7 h-7" />,
    title: "데자뷰 파인더",
    desc: "꿈의 패턴을 찾아보세요",
    color: "from-green-400 to-teal-400"
  },
  {
    href: "/visualize",
    icon: <Palette className="w-7 h-7" />,
    title: "꿈 시각화",
    desc: "새로 꿈을 그려보세요",
    color: "from-yellow-400 to-orange-400"
  },
]

export default function FeatureCards() {
  return (
    <>
      {features.map((f) => (
        <Link key={f.href} href={f.href} className={`group block rounded-xl p-3 bg-gradient-to-br ${f.color} shadow transition-transform hover:scale-105 focus:ring-2 focus:ring-indigo-400 outline-none min-h-[60px] min-w-0 w-full flex-1`} tabIndex={0}>
          <div className="flex items-center gap-2">
            <div className="bg-white/80 rounded-full p-2 shadow">
              {f.icon}
            </div>
            <div>
              <div className="text-base font-bold text-white drop-shadow mb-0.5">{f.title}</div>
              <div className="text-xs text-white/90">{f.desc}</div>
            </div>
          </div>
        </Link>
      ))}
    </>
  )
} 