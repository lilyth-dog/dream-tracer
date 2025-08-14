import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, Timestamp, doc, getDoc, updateDoc, query, orderBy, limit as fbLimit, startAfter, runTransaction } from 'firebase/firestore'

// 익명 닉네임 생성 함수
function getAnonNickname(anonMap: Record<string, number>, userId: string) {
  if (!userId) return '익명'
  if (anonMap[userId]) return `익명${anonMap[userId]}`
  const used = Object.values(anonMap)
  const next = used.length ? Math.max(...used) + 1 : 1
  return `익명${next}`
}

export async function GET(request: Request) {
  // 페이지네이션: 최신 정렬 → ?limit=20&cursorMs=1700000000000
  // 인기 정렬 → ?sort=popular&limit=20&windowHours=72&offset=0
  const { searchParams } = new URL(request.url)
  const pageSize = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
  const sort = (searchParams.get('sort') || 'recent').toLowerCase()
  const reportsOnly = searchParams.get('reportsOnly') === '1'
  const actor = (searchParams.get('actor') || '').trim()

  // 관계 필터 로드: 배우자(요청자)의 뮤트/차단 목록
  let mutedSet = new Set<string>()
  let blockedSet = new Set<string>()
  if (actor) {
    try {
      const actorRef = doc(db, 'users', actor)
      const actorSnap = await getDoc(actorRef)
      if (actorSnap.exists()) {
        const data: any = actorSnap.data() || {}
        const muted: string[] = Array.isArray(data.mutedUserIds) ? data.mutedUserIds : []
        const blocked: string[] = Array.isArray(data.blockedUserIds) ? data.blockedUserIds : []
        mutedSet = new Set(muted)
        blockedSet = new Set(blocked)
      }
    } catch {
      // ignore
    }
  }

  // 신고 목록 전용(임시 관리자 키 필요)
  if (reportsOnly) {
    const adminKey = request.headers.get('x-admin-key') || ''
    const expected = process.env.ADMIN_DASH_TOKEN || ''
    if (!expected || adminKey !== expected) {
      return Response.json({ ok: false, error: '권한 없음' }, { status: 403 })
    }
    const q = query(collection(db, 'community'), orderBy('createdAt', 'desc'), fbLimit(500))
    const snap = await getDocs(q)
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
    const reported = items.filter(p => (p.reports || 0) > 0 || !!p.hidden)
    reported.sort((a, b) => (b.reports || 0) - (a.reports || 0))
    return Response.json({ ok: true, posts: reported.slice(0, pageSize) })
  }

  if (sort === 'popular') {
    const windowHours = Math.max(parseInt(searchParams.get('windowHours') || '72', 10), 1)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
    // 최근 N개 문서를 불러와 서버에서 점수 계산 후 정렬 (간이 구현)
    const fetchCount = Math.max(pageSize + offset, 200)
    const q = query(collection(db, 'community'), orderBy('createdAt', 'desc'), fbLimit(fetchCount))
    const snap = await getDocs(q)
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
    const nowMs = Date.now()
    // 점수: likes, 시간 감쇠: exp(-ageHours/windowHours)
    const scored = items.map((p) => {
      const createdAtMs = p.createdAt?.toMillis?.() || (typeof p.createdAt === 'number' ? p.createdAt : nowMs)
      const ageHours = Math.max(1, (nowMs - createdAtMs) / (1000 * 60 * 60))
      const base = (p.likes || 0) // 하트만 집계
      const decay = Math.exp(-ageHours / windowHours)
      return { post: p, score: base * decay }
    })
    scored.sort((a, b) => b.score - a.score)
    const page = scored
      .map(s => s.post)
      .filter((p: any) => !mutedSet.has(p.authorId) && !blockedSet.has(p.authorId))
      .slice(offset, offset + pageSize)
    const nextOffset = offset + page.length
    return Response.json({ posts: page, nextOffset })
  }

  // 기본: 최신 정렬
  const cursorMs = searchParams.get('cursorMs')
  let q = query(collection(db, 'community'), orderBy('createdAt', 'desc'), fbLimit(pageSize))
  if (cursorMs) {
    const ts = Timestamp.fromMillis(Number(cursorMs))
    q = query(collection(db, 'community'), orderBy('createdAt', 'desc'), startAfter(ts), fbLimit(pageSize))
  }
  // 데모 모드: Firebase 키가 데모값이면 샘플 데이터 반환하여 UI가 비어 보이지 않도록 처리
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''
  const isDemo = !apiKey || apiKey === "demo-api-key" || apiKey === "demo"
  if (isDemo) {
    const now = Date.now()
    let demo = Array.from({ length: 10 }, (_, i) => ({
      id: `demo-${i + 1}-${now}`,
      content: i === 0 ? '데모 커뮤니티 글입니다. 안녕하세요!' : `데모 글 #${i + 1}`,
      likes: Math.floor(Math.random() * 6),
      comments: [],
      createdAt: now - i * 3600_000,
      nickname: `익명${i + 1}`,
      authorId: `demo-author-${(i%3)+1}`,
    })) as any[]
    if (actor && (mutedSet.size || blockedSet.size)) {
      demo = demo.filter(p => !mutedSet.has(p.authorId) && !blockedSet.has(p.authorId))
    }
    return Response.json({ posts: demo, nextCursorMs: null })
  }
  const snap = await getDocs(q)
  const posts = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((p: any) => !mutedSet.has(p.authorId) && !blockedSet.has(p.authorId))
  const last = snap.docs[snap.docs.length - 1]
  const nextCursorMs = last ? (last.data().createdAt?.toMillis?.() || null) : null
  return Response.json({ posts, nextCursorMs })
}

