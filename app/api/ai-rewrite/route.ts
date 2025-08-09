import { NextRequest, NextResponse } from "next/server"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { mode, content, context } = await req.json()

    // 데모/안전 가드
    if (!OPENAI_API_KEY) {
      // 간단한 로컬 모의 처리
      const fallback =
        mode === "draft"
          ? "방금 꾼 꿈을 떠올리며 간단히 메모하세요. 장소, 인물, 감정, 사건 순으로 적어보면 좋아요."
          : (content || "").trim().length > 0
            ? `요약/정리: ${content.slice(0, 200)} ...`
            : ""
      return NextResponse.json({ text: fallback })
    }

    const system =
      "당신은 꿈 일기 어시스턴트입니다. 사용자가 말한 내용을 자연스럽고 구체적인 한국어 문장으로 정리하거나, 빈 내용을 바탕으로 초안을 생성하세요. 과장 없이 담백하게, 그러나 생생한 감각(색, 소리, 냄새, 감정)을 살려주세요."

    const userPrompt =
      mode === "draft"
        ? `주제(제목: ${context?.title || ""}, 감정: ${context?.emotion || ""}, 유형: ${context?.dreamType || ""}, 태그: ${(context?.tags || []).join(", ")})를 바탕으로 한국어 꿈 일기 초안을 4-6문장으로 작성하세요.`
        : `아래 꿈 기록을 문맥을 해치지 않도록 자연스럽고 선명하게 다듬어 한국어로 재작성해 주세요. 내용 보강은 가능하나 허위 사실은 추가하지 마세요.

원문:
${content}`

    const completionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!completionRes.ok) {
      const detail = await completionRes.text()
      return NextResponse.json({ error: "AI 요청 실패", detail }, { status: 500 })
    }
    const json = await completionRes.json()
    const text = json?.choices?.[0]?.message?.content || ""
    return NextResponse.json({ text })
  } catch (error) {
    console.error("ai-rewrite error", error)
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}

