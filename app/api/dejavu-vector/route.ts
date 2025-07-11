import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-ant-api03—szzc9O0UVkk9yoRfWKd6OQ250jDGRystPJ4C1TxSpx3t6i-4Zr0YxFNxlkHA5XMH8Ov3QR40n9XoqDJkFYNnA-2chRvQAA';

// 코사인 유사도 계산
function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (normA * normB);
}

export async function POST(req: NextRequest) {
  const { dreams, realEvent, topN = 3 } = await req.json();
  if (!dreams || !realEvent) {
    return NextResponse.json({ error: '꿈 목록과 현실 사건이 필요합니다.' }, { status: 400 });
  }

  // 1. 꿈/현실 사건 임베딩 생성
  const texts = [realEvent, ...dreams.map((d: any) => `${d.title}: ${d.content}`)];
  const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: texts,
    })
  });
  const embeddingData = await embeddingRes.json();
  if (!embeddingData.data) {
    return NextResponse.json({ error: '임베딩 생성 실패', detail: embeddingData }, { status: 500 });
  }
  const [realEventVec, ...dreamVecs] = embeddingData.data.map((d: any) => d.embedding);

  // 2. 코사인 유사도 계산
  const scored = dreams.map((d: any, i: number) => ({
    ...d,
    matchScore: Math.round(cosineSimilarity(realEventVec, dreamVecs[i]) * 100),
  }));
  scored.sort((a, b) => b.matchScore - a.matchScore);
  const topMatches = scored.slice(0, topN);

  // 3. Claude로 자연어 해설 생성
  const explainPrompt = `현실 사건: ${realEvent}\n\n아래는 유사도가 높은 꿈 목록입니다. 각 꿈이 왜 현실 사건과 유사한지, DreamMatch[] 타입의 aiAnalysis 필드를 자연어로 채워서 반환하세요.\n\n${topMatches.map((m, i) => `(${i+1}) 제목: ${m.title}\n내용: ${m.content}\n유사도: ${m.matchScore}%`).join("\n\n")}\n\nDreamMatch[] 예시: [ { id: '1', dreamTitle: '하늘을 나는 꿈', dreamDate: '2024-01-15', matchScore: 92, matchedElements: ['비슷한 장소', '비슷한 인물'], aiAnalysis: '...분석...' } ]\n\n반드시 JSON 배열만 반환하세요.`;
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: explainPrompt }
      ]
    })
  });
  const claudeData = await claudeRes.json();
  let resultArr = [];
  try {
    resultArr = JSON.parse(claudeData.content?.[0]?.text || claudeData.completion || '[]');
  } catch {
    resultArr = topMatches;
  }
  return NextResponse.json({ result: resultArr });
}
