import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Middleware for route protection using NextAuth.
 * Runs at the edge before page rendering.
 * 
 * - Redirects unauthenticated users away from /dashboard to /
 * - Redirects authenticated users from / to /dashboard
 */
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  // Redirect unauthenticated users trying to access /dashboard
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect authenticated users away from home to dashboard
  if (req.nextUrl.pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

// Configure which routes the middleware runs on
export const config = {
  matcher: ["/", "/dashboard/:path*"],
};

