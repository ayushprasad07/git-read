import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function proxy(request : NextRequest){
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const url = request.nextUrl.clone();

    if(url.pathname==='/'){
        url.pathname = "/sign-in"
        return NextResponse.redirect(url);
    }

    if (token && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    if (!token && (url.pathname.startsWith('/dashboard'))) {
        url.pathname = '/sign-in';
        return NextResponse.redirect(url);
    }

}

export const config = {
  matcher: [
    '/', 
    '/sign-in',
    '/sign-up',
    '/dashboard/:path*',
    '/verify/:path*',
  ],
};
