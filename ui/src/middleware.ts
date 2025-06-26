import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parse } from "cookie";

const AUTHENTICATED_PATHS_ONLY = ["/myaccount", "/download", "/admin", "/owner"];
const UNAUTHENTICATED_PATHS_ONLY = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = parse(cookieHeader);
  const token = cookies["token"];

  if (pathname === "/logout") return NextResponse.next();

  const needsAuth = AUTHENTICATED_PATHS_ONLY.some((path) => pathname.startsWith(path));
  const noAuth = UNAUTHENTICATED_PATHS_ONLY.includes(pathname);

  if (needsAuth && !token) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (noAuth && token) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/myaccount/:path*",
    "/download/:path*",
    "/admin/:path*",
    "/owner/:path*",
    "/login",
    "/register",
    "/logout",
  ],
};
