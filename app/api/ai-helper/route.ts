// /api/ai-helper/route.ts
export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY
    const HF_MODEL = "HuggingFaceH4/zephyr-7b-beta"

    // 데모/로컬 환경에서 키가 없을 경우 친절한 더미 응답 반환
    if (!HF_API_TOKEN) {
      const demoAnswer = `데모 모드 응답입니다. 질문: "${message}"\n\n- 꿈 기록 팁: 깨어난 직후 빠르게 핵심을 적어두면 기억이 오래갑니다.\n- 감정, 색, 소리 등 감각 요소를 함께 기록해 보세요.`
      return Response.json({ answer: demoAnswer })
    }

    const prompt = `다음은 꿈 일기 앱의 AI 도우미입니다. 사용자의 질문에 친절하게 답변하세요.\n\n질문: ${message}`
    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      }
    )
    if (!response.ok) throw new Error("HuggingFace API 호출 실패")
    const data = await response.json()
    const text = data[0]?.generated_text ?? data.generated_text ?? data[0]?.text ?? "AI 답변 없음"
    return Response.json({ answer: text })
  } catch (error) {
    console.error("AI helper error:", error)
    return Response.json({ answer: "AI 답변 생성에 실패했습니다." }, { status: 500 })
  }
}
