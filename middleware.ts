import { NextResponse } from 'next/server'

export function middleware(req: Request) {
  const url = new URL(req.url)
  if (url.pathname.startsWith('/admin')) {
    const cookieHeader = (req.headers.get('cookie') || '')
    const cookies = Object.fromEntries(cookieHeader.split(';').map(v => v.trim().split('='))) as Record<string, string>
    const key = cookies['admin_key'] || ''
    const expected = process.env.ADMIN_DASH_TOKEN || ''
    if (!expected || key !== expected) {
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}


