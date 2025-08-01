import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, type } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY || 'sk-ant-api03—szzc9O0UVkk9yoRfWKd6OQ250jDGRystPJ4C1TxSpx3t6i-4Zr0YxFNxlkHA5XMH8Ov3QR40n9XoqDJkFYNnA-2chRvQAA';

  // Claude API endpoint (v2)
  const endpoint = 'https://api.anthropic.com/v1/messages';

  // 메시지 생성(텍스트/데자뷰)
  if (type === 'text' || type === 'dejavu') {
    const body = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: prompt }
      ]
    };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return NextResponse.json({ result: data.content?.[0]?.text || data.completion || '' });
  }

  // 이미지 생성(Claude Vision 등 확장 가능)
  if (type === 'image') {
    // Claude는 직접 이미지 생성 불가. 프롬프트를 Midjourney/Stable Diffusion 등으로 넘기는 구조 필요
    return NextResponse.json({ error: 'Claude API는 직접 이미지 생성을 지원하지 않습니다.' }, { status: 400 });
  }

  return NextResponse.json({ error: '지원하지 않는 type입니다.' }, { status: 400 });
}
