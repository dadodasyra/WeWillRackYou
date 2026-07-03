import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = ["/login", "/api/auth"];

const NO_INDEX_HEADER = "noindex, nofollow, noarchive, nosnippet";

function withNoIndex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", NO_INDEX_HEADER);
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublic) {
    if (pathname === "/login" && req.auth) {
      return withNoIndex(NextResponse.redirect(new URL("/", req.url)));
    }
    return withNoIndex(NextResponse.next());
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withNoIndex(NextResponse.redirect(loginUrl));
  }

  if (pathname.startsWith("/admin") && req.auth.user?.role !== "ADMIN") {
    return withNoIndex(NextResponse.redirect(new URL("/", req.url)));
  }

  return withNoIndex(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
