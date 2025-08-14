import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const actor = (searchParams.get('actor') || '').trim()
    if (!actor) return Response.json({ ok: false, error: 'actor required' }, { status: 400 })
    const ref = doc(db, 'users', actor)
    const snap = await getDoc(ref)
    const data: any = snap.exists() ? (snap.data() || {}) : {}
    const mutedUserIds: string[] = Array.isArray(data.mutedUserIds) ? data.mutedUserIds : []
    const blockedUserIds: string[] = Array.isArray(data.blockedUserIds) ? data.blockedUserIds : []
    return Response.json({ ok: true, mutedUserIds, blockedUserIds })
  } catch (e) {
    return Response.json({ ok: false, error: 'failed' }, { status: 500 })
  }
}


