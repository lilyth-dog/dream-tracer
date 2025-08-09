import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: '서버 설정 오류: OPENAI_API_KEY 미설정' }, { status: 500 });
  }

  const { prompt, style } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: '프롬프트가 필요합니다.' }, { status: 400 });
  }

  // 스타일별 프롬프트 보정
  let stylePrompt = '';
  switch (style) {
    case 'realistic': stylePrompt = 'realistic, highly detailed, photo-like'; break;
    case 'artistic': stylePrompt = 'artistic, painting, beautiful colors'; break;
    case 'dreamy': stylePrompt = 'dreamy, soft, surreal, ethereal'; break;
    case 'fantasy': stylePrompt = 'fantasy, magical, imaginative'; break;
    case 'minimalist': stylePrompt = 'minimalist, clean, simple'; break;
    case 'surreal': stylePrompt = 'surreal, Dali style, strange, dreamlike'; break;
    default: stylePrompt = '';
  }
  const fullPrompt = `${prompt}${stylePrompt ? ', ' + stylePrompt : ''}`;

  // OpenAI DALL·E 3 API 호출
  const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
    })
  });
  const dalleData = await dalleRes.json();
  if (!dalleData.data || !dalleData.data[0]?.url) {
    return NextResponse.json({ error: '이미지 생성 실패', detail: dalleData }, { status: 500 });
  }
  return NextResponse.json({ imageUrl: dalleData.data[0].url });
}
