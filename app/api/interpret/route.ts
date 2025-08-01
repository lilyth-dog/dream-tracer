// Hugging Face Inference API로 AI 꿈 해석 (예시)
export async function POST(request: Request) {
  try {
    const { title, content, emotion, tags, isLucid } = await request.json()

    const prompt = `다음은 사용자가 기록한 꿈입니다. 이 꿈을 심리학적, 상징적 관점에서 해석해주세요.\n\n꿈의 제목: ${title}\n꿈의 내용: ${content}\n주된 감정: ${emotion}\n태그: ${tags.join(", ")}\n루시드 드림 여부: ${isLucid ? "예" : "아니오"}\n\n다음 관점에서 해석해주세요:\n1. 꿈의 상징적 의미\n2. 심리적 상태 분석\n3. 현실과의 연관성\n4. 개인적 성장에 대한 시사점\n\n한국어로 친근하고 이해하기 쉽게 설명해주세요. 약 200-300자 정도로 작성해주세요.`

    // Hugging Face Inference API 호출
    const HF_API_TOKEN = process.env.HUGGINGFACE_API_KEY
    const HF_MODEL = "HuggingFaceH4/zephyr-7b-beta" // 예시: 무료/퍼블릭 모델
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
    // 모델에 따라 응답 구조가 다를 수 있음
    const text = data[0]?.generated_text || data.generated_text || data[0]?.text || "AI 해석 결과 없음"
    return Response.json({ interpretation: text })
  } catch (error) {
    console.error("HuggingFace interpretation error:", error)
    return Response.json({ error: "AI 해석 생성에 실패했습니다." }, { status: 500 })
  }
}