export async function POST(request: Request) {
  const { content, authorId, isPublicProfile } = await request.json()
  // 간단 레이트리밋: 60초에 최대 10회 (authorId 또는 IP 기준)
  try {
    await rateLimit('community-post', request, authorId || '', 10, 60_000)
  } catch (e) {
    return Response.json({ ok: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  const text = filterBadWords((content || '').trim())
  if (text.length < 5) return Response.json({ ok: false, error: '내용은 5자 이상이어야 합니다.' }, { status: 400 })
  if (text.length > 2000) return Response.json({ ok: false, error: '내용은 2000자를 넘을 수 없습니다.' }, { status: 400 })

  const anonMap = authorId ? { [authorId]: 1 } : {}
  const nickname = authorId ? '익명1' : '익명'
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, 'community'), {
    authorId: authorId || '',
    nickname,
    anonMap,
    content: text,
    isPublicProfile: !!isPublicProfile,
    likes: 0,
    likedUserIds: [],
    comments: [],
    reports: 0,
    reportedUserIds: [],
    hidden: false,
    createdAt: now,
    updatedAt: now,
  })
  const post = { id: ref.id, authorId: authorId || '', nickname, content: text, isPublicProfile: !!isPublicProfile, likes: 0, comments: [], reports: 0, hidden: false, createdAt: now.toMillis() }
  return Response.json({ ok: true, post })
}

export async function PUT(request: Request) {
  const { postId, comment, userId, like, report, isPublicProfile, reason } = await request.json();
  if (!postId || (!comment && typeof like !== 'boolean' && typeof report !== 'boolean')) return Response.json({ ok: false, error: '필수 정보 누락' }, { status: 400 });
  // 간단 레이트리밋: 60초에 최대 30회 (userId 또는 IP 기준)
  try {
    await rateLimit('community-put', request, userId || '', 30, 60_000)
  } catch (e) {
    return Response.json({ ok: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  const postRef = doc(db, 'community', postId);

  let createdComment: any | undefined = undefined
  let likesOut: number | undefined
  let likedUserIdsOut: string[] | undefined
  let reportsOut: number | undefined
  let reportedUserIdsOut: string[] | undefined
  let hiddenOut: boolean | undefined

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef)
    if (!snap.exists()) throw new Error('게시글 없음')
    const data: any = snap.data()

    const next: any = { updatedAt: Timestamp.now() }

    // 댓글
    if (comment && userId) {
      const clean = filterBadWords(String(comment))
      const anonMap = data.anonMap || {}
      let nickname = ''
      if (anonMap[userId]) {
        nickname = `익명${anonMap[userId]}`
      } else {
        const used = Object.values(anonMap as Record<string, number>) as number[]
        const nxt = used.length ? Math.max(...used) + 1 : 1
        anonMap[userId] = nxt
        nickname = `익명${nxt}`
      }
      createdComment = {
        id: Date.now().toString(),
        authorId: userId,
        nickname,
        text: comment,
        isPublicProfile: !!isPublicProfile,
        createdAt: new Date().toISOString(),
      }
      const comments = Array.isArray(data.comments) ? [...data.comments, createdComment] : [createdComment]
      next.comments = comments
      next.anonMap = anonMap
    }

    // 좋아요
    if (typeof like === 'boolean' && userId) {
      let likedUserIds: string[] = Array.isArray(data.likedUserIds) ? [...data.likedUserIds] : []
      const already = likedUserIds.includes(userId)
      if (like && !already) likedUserIds.push(userId)
      if (!like && already) likedUserIds = likedUserIds.filter((u) => u !== userId)
      next.likedUserIds = likedUserIds
      next.likes = likedUserIds.length
      likesOut = next.likes
      likedUserIdsOut = likedUserIds
      // 감사 로그
      await addDoc(collection(db, 'auditLogs'), {
        action: like ? 'like' : 'unlike',
        postId,
        actorUserId: userId,
        at: Timestamp.now(),
      })
    }

    // 신고 토글
    if (typeof report === 'boolean' && userId) {
      let reportedUserIds: string[] = Array.isArray(data.reportedUserIds) ? [...data.reportedUserIds] : []
      const already = reportedUserIds.includes(userId)
      if (report && !already) reportedUserIds.push(userId)
      if (!report && already) reportedUserIds = reportedUserIds.filter((u) => u !== userId)
      next.reportedUserIds = reportedUserIds
      next.reports = reportedUserIds.length
      // 자동 숨김 규칙: ENV 또는 기본 3회
      const threshold = Number(process.env.REPORT_HIDE_THRESHOLD || 3)
      next.hidden = (reportedUserIds.length >= threshold) || !!data.hidden
      reportsOut = next.reports
      reportedUserIdsOut = reportedUserIds
      hiddenOut = next.hidden
      await addDoc(collection(db, 'auditLogs'), {
        action: report ? 'report' : 'unreport',
        postId,
        actorUserId: userId,
        at: Timestamp.now(),
        hidden: next.hidden,
        reports: next.reports,
        reason: report ? (String(reason||'').slice(0,200) || undefined) : undefined,
      })
    }

    if (Object.keys(next).length > 1) {
      tx.update(postRef, next)
    }
  })

  return Response.json({
    ok: true,
    comment: createdComment,
    likes: likesOut,
    likedUserIds: likedUserIdsOut,
    reports: reportsOut,
    reportedUserIds: reportedUserIdsOut,
    hidden: hiddenOut,
  })
}

// ===== Helpers =====
function getClientKey(req: Request, fallbackId: string) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim()
  return fallbackId || ip || 'unknown'
}

