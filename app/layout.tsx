import type React from "react"
import type { Metadata } from "next"
import Client from "./client"

export const metadata: Metadata = {
  title: "꿈결 - 꿈을 기록하고 해석하세요",
  description: "AI와 함께하는 스마트한 꿈 일기장. 꿈을 기록하고, 분석하고, 해석해보세요.",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Client>{children}</Client>
}

import './globals.css'