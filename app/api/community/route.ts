// /app/api/community/route.ts
// 데모 모드: 메모리 내 임시 데이터, 실제 배포 시 DB 연동
let DEMO_POSTS = [
  {
    id: "1",
    author: "익명1",
    content: "하늘을 나는 꿈을 꿨어요! 너무 자유로웠어요.",
    likes: 3,
    comments: [
      { id: "c1", author: "익명2", text: "저도 비슷한 꿈 꾼 적 있어요!" }
    ],
    createdAt: new Date().toISOString(),
  },
]
export async function GET() {
  return Response.json({ posts: DEMO_POSTS })
}
export async function POST(request: Request) {
  const { content, author } = await request.json()
  const newPost = {
    id: Date.now().toString(),
    author: author || "익명",
    content,
    likes: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  }
  DEMO_POSTS = [newPost, ...DEMO_POSTS]
  return Response.json({ post: newPost })
}
export async function PUT(request: Request) {
  const { postId, comment, like, userId } = await request.json();
  DEMO_POSTS = DEMO_POSTS.map((p) => {
    if (p.id !== postId) return p;
    // 좋아요 토글 처리
    let likedUserIds = p.likedUserIds || [];
    let likes = p.likes || 0;
    if (typeof like === "boolean" && userId) {
      const alreadyLiked = likedUserIds.includes(userId);
      if (like && !alreadyLiked) {
        likedUserIds = [...likedUserIds, userId];
        likes++;
      } else if (!like && alreadyLiked) {
        likedUserIds = likedUserIds.filter((uid) => uid !== userId);
        likes = Math.max(0, likes - 1);
      }
    }
    // 댓글 추가 처리
    let comments = p.comments;
    if (comment && userId) {
      const author = getAnonAuthor(comments, userId);
      comments = [
        ...comments,
        {
          id: Date.now().toString(),
          author,
          text: comment,
          userId,
        },
      ];
    }
    return {
      ...p,
      likes,
      likedUserIds,
      comments,
    };
  });
  return Response.json({ ok: true });
}

// 댓글 작성자 번호 계산 함수 (userId 기준, 글마다 독립)
function getAnonAuthor(comments, userId) {
  const authorMap = {};
  let count = 1;
  for (const c of comments) {
    if (c.userId && !authorMap[c.userId]) {
      authorMap[c.userId] = count++;
    }
  }
  if (authorMap[userId]) {
    return `익명${authorMap[userId]}`;
  }
  return `익명${count}`;
}