async function rateLimit(bucket: string, req: Request, userOrIp: string, limit: number, windowMs: number) {
  const key = `${bucket}:${getClientKey(req, userOrIp)}`
  const ref = doc(db, 'ratelimits', key)
  const now = Date.now()
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.exists() ? (snap.data() as any) : { hits: [] }
    const hits: number[] = Array.isArray(data.hits) ? data.hits : []
    const cutoff = now - windowMs
    const recent = hits.filter((t) => typeof t === 'number' && t >= cutoff)
    if (recent.length >= limit) {
      throw new Error('rate_limited')
    }
    recent.push(now)
    if (snap.exists()) {
      tx.update(ref, { hits: recent, updatedAt: Timestamp.now(), windowMs })
    } else {
      tx.set(ref, { hits: recent, updatedAt: Timestamp.now(), windowMs })
    }
  })
}

// 금칙어 필터 (간단 한국어/영문 목록, 부분 일치 방지 위해 토큰화 후 처리)
const BAD_WORDS = [
  '욕설', '비속어', '비하', '혐오',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick'
]

function tokenizeSimple(s: string) {
  return (s || '').toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/).filter(Boolean)
}

function filterBadWords(text: string) {
  const tokens = tokenizeSimple(text)
  const badSet = new Set(BAD_WORDS.map(w => w.toLowerCase()))
  let changed = false
  const masked = tokens.map(t => {
    if (badSet.has(t)) {
      changed = true
      return t[0] + '*'.repeat(Math.max(0, t.length - 1))
    }
    return t
  })
  return changed ? masked.join(' ') : text
}

