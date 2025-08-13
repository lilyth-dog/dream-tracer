import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY 미설정' }, { status: 500 })
    const { dreamId, title, content } = await req.json()
    if (!dreamId || (!title && !content)) {
      return NextResponse.json({ ok: false, error: 'dreamId와 제목/내용 중 하나 이상 필요' }, { status: 400 })
    }
    const text = `${title || ''}: ${content || ''}`.trim()
    if (text.length === 0) return NextResponse.json({ ok: false, error: '텍스트 없음' }, { status: 400 })

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
    })
    const data = await res.json()
    if (!res.ok || !data?.data?.[0]?.embedding) {
      return NextResponse.json({ ok: false, error: '임베딩 생성 실패', detail: data }, { status: 500 })
    }
    const embedding: number[] = data.data[0].embedding
    await updateDoc(doc(db, 'dreams', dreamId), { embedding, updatedAt: Timestamp.now() })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}


