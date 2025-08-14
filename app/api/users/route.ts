import { db } from '@/lib/firebase'
import { collection, getDocs, query, limit as fbLimit } from 'firebase/firestore'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const pageSize = Math.min(parseInt(searchParams.get('limit') || '10', 10), 25)

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''
    const isDemo = !apiKey || apiKey === 'demo' || apiKey === 'demo-api-key'
    if (isDemo) {
      const demo = [
        { uid: 'demo-author-1', displayName: 'Dreamer One', email: 'demo1@example.com', photoURL: '' },
        { uid: 'demo-author-2', displayName: 'Dreamer Two', email: 'demo2@example.com', photoURL: '' },
        { uid: 'demo-author-3', displayName: 'Dreamer Three', email: 'demo3@example.com', photoURL: '' },
      ]
      const filtered = q
        ? demo.filter(u => `${u.displayName} ${u.email}`.toLowerCase().includes(q)).slice(0, pageSize)
        : demo.slice(0, pageSize)
      return Response.json({ ok: true, users: filtered })
    }

    // 간단 전체 스캔 후 로컬 필터(규모 커지면 인덱스 설계 필요)
    const snap = await getDocs(query(collection(db, 'users'), fbLimit(500)))
    const users = snap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }))
    const filtered = q
      ? users.filter(u => `${u.displayName||''} ${u.email||''}`.toLowerCase().includes(q)).slice(0, pageSize)
      : users.slice(0, pageSize)
    return Response.json({ ok: true, users: filtered })
  } catch (e) {
    return Response.json({ ok: false, error: 'failed' }, { status: 500 })
  }
}


