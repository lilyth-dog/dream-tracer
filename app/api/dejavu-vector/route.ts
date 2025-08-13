import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function safeLower(s: string) {
  return (s || '').toLowerCase();
}

function tokenize(text: string): string[] {
  // 한글/영문/숫자만 남기고 공백 기준 분할, 짧은 토큰 제거
  const cleaned = safeLower(text).replace(/[^a-z0-9가-힣\s]/g, ' ');
  return cleaned
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 2048);
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i];
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) mean[i] += v[i];
  }
  for (let i = 0; i < dim; i++) mean[i] /= vectors.length;
  return mean;
}

function subtract(a: number[], b: number[]): number[] {
  const out = new Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - (b[i] ?? 0);
  return out;
}

function tfIdfCosine(docA: string, docB: string, corpus: string[]): number {
  const docs = [docA, docB, ...corpus];
  const tokenized = docs.map(tokenize);
  const vocab = new Map<string, number>();
  const df = new Map<string, number>();
  tokenized.forEach((tokens) => {
    const uniq = new Set(tokens);
    for (const t of uniq) df.set(t, (df.get(t) || 0) + 1);
    for (const t of tokens) if (!vocab.has(t)) vocab.set(t, vocab.size);
  });
  const N = tokenized.length;
  const idf: number[] = new Array(vocab.size).fill(0);
  for (const [t, idx] of vocab) {
    const dfi = df.get(t) || 1;
    idf[idx] = Math.log((N + 1) / (dfi + 1)) + 1; // smoothed idf
  }
  function vec(tokens: string[]): number[] {
    const v = new Array(vocab.size).fill(0);
    for (const t of tokens) {
      const idx = vocab.get(t);
      if (idx === undefined) continue;
      v[idx] += 1;
    }
    for (let i = 0; i < v.length; i++) v[i] = v[i] * idf[i];
    return v;
  }
  const vA = vec(tokenized[0]);
  const vB = vec(tokenized[1]);
  return cosineSimilarity(vA, vB);
}

function percentile(scores: number[], value: number): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => a - b);
  let count = 0;
  for (const s of sorted) if (s <= value) count++;
  return count / sorted.length;
}

function pickTopOverlapKeywords(a: string, b: string, maxCount = 5): string[] {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  const overlap: string[] = [];
  for (const t of ta) if (tb.has(t)) overlap.push(t);
  return overlap.slice(0, maxCount);
}

export async function POST(req: NextRequest) {
  try {
    const { dreams, realEvent, topN = 3, method = 'hybrid', calibration = 'percentile' } = await req.json();
    if (!dreams || !realEvent) {
      return NextResponse.json({ error: '꿈 목록과 현실 사건이 필요합니다.' }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    // 1) 임베딩 준비: 현실 사건은 항상 생성, 꿈은 캐시(embedding) 있으면 재사용
    const dreamTexts = dreams.map((d: any) => `${d.title || ''}: ${d.content || ''}`);
    const needEmbedIdx: number[] = []
    const dreamVecs: (number[] | null)[] = dreams.map((d: any, i: number) => {
      if (Array.isArray(d.embedding) && d.embedding.length > 0) return d.embedding as number[]
      needEmbedIdx.push(i)
      return null
    })

    // 항상 realEvent 임베딩 + 필요한 꿈 임베딩만 요청
    const inputs: string[] = [realEvent, ...needEmbedIdx.map((i) => dreamTexts[i])]
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: inputs })
    })
    const embeddingData = await embeddingRes.json()
    if (!embeddingRes.ok || !embeddingData.data) {
      return NextResponse.json({ error: '임베딩 생성 실패', detail: embeddingData }, { status: 500 })
    }
    const returned = embeddingData.data.map((d: any) => d.embedding as number[])
    const realEventVec = returned[0]
    let cursor = 1
    for (const idx of needEmbedIdx) {
      dreamVecs[idx] = returned[cursor++]
    }
    // 타입 단언: 모두 채워짐
    const dreamVecsFilled = dreamVecs as number[][]

    // Centering (공통 성분 제거) 후 코사인
    const meanVec = meanVector([realEventVec, ...dreamVecsFilled]);
    const centeredReal = subtract(realEventVec, meanVec);
    const centeredDreams = dreamVecsFilled.map((v) => subtract(v, meanVec));

    // 3) TF-IDF 코사인 (문자 수준 의미 반영)
    const tfidfScores = dreamTexts.map((t) => tfIdfCosine(realEvent, t, dreamTexts));

    // 4) 유사도 집계: 임베딩 0.6 + TFIDF 0.4
    const embedScores = centeredDreams.map((v) => cosineSimilarity(centeredReal, v));
    const combined = embedScores.map((e, i) => 0.6 * e + 0.4 * (tfidfScores[i] || 0));

    // 5) 보정: 퍼센타일 스코어 사용 기본
    const calibrated = combined.map((s) => calibration === 'percentile' ? percentile(combined, s) : s);

    // 6) 결과 구성
    const scored = dreams.map((d: any, i: number) => {
      const overlap = pickTopOverlapKeywords(realEvent, `${d.title || ''} ${d.content || ''}`, 5);
      const matchScore = Math.round((calibrated[i] || 0) * 100);
      return {
        id: d.id || String(i + 1),
        dreamTitle: d.title || '제목 없음',
        dreamDate: d.date ? d.date : new Date().toISOString(),
        matchScore,
        matchedElements: overlap.length > 0 ? overlap : ['주요 키워드 일치가 적음'],
        aiAnalysis: `임베딩+키워드 기반 상대 점수입니다(퍼센타일). 공통 키워드: ${overlap.join(', ') || '없음'}`,
        _raw: {
          embed: embedScores[i] || 0,
          tfidf: tfidfScores[i] || 0,
          combined: combined[i] || 0,
        }
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scored.slice(0, topN);

    // 7) 선택적으로 Claude로 자연어 해설 생성 (키가 있을 때만)
    if (ANTHROPIC_API_KEY) {
      try {
        const explainPrompt = `현실 사건: ${realEvent}\n\n아래의 각 항목에 대해 왜 유사한지 2-3문장으로 설명하세요. JSON 배열로 반환하세요. 필드: id, aiAnalysis.\n\n${topMatches.map((m, i) => `(${i + 1}) 제목: ${m.dreamTitle}\n공통 키워드: ${m.matchedElements.join(', ')}`).join('\n\n')}`;
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 800,
            messages: [
              { role: 'user', content: explainPrompt }
            ]
          })
        });
        const claudeData = await claudeRes.json();
        try {
          const arr = JSON.parse(claudeData.content?.[0]?.text || claudeData.completion || '[]');
          if (Array.isArray(arr)) {
            const map = new Map<string, string>();
            for (const it of arr) if (it && it.id && it.aiAnalysis) map.set(String(it.id), String(it.aiAnalysis));
            for (const m of topMatches) if (map.has(m.id)) m.aiAnalysis = map.get(m.id)!;
          }
        } catch {}
      } catch {}
    }

    return NextResponse.json({ result: topMatches });
  } catch (err) {
    return NextResponse.json({ error: '서버 오류', detail: String(err) }, { status: 500 });
  }
}
