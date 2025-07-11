import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, Timestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'

// 익명 닉네임 생성 함수
function getAnonNickname(anonMap: Record<string, number>, userId: string) {
  if (!userId) return '익명'
  if (anonMap[userId]) return `익명${anonMap[userId]}`
  const used = Object.values(anonMap)
  const next = used.length ? Math.max(...used) + 1 : 1
  return `익명${next}`
}

export async function GET() {
  // Firestore에서 커뮤니티 글 불러오기
  const snap = await getDocs(collection(db, 'community'))
  const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  return Response.json({ posts })
}

export async function POST(request: Request) {
  const { content, authorId } = await request.json()
  // 새 글에는 anonMap을 생성, 작성자에게 익명1 부여
  const anonMap = authorId ? { [authorId]: 1 } : {}
  const nickname = authorId ? '익명1' : '익명'
  const ref = await addDoc(collection(db, 'community'), {
    authorId: authorId || '',
    nickname,
    anonMap,
    content,
    likes: 0,
    likedUserIds: [],
    comments: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  const post = { id: ref.id, authorId: authorId || '', nickname, content, likes: 0, comments: [], createdAt: new Date().toISOString() }
  return Response.json({ post })
}

export async function PUT(request: Request) {
  const { postId, comment, userId, like, recommend } = await request.json();
  if (!postId || (!comment && typeof like !== 'boolean' && typeof recommend !== 'boolean')) return Response.json({ ok: false, error: '필수 정보 누락' }, { status: 400 });

  const postRef = doc(db, 'community', postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return Response.json({ ok: false, error: '게시글 없음' }, { status: 404 });
  const postData = postSnap.data();
  let updated = {};

  // 댓글 추가 로직
  if (comment && userId) {
    const anonMap = postData.anonMap || {};
    let nickname = '';
    if (anonMap[userId]) {
      nickname = `익명${anonMap[userId]}`;
    } else {
      const used = Object.values(anonMap);
      const next = used.length ? Math.max(...used) + 1 : 1;
      nickname = `익명${next}`;
      anonMap[userId] = next;
    }
    const newComment = {
      id: Date.now().toString(),
      authorId: userId,
      nickname,
      text: comment,
      createdAt: new Date().toISOString(),
    };
    const comments = Array.isArray(postData.comments) ? [...postData.comments, newComment] : [newComment];
    updated = { ...updated, comments, anonMap };
  }

  // 좋아요 토글 로직
  if (typeof like === 'boolean' && userId) {
    let likedUserIds = Array.isArray(postData.likedUserIds) ? [...postData.likedUserIds] : [];
    let likes = postData.likes || 0;
    const alreadyLiked = likedUserIds.includes(userId);
    if (like && !alreadyLiked) {
      likedUserIds.push(userId);
      likes++;
    } else if (!like && alreadyLiked) {
      likedUserIds = likedUserIds.filter((uid) => uid !== userId);
      likes = Math.max(0, likes - 1);
    }
    updated = { ...updated, likedUserIds, likes };
  }

  // 추천(따봉) 토글 로직
  if (typeof recommend === 'boolean' && userId) {
    let recommendedUserIds = Array.isArray(postData.recommendedUserIds) ? [...postData.recommendedUserIds] : [];
    let recommends = postData.recommends || 0;
    const alreadyRecommended = recommendedUserIds.includes(userId);
    if (recommend && !alreadyRecommended) {
      recommendedUserIds.push(userId);
      recommends++;
    } else if (!recommend && alreadyRecommended) {
      recommendedUserIds = recommendedUserIds.filter((uid) => uid !== userId);
      recommends = Math.max(0, recommends - 1);
    }
    updated = { ...updated, recommendedUserIds, recommends };
  }

  if (Object.keys(updated).length > 0) {
    await updateDoc(postRef, {
      ...updated,
      updatedAt: Timestamp.now(),
    });
  }

  return Response.json({
    ok: true,
    comment: updated.comments ? updated.comments.slice(-1)[0] : undefined,
    likes: updated.likes,
    likedUserIds: updated.likedUserIds,
    recommends: updated.recommends,
    recommendedUserIds: updated.recommendedUserIds,
  });
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

// PUT(댓글/좋아요/익명번호)은 다음 단계에서 Firestore 연동으로 추가 예정