export async function DELETE(request: Request) {
  const { postId, userId } = await request.json();
  if (!postId || !userId) return Response.json({ ok: false, error: '필수 정보 누락' }, { status: 400 });

  const postRef = doc(db, 'community', postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return Response.json({ ok: false, error: '게시글 없음' }, { status: 404 });
  const postData = postSnap.data();

  if (postData.authorId !== userId) {
    return Response.json({ ok: false, error: '본인 글만 삭제할 수 있습니다.' }, { status: 403 });
  }

  await postRef.delete ? postRef.delete() : await import('firebase/firestore').then(m => m.deleteDoc(postRef));
  return Response.json({ ok: true });
}

// 사용자 차단/뮤트 관리 (admin or user)
export async function PATCH(request: Request) {
  const { action, targetUserId, actorUserId, postId } = await request.json();
  if (!action || !actorUserId) return Response.json({ ok: false, error: '필수 정보 누락' }, { status: 400 });

  // 차단/뮤트는 users 컬렉션의 관계 필드에 저장
  const actorRef = doc(db, 'users', actorUserId)
  const actorSnap = await getDoc(actorRef)
  const actor = actorSnap.exists() ? actorSnap.data() as any : {}

  if (action === 'mute' || action === 'unmute') {
    if (!targetUserId) return Response.json({ ok: false, error: '대상 사용자 없음' }, { status: 400 })
    const current: string[] = Array.isArray(actor.mutedUserIds) ? actor.mutedUserIds : []
    const next = new Set(current)
    if (action === 'mute') next.add(targetUserId)
    if (action === 'unmute') next.delete(targetUserId)
    await updateDoc(actorRef, { mutedUserIds: Array.from(next), updatedAt: Timestamp.now() })
    await addDoc(collection(db, 'auditLogs'), { action, actorUserId, targetUserId, at: Timestamp.now() })
    return Response.json({ ok: true, mutedUserIds: Array.from(next) })
  }

  if (action === 'block' || action === 'unblock') {
    if (!targetUserId) return Response.json({ ok: false, error: '대상 사용자 없음' }, { status: 400 })
    const current: string[] = Array.isArray(actor.blockedUserIds) ? actor.blockedUserIds : []
    const next = new Set(current)
    if (action === 'block') next.add(targetUserId)
    if (action === 'unblock') next.delete(targetUserId)
    await updateDoc(actorRef, { blockedUserIds: Array.from(next), updatedAt: Timestamp.now() })
    await addDoc(collection(db, 'auditLogs'), { action, actorUserId, targetUserId, at: Timestamp.now() })
    return Response.json({ ok: true, blockedUserIds: Array.from(next) })
  }

  if (action === 'hide-post' || action === 'unhide-post') {
    // 관리자만: 헤더 키 확인
    const adminKey = request.headers.get('x-admin-key') || ''
    const expected = process.env.ADMIN_DASH_TOKEN || ''
    if (!expected || adminKey !== expected) {
      return Response.json({ ok: false, error: '권한 없음' }, { status: 403 })
    }
    if (!postId) return Response.json({ ok: false, error: 'postId 필요' }, { status: 400 })
    const postRef = doc(db, 'community', postId)
    await updateDoc(postRef, { hidden: action === 'hide-post', updatedAt: Timestamp.now() })
    await addDoc(collection(db, 'auditLogs'), { action, actorUserId, postId, at: Timestamp.now() })
    return Response.json({ ok: true, hidden: action === 'hide-post' })
  }

  return Response.json({ ok: false, error: '알 수 없는 action' }, { status: 400 })
}
