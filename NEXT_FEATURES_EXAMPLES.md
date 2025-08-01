# Lucid Dream Diary - 프로필 기능 상세 설계 및 AI 도움 기능 예시 UI

## 1. 프로필 기능 상세 설계

### 1) 프로필 화면 예시 레이아웃

- 상단: 프로필 사진(아바타) + 닉네임
- 이메일(수정 불가)
- 자기소개/한 줄 소개(선택)
- 꿈 관련 선호 태그(선택)
- 비밀번호 변경(현재/새/확인)
- 로그아웃 버튼
- (데모 모드 안내)

### 2) 프로필 화면 예시 UI 코드 (Next.js + Tailwind)

```tsx
<Card className="max-w-lg mx-auto mt-8">
  <CardHeader className="flex flex-col items-center gap-2">
    <Avatar src={user.photoURL} />
    <h2 className="text-xl font-bold">{user.displayName || "닉네임"}</h2>
    <p className="text-gray-500 text-sm">{user.email}</p>
    <p className="text-xs text-blue-500">{isDemoMode && "데모 모드: 정보가 임시로만 저장됩니다."}</p>
  </CardHeader>
  <CardContent className="space-y-4">
    <Label>자기소개</Label>
    <Input value={profile.intro} onChange={...} />
    <Label>선호 태그</Label>
    <Input value={profile.tags} onChange={...} />
    <form onSubmit={handlePasswordChange} className="space-y-2">
      <Label>비밀번호 변경</Label>
      <Input type="password" placeholder="현재 비밀번호" />
      <Input type="password" placeholder="새 비밀번호" />
      <Input type="password" placeholder="새 비밀번호 확인" />
      <Button>비밀번호 변경</Button>
    </form>
    <Button variant="outline" onClick={handleLogout}>로그아웃</Button>
  </CardContent>
</Card>
```

---

## 2. AI 도움 기능 예시 UI/UX

### 1) AI 챗봇/도우미 플로팅 버튼
- 우측 하단에 AI 아이콘(예: 🤖) 플로팅 버튼
- 클릭 시 챗봇 창 오픈, "꿈 기록 팁", "자동 태그 추천", "꿈 해석 질문" 등 대화 가능

### 2) 꿈 작성/해석/시각화 화면 내 AI 도움말 버튼
- 각 주요 입력 폼 옆에 "AI 도움받기" 버튼
- 클릭 시 팝오버/모달로 AI 답변 표시

### 3) 예시 챗봇 UI 코드
```tsx
<Button className="fixed bottom-6 right-6 rounded-full shadow-lg" onClick={openChatbot}>
  <span role="img" aria-label="ai">🤖</span>
</Button>
{showChatbot && (
  <div className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-xl p-4">
    <h3 className="font-bold mb-2">AI 도우미</h3>
    <ChatHistory ... />
    <Input value={input} onChange={...} onKeyDown={...} placeholder="AI에게 물어보세요..." />
    <Button onClick={sendToAI}>전송</Button>
  </div>
)}
```

---

## 3. 추가 필요/추천 기능
- 프로필/AI 도움말 모두 모바일 대응 UI
- 꿈 일기/통계 내보내기(다운로드)
- 커뮤니티/공유 기능(익명, 댓글, 공감)
- 알림/리마인더(꿈 기록 유도)
- 접근성(키보드, 스크린리더 등)

---

## 4. 사용자 시나리오 기반 점검
- 신규 사용자가 데모 모드로 앱에 접속 → 프로필에서 닉네임/사진/소개 임시 변경
- 꿈 작성 중 "AI 도움받기" 클릭 → 기록 팁/자동 태그/프롬프트 추천
- 꿈 저장 후 AI 해석/시각화 → 결과 확인 및 저장
- 꿈 통계에서 AI가 반복 테마/감정 등 인사이트 제공
- 꿈을 커뮤니티에 공유, 다른 사용자의 꿈에 공감/댓글

---

> 위 예시 UI/코드를 참고해 실제 구현을 진행하면 됩니다. 추가 설계/코드가 필요하면 요청해 주세요.
