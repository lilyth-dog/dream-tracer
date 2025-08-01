// /api/ai-helper/route.ts
export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY
    const HF_MODEL = "HuggingFaceH4/zephyr-7b-beta"
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
